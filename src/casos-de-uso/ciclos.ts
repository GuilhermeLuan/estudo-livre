import { and, asc, eq, isNull, max, sql } from "drizzle-orm";
import type { Db, Tx } from "@/db";
import { ciclo, etapa, materia, registroDeEstudo, topico, volta } from "@/db/schema";
import { concluida } from "@/dominio";
import { avaliarFechamentoDaVolta, progressoDosCiclos, type Executor, type MateriaComProgresso } from "./progresso";
import { ESCRITA_EM_ARQUIVADO, NaoEncontradoError, ValidacaoError } from "./erros";
import type { Usuario } from "./usuario";

export type EtapaDoCiclo = { id: string; materiaId: string; nome: string; cargaMinutos: number; posicao: number };

/** `feitoMinutos` é o progresso da Etapa na Volta atual. */
export type EtapaDetalhada = EtapaDoCiclo & { feitoMinutos: number };

export type CicloDetalhe = {
  id: string;
  nome: string;
  arquivado: boolean;
  etapas: EtapaDetalhada[];
  materias: (MateriaComProgresso & { topicos: { estudados: number; total: number } })[];
  /** A Volta aberta; `inicio` é nulo na Volta 1. */
  volta: { numero: number; inicio: Date | null };
  cargaMinutos: number;
  feitoMinutos: number;
  /** Horas extras da Volta atual, somadas de todas as Matérias. */
  extraMinutos: number;
  /** Fração da carga cumprida na Volta atual, de 0 a 100. */
  percentual: number;
  /** A Próxima etapa: a primeira, na ordem do ciclo, que ainda não chegou a 100%. */
  proximaEtapaId: string | null;
};

export const CARGA_MAXIMA_MINUTOS = 10_000 * 60;

export function nomeValido(nome: string, rotulo: string) {
  const limpo = nome.trim();
  if (!limpo) throw new ValidacaoError(`Informe o nome ${rotulo}.`);
  return limpo;
}

export function cargaValida(minutos: number) {
  if (!Number.isInteger(minutos) || minutos <= 0 || minutos > CARGA_MAXIMA_MINUTOS)
    throw new ValidacaoError("A carga horária precisa ser maior que zero e no máximo 10.000 horas.");
  return minutos;
}

async function exigirCiclo(db: Executor, usuario: Usuario, cicloId: string) {
  const [linha] = await db
    .select()
    .from(ciclo)
    .where(and(eq(ciclo.id, cicloId), eq(ciclo.usuarioId, usuario.id)));
  if (!linha) throw new NaoEncontradoError("Ciclo");
  return linha;
}

async function exigirEtapa(db: Db, usuario: Usuario, etapaId: string) {
  const [linha] = await db
    .select({ id: etapa.id, cicloId: etapa.cicloId, materiaId: etapa.materiaId })
    .from(etapa)
    .innerJoin(ciclo, eq(ciclo.id, etapa.cicloId))
    .where(and(eq(etapa.id, etapaId), eq(ciclo.usuarioId, usuario.id)));
  if (!linha) throw new NaoEncontradoError("Etapa");
  return linha;
}

/** Trava o Ciclo para que alterações simultâneas nas Etapas não repitam posição nem dupliquem Matérias. */
export async function travarCiclo(tx: Tx, usuario: Usuario, cicloId: string) {
  const [linha] = await tx
    .select({ id: ciclo.id, arquivadoEm: ciclo.arquivadoEm })
    .from(ciclo)
    .where(and(eq(ciclo.id, cicloId), eq(ciclo.usuarioId, usuario.id)))
    .for("update");
  if (!linha) throw new NaoEncontradoError("Ciclo");
  if (linha.arquivadoEm) throw new ValidacaoError(ESCRITA_EM_ARQUIVADO);
}

/** A Matéria do Ciclo com este nome (sem diferenciar maiúsculas), criada se ainda não existir. */
async function materiaDoCiclo(tx: Tx, cicloId: string, nome: string): Promise<string> {
  const [existente] = await tx
    .select({ id: materia.id })
    .from(materia)
    .where(and(eq(materia.cicloId, cicloId), sql`lower(${materia.nome}) = lower(${nome})`));
  if (existente) return existente.id;
  const [nova] = await tx.insert(materia).values({ cicloId, nome }).returning({ id: materia.id });
  return nova.id;
}

