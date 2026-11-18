import { and, asc, eq, max, ne, sql } from "drizzle-orm";
import type { Db, Tx } from "@/db";
import { cartaoDeRevisao, ciclo, materia, registroDeEstudo, topico } from "@/db/schema";
import { hojeEmBrasilia } from "@/dia";
import { LIMITES_DO_TOPICO } from "@/dominio";
import { NaoEncontradoError, ValidacaoError } from "./erros";
import type { Usuario } from "./usuario";

const { nomeMaximo, importacaoMaxima } = LIMITES_DO_TOPICO;

export type TopicoDaMateria = { id: string; nome: string; estudado: boolean; registros: number;
  /** Dia (AAAA-MM-DD, Brasília) da próxima revisão do Cartão, ou nulo se não há Cartão ou ele não tem data. */
  proximaRevisao: string | null;
};

export type MateriaComTopicos = {
  id: string;
  nome: string;
  ciclo: { id: string; nome: string };
  topicos: TopicoDaMateria[];
  estudados: number;
  total: number;
};

const NOME_INVALIDO = `O nome do tópico precisa ter de 1 a ${nomeMaximo} caracteres.`;
const NOME_REPETIDO = "Já existe um tópico com este nome nesta matéria.";

function nomeValido(bruto: string) {
  const nome = bruto.trim();
  const tamanho = [...nome].length; // caracteres, não unidades UTF-16
  if (tamanho < 1 || tamanho > nomeMaximo) throw new ValidacaoError(NOME_INVALIDO);
  return nome;
}

/** A Matéria do Usuário, travada até o fim da transação: criações e importações simultâneas não repetem posição. */
async function travarMateria(tx: Tx, usuario: Usuario, materiaId: string) {
  const [alvo] = await tx
    .select({ id: materia.id, nome: materia.nome, cicloId: materia.cicloId, cicloNome: ciclo.nome })
    .from(materia)
    .innerJoin(ciclo, eq(ciclo.id, materia.cicloId))
    .where(and(eq(materia.id, materiaId), eq(ciclo.usuarioId, usuario.id)))
    .for("update", { of: materia });
  if (!alvo) throw new NaoEncontradoError("Matéria");
  return alvo;
}

/** O Tópico do Usuário; a Matéria dele fica travada. */
async function travarTopico(tx: Tx, usuario: Usuario, topicoId: string) {
  const [alvo] = await tx
    .select({ id: topico.id, materiaId: topico.materiaId })
    .from(topico)
    .innerJoin(materia, eq(materia.id, topico.materiaId))
    .innerJoin(ciclo, eq(ciclo.id, materia.cicloId))
    .where(and(eq(topico.id, topicoId), eq(ciclo.usuarioId, usuario.id)));
  if (!alvo) throw new NaoEncontradoError("Tópico");
  await travarMateria(tx, usuario, alvo.materiaId);
  return alvo;
}

async function proximaPosicao(tx: Tx, materiaId: string) {
  const [{ ultima }] = await tx.select({ ultima: max(topico.posicao) }).from(topico).where(eq(topico.materiaId, materiaId));
  return (ultima ?? -1) + 1;
}

export async function obterMateria(db: Db, usuario: Usuario, cicloId: string, materiaId: string): Promise<MateriaComTopicos> {
  return db.transaction(
    async (tx) => {
      const [alvo] = await tx
        .select({ id: materia.id, nome: materia.nome, cicloId: ciclo.id, cicloNome: ciclo.nome })
        .from(materia)
        .innerJoin(ciclo, eq(ciclo.id, materia.cicloId))
        .where(and(eq(materia.id, materiaId), eq(ciclo.id, cicloId), eq(ciclo.usuarioId, usuario.id)));
      if (!alvo) throw new NaoEncontradoError("Matéria");
      const topicos = await tx
        .select({
          id: topico.id,
          nome: topico.nome,
          estudado: topico.estudado,
          registros: sql<number>`count(${registroDeEstudo.id})::int`,
          proximaRevisao: cartaoDeRevisao.proximaRevisao,
        })
        .from(topico)
        .leftJoin(registroDeEstudo, eq(registroDeEstudo.topicoId, topico.id))
        .leftJoin(cartaoDeRevisao, eq(cartaoDeRevisao.topicoId, topico.id))
        .where(eq(topico.materiaId, materiaId))
        .groupBy(topico.id, cartaoDeRevisao.topicoId)
        .orderBy(asc(topico.posicao));
      return {
        id: alvo.id,
        nome: alvo.nome,
        ciclo: { id: alvo.cicloId, nome: alvo.cicloNome },
        topicos: topicos.map((t) => ({ ...t, proximaRevisao: t.proximaRevisao && hojeEmBrasilia(t.proximaRevisao) })),
        estudados: topicos.filter((t) => t.estudado).length,
        total: topicos.length,
      };
    },
    { isolationLevel: "repeatable read", accessMode: "read only" },
  );
}

