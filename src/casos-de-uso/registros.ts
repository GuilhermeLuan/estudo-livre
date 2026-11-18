import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { ciclo, materia, registroDeEstudo, topico, volta } from "@/db/schema";
import { hojeEmBrasilia } from "@/dia";
import type { TipoDeEstudo } from "@/dominio";
import { NaoEncontradoError, ValidacaoError } from "./erros";
import { instanteDoDia, validar, type DadosDoEstudo } from "./estudo";
import { avaliarFechamentoDaVolta } from "./progresso";
import type { Usuario } from "./usuario";

/** Quantos Registros o histórico mostra por vez (AD-014). */
export const LIMITE_DA_LISTA = 25;

export type FiltroDeRegistros = { cicloId?: string; materiaId?: string; limite?: number };

export type RegistroDoHistorico = {
  id: string;
  materiaId: string;
  materia: string;
  cicloId: string;
  ciclo: string;
  /** A Volta em cujo período (início, fim] a data do Registro cai (AD-012). */
  volta: number | null;
  tipo: TipoDeEstudo;
  duracaoMinutos: number;
  questoes: number | null;
  acertos: number | null;
  anotacao: string | null;
  conteudoLivre: string | null;
  topicoId: string | null;
  topico: string | null;
  /** O dia do estudo em Brasília (AAAA-MM-DD). */
  dia: string;
};

export type ListaDeRegistros = { registros: RegistroDoHistorico[]; total: number; temMais: boolean };

/** Histórico do Usuário, do mais recente ao mais antigo; ids de outros Usuários simplesmente não casam. */
export async function listarRegistros(db: Db, usuario: Usuario, filtro: FiltroDeRegistros): Promise<ListaDeRegistros> {
  const limite = Number.isInteger(filtro.limite) && filtro.limite! > 0 ? filtro.limite! : LIMITE_DA_LISTA;
  const onde = and(
    eq(ciclo.usuarioId, usuario.id),
    filtro.cicloId ? eq(ciclo.id, filtro.cicloId) : undefined,
    filtro.materiaId ? eq(materia.id, filtro.materiaId) : undefined,
  );
  const base = db
    .select({
      id: registroDeEstudo.id,
      materiaId: materia.id,
      materia: materia.nome,
      cicloId: ciclo.id,
      ciclo: ciclo.nome,
      volta: sql<number | null>`(select ${volta.numero} from ${volta} where ${volta.cicloId} = ${ciclo.id} and (${volta.inicio} is null or ${volta.inicio} < ${registroDeEstudo.dataHora}) and (${volta.fim} is null or ${registroDeEstudo.dataHora} <= ${volta.fim}) limit 1)`,
      tipo: registroDeEstudo.tipo,
      duracaoMinutos: registroDeEstudo.duracaoMinutos,
      questoes: registroDeEstudo.questoes,
      acertos: registroDeEstudo.acertos,
      anotacao: registroDeEstudo.anotacao,
      conteudoLivre: registroDeEstudo.conteudoLivre,
      topicoId: registroDeEstudo.topicoId,
      topico: topico.nome,
      dataHora: registroDeEstudo.dataHora,
    })
    .from(registroDeEstudo)
    .innerJoin(materia, eq(materia.id, registroDeEstudo.materiaId))
    .innerJoin(ciclo, eq(ciclo.id, materia.cicloId))
    .leftJoin(topico, eq(topico.id, registroDeEstudo.topicoId))
    .where(onde)
    .orderBy(desc(registroDeEstudo.dataHora), desc(registroDeEstudo.criadoEm), desc(registroDeEstudo.id))
    .limit(limite);
  const [linhas, [{ total }]] = await Promise.all([
    base,
    db.select({ total: count() }).from(registroDeEstudo).innerJoin(materia, eq(materia.id, registroDeEstudo.materiaId)).innerJoin(ciclo, eq(ciclo.id, materia.cicloId)).where(onde),
  ]);
  const registros = linhas.map(({ dataHora, ...resto }) => ({ ...resto, dia: hojeEmBrasilia(dataHora) }));
  return { registros, total, temMais: total > registros.length };
}