/** Uma Matéria sem Etapas, sem estudo e sem Tópicos não tem mais razão de existir; com estudo ou Tópicos, fica (AD-008). */
async function descartarMateriaSemUso(tx: Tx, materiaId: string) {
  const [comEtapa] = await tx.select({ id: etapa.id }).from(etapa).where(eq(etapa.materiaId, materiaId)).limit(1);
  if (comEtapa) return;
  const [comEstudo] = await tx.select({ id: registroDeEstudo.id }).from(registroDeEstudo).where(eq(registroDeEstudo.materiaId, materiaId)).limit(1);
  const [comTopico] = await tx.select({ id: topico.id }).from(topico).where(eq(topico.materiaId, materiaId)).limit(1);
  if (!comEstudo && !comTopico) await tx.delete(materia).where(eq(materia.id, materiaId));
}

export async function criarCiclo(db: Db, usuario: Usuario, dados: { nome: string }): Promise<{ id: string }> {
  const nome = nomeValido(dados.nome, "do ciclo");
  return db.transaction(async (tx) => {
    const [linha] = await tx.insert(ciclo).values({ usuarioId: usuario.id, nome }).returning({ id: ciclo.id });
    await tx.insert(volta).values({ cicloId: linha.id, numero: 1 });
    return linha;
  });
}

export async function renomearCiclo(db: Db, usuario: Usuario, cicloId: string, dados: { nome: string }) {
  const nome = nomeValido(dados.nome, "do ciclo");
  const { arquivadoEm } = await exigirCiclo(db, usuario, cicloId);
  if (arquivadoEm) throw new ValidacaoError(ESCRITA_EM_ARQUIVADO);
  await db.update(ciclo).set({ nome }).where(eq(ciclo.id, cicloId));
}

export async function obterCiclo(db: Db, usuario: Usuario, cicloId: string): Promise<CicloDetalhe> {
  // Uma leitura consistente: as Etapas, o progresso e a Volta vêm do mesmo instante.
  return db.transaction(
    async (tx) => {
      const { id, nome, arquivadoEm } = await exigirCiclo(tx, usuario, cicloId);
      const posicoes = await tx.select({ id: etapa.id, posicao: etapa.posicao }).from(etapa).where(eq(etapa.cicloId, cicloId));
      const posicaoDe = new Map(posicoes.map((e) => [e.id, e.posicao]));
      const progresso = (await progressoDosCiclos(tx, eq(ciclo.id, cicloId))).get(cicloId) ?? { etapas: [], materias: [] };
      const [aberta] = await tx.select({ numero: volta.numero, inicio: volta.inicio }).from(volta).where(and(eq(volta.cicloId, cicloId), isNull(volta.fim)));
      const contagem = await tx
        .select({ materiaId: topico.materiaId, estudados: sql<number>`count(*) filter (where ${topico.estudado})::int`, total: sql<number>`count(*)::int` })
        .from(topico)
        .innerJoin(materia, eq(materia.id, topico.materiaId))
        .where(eq(materia.cicloId, cicloId))
        .groupBy(topico.materiaId);
      const topicosDe = new Map(contagem.map((c) => [c.materiaId, { estudados: c.estudados, total: c.total }]));
      const carga = progresso.etapas.reduce((soma, e) => soma + e.cargaMinutos, 0);
      const feito = progresso.etapas.reduce((soma, e) => soma + e.feitoMinutos, 0);
      return {
        id,
        nome,
        arquivado: arquivadoEm !== null,
        etapas: progresso.etapas.map((e) => ({ ...e, posicao: posicaoDe.get(e.id)! })),
        materias: progresso.materias.map((m) => ({ ...m, topicos: topicosDe.get(m.id) ?? { estudados: 0, total: 0 } })),
        volta: aberta,
        cargaMinutos: carga,
        feitoMinutos: feito,
        extraMinutos: progresso.materias.reduce((soma, m) => soma + m.extraMinutos, 0),
        percentual: carga ? Math.round((feito / carga) * 100) : 0,
        proximaEtapaId: progresso.etapas.find((e) => !concluida(e))?.id ?? null,
      };
    },
    { isolationLevel: "repeatable read", accessMode: "read only" },
  );
}