export async function criarTopico(db: Db, usuario: Usuario, materiaId: string, dados: { nome: string }): Promise<{ id: string }> {
  const nome = nomeValido(dados.nome);
  return db.transaction(async (tx) => {
    await travarMateria(tx, usuario, materiaId);
    const [novo] = await tx
      .insert(topico)
      .values({ materiaId, nome, posicao: await proximaPosicao(tx, materiaId) })
      .onConflictDoNothing()
      .returning({ id: topico.id });
    if (!novo) throw new ValidacaoError(NOME_REPETIDO);
    return novo;
  });
}

export async function renomearTopico(db: Db, usuario: Usuario, topicoId: string, dados: { nome: string }) {
  const nome = nomeValido(dados.nome);
  await db.transaction(async (tx) => {
    const { materiaId } = await travarTopico(tx, usuario, topicoId);
    const [igual] = await tx
      .select({ id: topico.id })
      .from(topico)
      .where(and(eq(topico.materiaId, materiaId), sql`lower(${topico.nome}) = lower(${nome})`, ne(topico.id, topicoId)));
    if (igual) throw new ValidacaoError(NOME_REPETIDO);
    await tx.update(topico).set({ nome }).where(eq(topico.id, topicoId));
  });
}

/** Os Registros de estudo do Tópico ficam, sem conteúdo (AD-009). */
export async function excluirTopico(db: Db, usuario: Usuario, topicoId: string) {
  await db.transaction(async (tx) => {
    await travarTopico(tx, usuario, topicoId);
    await tx.delete(topico).where(eq(topico.id, topicoId));
  });
}

export async function marcarTopico(db: Db, usuario: Usuario, topicoId: string, estudado: boolean) {
  await db.transaction(async (tx) => {
    await travarTopico(tx, usuario, topicoId);
    await tx.update(topico).set({ estudado }).where(eq(topico.id, topicoId));
  });
}

/** Um Tópico por linha, depois dos existentes; linhas vazias e repetidas (entre si e contra a Matéria) são ignoradas. */
export async function importarTopicos(db: Db, usuario: Usuario, materiaId: string, dados: { texto: string }): Promise<{ importados: number; ignorados: number }> {
  const linhas = dados.texto.split(/\r?\n/).map((linha, i) => ({ nome: linha.trim(), numero: i + 1 })).filter((l) => l.nome !== "");
  if (linhas.length === 0) throw new ValidacaoError("Nada para importar.");
  const longa = linhas.find((l) => [...l.nome].length > nomeMaximo);
  if (longa) throw new ValidacaoError(`A linha ${longa.numero} passa de ${nomeMaximo} caracteres.`);
  const vistos = new Set<string>();
  const distintas = linhas.filter((l) => {
    const chave = l.nome.toLowerCase();
    return vistos.has(chave) ? false : (vistos.add(chave), true);
  });
  if (distintas.length > importacaoMaxima) throw new ValidacaoError(`Importe no máximo ${importacaoMaxima} tópicos por vez.`);
  return db.transaction(async (tx) => {
    await travarMateria(tx, usuario, materiaId);
    const primeira = await proximaPosicao(tx, materiaId);
    // O índice único é quem decide o que já existe: a comparação de maiúsculas é a do banco.
    const criados = await tx
      .insert(topico)
      .values(distintas.map((l, i) => ({ materiaId, nome: l.nome, posicao: primeira + i })))
      .onConflictDoNothing()
      .returning({ id: topico.id });
    return { importados: criados.length, ignorados: linhas.length - criados.length };
  });
}

/** Os Tópicos de cada Matéria do Usuário, na ordem de cada uma, para o seletor do Registro de estudo. */
export async function listarTopicosDasMaterias(db: Db, usuario: Usuario): Promise<Map<string, { id: string; nome: string }[]>> {
  const linhas = await db
    .select({ materiaId: topico.materiaId, id: topico.id, nome: topico.nome })
    .from(topico)
    .innerJoin(materia, eq(materia.id, topico.materiaId))
    .innerJoin(ciclo, eq(ciclo.id, materia.cicloId))
    .where(eq(ciclo.usuarioId, usuario.id))
    .orderBy(asc(topico.posicao));
  const porMateria = new Map<string, { id: string; nome: string }[]>();
  for (const { materiaId, id, nome } of linhas) porMateria.set(materiaId, [...(porMateria.get(materiaId) ?? []), { id, nome }]);
  return porMateria;
}