/** Trava os Ciclos em ordem de id (nunca dois de uma vez em ordem diferente) para duas mudanças não se cruzarem. */
async function travarCiclos(tx: Parameters<Parameters<Db["transaction"]>[0]>[0], ids: string[]) {
  await tx.select({ id: ciclo.id }).from(ciclo).where(inArray(ciclo.id, ids)).orderBy(ciclo.id).for("update");
}

const doUsuario = (tx: Parameters<Parameters<Db["transaction"]>[0]>[0], usuario: Usuario, registroId: string) =>
  tx
    .select({ cicloId: materia.cicloId, dataHora: registroDeEstudo.dataHora })
    .from(registroDeEstudo)
    .innerJoin(materia, eq(materia.id, registroDeEstudo.materiaId))
    .innerJoin(ciclo, eq(ciclo.id, materia.cicloId))
    .where(and(eq(registroDeEstudo.id, registroId), eq(ciclo.usuarioId, usuario.id)));

/**
 * Edita o Registro, inclusive a Matéria (AD-011). A Volta fechada nunca reabre (AD-010): só a Volta aberta do Ciclo de
 * destino é reavaliada, e só pode fechar.
 */
export async function editarRegistro(db: Db, usuario: Usuario, registroId: string, materiaId: string, dados: DadosDoEstudo): Promise<{ materia: string; ciclo: string; voltaFechada: number | null }> {
  const registro = validar(dados);
  return db.transaction(async (tx) => {
    const [atual] = await doUsuario(tx, usuario, registroId);
    if (!atual) throw new NaoEncontradoError("Registro");
    const [alvo] = await tx
      .select({ cicloId: materia.cicloId, nome: materia.nome, cicloNome: ciclo.nome })
      .from(materia)
      .innerJoin(ciclo, eq(ciclo.id, materia.cicloId))
      .where(and(eq(materia.id, materiaId), eq(ciclo.usuarioId, usuario.id)));
    if (!alvo) throw new NaoEncontradoError("Matéria");
    await travarCiclos(tx, [...new Set([atual.cicloId, alvo.cicloId])]);
    // Com os Ciclos travados, o Registro não pode ter sumido nem mudado de Ciclo desde a leitura.
    const [travado] = await doUsuario(tx, usuario, registroId);
    if (!travado || travado.cicloId !== atual.cicloId) throw new NaoEncontradoError("Registro");

    const mesmoDia = dados.dia === undefined || dados.dia === hojeEmBrasilia(travado.dataHora);
    const dataHora = mesmoDia ? travado.dataHora : instanteDoDia(dados.dia!);
    if (registro.topicoId) {
      await tx.select({ id: materia.id }).from(materia).where(eq(materia.id, materiaId)).for("update");
      const [doTopico] = await tx.select({ id: topico.id }).from(topico).where(and(eq(topico.id, registro.topicoId), eq(topico.materiaId, materiaId)));
      if (!doTopico) throw new ValidacaoError("Escolha um tópico desta matéria.");
    }
    await tx.update(registroDeEstudo).set({ materiaId, ...registro, dataHora }).where(eq(registroDeEstudo.id, registroId));
    if (registro.topicoId) await tx.update(topico).set({ estudado: true }).where(eq(topico.id, registro.topicoId));
    const voltaFechada = await avaliarFechamentoDaVolta(tx, alvo.cicloId);
    return { materia: alvo.nome, ciclo: alvo.cicloNome, voltaFechada };
  });
}

export async function excluirRegistro(db: Db, usuario: Usuario, registroId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const [atual] = await doUsuario(tx, usuario, registroId);
    if (!atual) throw new NaoEncontradoError("Registro");
    await travarCiclos(tx, [atual.cicloId]);
    const apagados = await tx.delete(registroDeEstudo).where(eq(registroDeEstudo.id, registroId)).returning({ id: registroDeEstudo.id });
    if (apagados.length === 0) throw new NaoEncontradoError("Registro");
  });
}