/** Acrescenta uma Etapa ao fim do Ciclo; a Matéria é reaproveitada se o Ciclo já tem uma com esse nome. */
export async function adicionarEtapa(
  db: Db,
  usuario: Usuario,
  cicloId: string,
  dados: { nome: string; cargaMinutos: number },
): Promise<{ id: string; materiaId: string; voltaFechada: number | null }> {
  const nome = nomeValido(dados.nome, "da matéria");
  const cargaMinutos = cargaValida(dados.cargaMinutos);
  return db.transaction(async (tx) => {
    await travarCiclo(tx, usuario, cicloId);
    const [{ ultima }] = await tx.select({ ultima: max(etapa.posicao) }).from(etapa).where(eq(etapa.cicloId, cicloId));
    const materiaId = await materiaDoCiclo(tx, cicloId, nome);
    const [linha] = await tx
      .insert(etapa)
      .values({ cicloId, materiaId, cargaMinutos, posicao: (ultima ?? -1) + 1 })
      .returning({ id: etapa.id });
    return { id: linha.id, materiaId, voltaFechada: await avaliarFechamentoDaVolta(tx, cicloId) };
  });
}

/** Muda a carga da Etapa e, se o nome mudou, a aponta para outra Matéria do Ciclo (criada se não existir). */
export async function editarEtapa(db: Db, usuario: Usuario, etapaId: string, dados: { nome: string; cargaMinutos: number }): Promise<number | null> {
  const nome = nomeValido(dados.nome, "da matéria");
  const cargaMinutos = cargaValida(dados.cargaMinutos);
  const { cicloId } = await exigirEtapa(db, usuario, etapaId);
  return db.transaction(async (tx) => {
    await travarCiclo(tx, usuario, cicloId);
    const [atual] = await tx.select({ materiaId: etapa.materiaId }).from(etapa).where(eq(etapa.id, etapaId));
    if (!atual) throw new NaoEncontradoError("Etapa");
    const materiaId = await materiaDoCiclo(tx, cicloId, nome);
    await tx.update(etapa).set({ materiaId, cargaMinutos }).where(eq(etapa.id, etapaId));
    if (materiaId !== atual.materiaId) await descartarMateriaSemUso(tx, atual.materiaId);
    return avaliarFechamentoDaVolta(tx, cicloId);
  });
}

export async function removerEtapa(db: Db, usuario: Usuario, etapaId: string): Promise<number | null> {
  const { cicloId } = await exigirEtapa(db, usuario, etapaId);
  return db.transaction(async (tx) => {
    await travarCiclo(tx, usuario, cicloId);
    const [removida] = await tx.delete(etapa).where(eq(etapa.id, etapaId)).returning({ materiaId: etapa.materiaId });
    if (removida) await descartarMateriaSemUso(tx, removida.materiaId);
    return avaliarFechamentoDaVolta(tx, cicloId);
  });
}

/** Define a nova ordem das Etapas; `ids` precisa conter exatamente as Etapas do Ciclo. */
export async function reordenarEtapas(db: Db, usuario: Usuario, cicloId: string, ids: string[]) {
  await db.transaction(async (tx) => {
    await travarCiclo(tx, usuario, cicloId);
    const atuais = await tx.select({ id: etapa.id }).from(etapa).where(eq(etapa.cicloId, cicloId));
    const esperado = new Set(atuais.map((e) => e.id));
    if (ids.length !== esperado.size || new Set(ids).size !== ids.length || ids.some((id) => !esperado.has(id)))
      throw new ValidacaoError("A nova ordem precisa conter todas as etapas do ciclo.");
    for (const [posicao, id] of ids.entries()) await tx.update(etapa).set({ posicao }).where(eq(etapa.id, id));
  });
}
