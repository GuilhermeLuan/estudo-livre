import { and, asc, eq, max, sql } from "drizzle-orm";
import type { Db, Tx } from "@/db";
import { ciclo, etapa, materia, registroDeEstudo, volta } from "@/db/schema";
import { NaoEncontradoError, ValidacaoError } from "./erros";
import type { Usuario } from "./usuario";

export type EtapaDoCiclo = { id: string; materiaId: string; nome: string; cargaMinutos: number; posicao: number };

export type CicloDetalhe = { id: string; nome: string; etapas: EtapaDoCiclo[] };

const CARGA_MAXIMA_MINUTOS = 10_000 * 60;

function nomeValido(nome: string, rotulo: string) {
  const limpo = nome.trim();
  if (!limpo) throw new ValidacaoError(`Informe o nome ${rotulo}.`);
  return limpo;
}

function cargaValida(minutos: number) {
  if (!Number.isInteger(minutos) || minutos <= 0 || minutos > CARGA_MAXIMA_MINUTOS)
    throw new ValidacaoError("A carga horária precisa ser maior que zero e no máximo 10.000 horas.");
  return minutos;
}

async function exigirCiclo(db: Db, usuario: Usuario, cicloId: string) {
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
async function travarCiclo(tx: Tx, usuario: Usuario, cicloId: string) {
  const [linha] = await tx
    .select({ id: ciclo.id })
    .from(ciclo)
    .where(and(eq(ciclo.id, cicloId), eq(ciclo.usuarioId, usuario.id)))
    .for("update");
  if (!linha) throw new NaoEncontradoError("Ciclo");
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

/** Uma Matéria sem Etapas e sem estudo não tem mais razão de existir; com estudo, fica para manter o histórico. */
async function descartarMateriaSemUso(tx: Tx, materiaId: string) {
  const [comEtapa] = await tx.select({ id: etapa.id }).from(etapa).where(eq(etapa.materiaId, materiaId)).limit(1);
  if (comEtapa) return;
  const [comEstudo] = await tx.select({ id: registroDeEstudo.id }).from(registroDeEstudo).where(eq(registroDeEstudo.materiaId, materiaId)).limit(1);
  if (!comEstudo) await tx.delete(materia).where(eq(materia.id, materiaId));
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
  await exigirCiclo(db, usuario, cicloId);
  await db.update(ciclo).set({ nome }).where(eq(ciclo.id, cicloId));
}

export async function obterCiclo(db: Db, usuario: Usuario, cicloId: string): Promise<CicloDetalhe> {
  const { id, nome } = await exigirCiclo(db, usuario, cicloId);
  const etapas = await db
    .select({ id: etapa.id, materiaId: etapa.materiaId, nome: materia.nome, cargaMinutos: etapa.cargaMinutos, posicao: etapa.posicao })
    .from(etapa)
    .innerJoin(materia, eq(materia.id, etapa.materiaId))
    .where(eq(etapa.cicloId, cicloId))
    .orderBy(asc(etapa.posicao));
  return { id, nome, etapas };
}

/** Acrescenta uma Etapa ao fim do Ciclo; a Matéria é reaproveitada se o Ciclo já tem uma com esse nome. */
export async function adicionarEtapa(
  db: Db,
  usuario: Usuario,
  cicloId: string,
  dados: { nome: string; cargaMinutos: number },
): Promise<{ id: string; materiaId: string }> {
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
    return { id: linha.id, materiaId };
  });
}

/** Muda a carga da Etapa e, se o nome mudou, a aponta para outra Matéria do Ciclo (criada se não existir). */
export async function editarEtapa(db: Db, usuario: Usuario, etapaId: string, dados: { nome: string; cargaMinutos: number }) {
  const nome = nomeValido(dados.nome, "da matéria");
  const cargaMinutos = cargaValida(dados.cargaMinutos);
  const { cicloId } = await exigirEtapa(db, usuario, etapaId);
  await db.transaction(async (tx) => {
    await travarCiclo(tx, usuario, cicloId);
    const [atual] = await tx.select({ materiaId: etapa.materiaId }).from(etapa).where(eq(etapa.id, etapaId));
    if (!atual) throw new NaoEncontradoError("Etapa");
    const materiaId = await materiaDoCiclo(tx, cicloId, nome);
    await tx.update(etapa).set({ materiaId, cargaMinutos }).where(eq(etapa.id, etapaId));
    if (materiaId !== atual.materiaId) await descartarMateriaSemUso(tx, atual.materiaId);
  });
}

export async function removerEtapa(db: Db, usuario: Usuario, etapaId: string) {
  const { cicloId } = await exigirEtapa(db, usuario, etapaId);
  await db.transaction(async (tx) => {
    await travarCiclo(tx, usuario, cicloId);
    const [removida] = await tx.delete(etapa).where(eq(etapa.id, etapaId)).returning({ materiaId: etapa.materiaId });
    if (removida) await descartarMateriaSemUso(tx, removida.materiaId);
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
