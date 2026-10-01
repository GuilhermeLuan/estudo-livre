import { and, asc, eq, max } from "drizzle-orm";
import type { Db } from "@/db";
import { ciclo, materia } from "@/db/schema";
import { NaoEncontradoError, ValidacaoError } from "./erros";
import type { Usuario } from "./usuario";

export type CicloDetalhe = {
  id: string;
  nome: string;
  materias: { id: string; nome: string; cargaMinutos: number; posicao: number }[];
};

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

async function exigirMateria(db: Db, usuario: Usuario, materiaId: string) {
  const [linha] = await db
    .select({ id: materia.id, cicloId: materia.cicloId })
    .from(materia)
    .innerJoin(ciclo, eq(ciclo.id, materia.cicloId))
    .where(and(eq(materia.id, materiaId), eq(ciclo.usuarioId, usuario.id)));
  if (!linha) throw new NaoEncontradoError("Matéria");
  return linha;
}

export async function criarCiclo(db: Db, usuario: Usuario, dados: { nome: string }): Promise<{ id: string }> {
  const nome = nomeValido(dados.nome, "do ciclo");
  const [linha] = await db.insert(ciclo).values({ usuarioId: usuario.id, nome }).returning({ id: ciclo.id });
  return linha;
}

export async function renomearCiclo(db: Db, usuario: Usuario, cicloId: string, dados: { nome: string }) {
  const nome = nomeValido(dados.nome, "do ciclo");
  await exigirCiclo(db, usuario, cicloId);
  await db.update(ciclo).set({ nome }).where(eq(ciclo.id, cicloId));
}

export async function obterCiclo(db: Db, usuario: Usuario, cicloId: string): Promise<CicloDetalhe> {
  const { id, nome } = await exigirCiclo(db, usuario, cicloId);
  const materias = await db
    .select({ id: materia.id, nome: materia.nome, cargaMinutos: materia.cargaMinutos, posicao: materia.posicao })
    .from(materia)
    .where(eq(materia.cicloId, cicloId))
    .orderBy(asc(materia.posicao));
  return { id, nome, materias };
}

export async function adicionarMateria(
  db: Db,
  usuario: Usuario,
  cicloId: string,
  dados: { nome: string; cargaMinutos: number },
): Promise<{ id: string }> {
  const nome = nomeValido(dados.nome, "da matéria");
  const cargaMinutos = cargaValida(dados.cargaMinutos);
  return db.transaction(async (tx) => {
    // Trava o Ciclo para que adições simultâneas não repitam a posição.
    await tx.select({ id: ciclo.id }).from(ciclo).where(and(eq(ciclo.id, cicloId), eq(ciclo.usuarioId, usuario.id))).for("update").then(([l]) => {
      if (!l) throw new NaoEncontradoError("Ciclo");
    });
    const [{ ultima }] = await tx.select({ ultima: max(materia.posicao) }).from(materia).where(eq(materia.cicloId, cicloId));
    const [linha] = await tx
      .insert(materia)
      .values({ cicloId, nome, cargaMinutos, posicao: (ultima ?? -1) + 1 })
      .returning({ id: materia.id });
    return linha;
  });
}

export async function editarMateria(db: Db, usuario: Usuario, materiaId: string, dados: { nome: string; cargaMinutos: number }) {
  const nome = nomeValido(dados.nome, "da matéria");
  const cargaMinutos = cargaValida(dados.cargaMinutos);
  await exigirMateria(db, usuario, materiaId);
  await db.update(materia).set({ nome, cargaMinutos }).where(eq(materia.id, materiaId));
}

export async function removerMateria(db: Db, usuario: Usuario, materiaId: string) {
  await exigirMateria(db, usuario, materiaId);
  await db.delete(materia).where(eq(materia.id, materiaId));
}

/** Define a nova ordem das Matérias; `ids` precisa conter exatamente as Matérias do Ciclo. */
export async function reordenarMaterias(db: Db, usuario: Usuario, cicloId: string, ids: string[]) {
  await exigirCiclo(db, usuario, cicloId);
  await db.transaction(async (tx) => {
    const atuais = await tx.select({ id: materia.id }).from(materia).where(eq(materia.cicloId, cicloId)).for("update");
    const esperado = new Set(atuais.map((m) => m.id));
    if (ids.length !== esperado.size || new Set(ids).size !== ids.length || ids.some((id) => !esperado.has(id)))
      throw new ValidacaoError("A nova ordem precisa conter todas as matérias do ciclo.");
    for (const [posicao, id] of ids.entries()) await tx.update(materia).set({ posicao }).where(eq(materia.id, id));
  });
}
