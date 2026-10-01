import { and, eq, isNotNull, isNull, sql, type SQL } from "drizzle-orm";
import type { PgUpdateSetSource } from "drizzle-orm/pg-core";
import type { Db } from "@/db";
import { ciclo, cronometro, materia } from "@/db/schema";
import { LIMITES_DO_REGISTRO } from "@/dominio";
import { NaoEncontradoError, ValidacaoError } from "./erros";
import type { Usuario } from "./usuario";

export type CronometroAtivo = {
  materiaId: string;
  materia: string;
  cicloId: string;
  ciclo: string;
  /** Tempo estudado até `agora`, sem o tempo pausado. */
  segundos: number;
  rodando: boolean;
};

/** O que o Cronômetro parado sugere ao Registro de estudo. */
export type SugestaoDeRegistro = {
  /** Minutos arredondados, de 1 minuto a 24 horas. */
  duracaoMinutos: number;
  /** O tempo passou de 24 horas e a duração sugerida foi limitada. */
  passouDoLimite: boolean;
};

export type CronometroParado = SugestaoDeRegistro & { materiaId: string };

const POSTGRES_VIOLACAO_DE_UNICIDADE = "23505";

/** Regra única do tempo estudado: o acumulado mais o trecho que está correndo (nenhum, se pausado). */
const segundosAte = (agora: Date) =>
  sql<number>`${cronometro.acumuladoSegundos} + coalesce(greatest(0, round(extract(epoch from (${agora.toISOString()}::timestamptz - ${cronometro.rodandoDesde})))), 0)::int`;

export async function obterCronometro(db: Db, usuario: Usuario, agora = new Date()): Promise<CronometroAtivo | null> {
  const [linha] = await db
    .select({
      materiaId: materia.id,
      materia: materia.nome,
      cicloId: ciclo.id,
      ciclo: ciclo.nome,
      segundos: segundosAte(agora),
      rodando: sql<boolean>`${cronometro.rodandoDesde} is not null`,
    })
    .from(cronometro)
    .innerJoin(materia, eq(materia.id, cronometro.materiaId))
    .innerJoin(ciclo, eq(ciclo.id, materia.cicloId))
    .where(eq(cronometro.usuarioId, usuario.id));
  return linha ?? null;
}

export async function iniciarCronometro(db: Db, usuario: Usuario, materiaId: string, agora = new Date()): Promise<void> {
  const [alvo] = await db
    .select({ id: materia.id })
    .from(materia)
    .innerJoin(ciclo, eq(ciclo.id, materia.cicloId))
    .where(and(eq(materia.id, materiaId), eq(ciclo.usuarioId, usuario.id)));
  if (!alvo) throw new NaoEncontradoError("Matéria");
  try {
    // A chave primária é o Usuário: o banco garante um único Cronômetro, mesmo com cliques simultâneos.
    await db.insert(cronometro).values({ usuarioId: usuario.id, materiaId, rodandoDesde: agora });
  } catch (erro) {
    if ((erro as { cause?: { code?: string } }).cause?.code === POSTGRES_VIOLACAO_DE_UNICIDADE)
      throw new ValidacaoError("Já existe um cronômetro rodando. Pare ou descarte antes de iniciar outro.");
    throw erro;
  }
}

/**
 * Aplica a transição só se o Cronômetro estiver no estado de partida (`condicao`), num UPDATE atômico.
 * Se não aplicou, ou ele já está no estado final (idempotente) ou não existe.
 */
async function transitar(db: Db, usuario: Usuario, condicao: SQL, mudanca: PgUpdateSetSource<typeof cronometro>) {
  const [alterado] = await db
    .update(cronometro)
    .set(mudanca)
    .where(and(eq(cronometro.usuarioId, usuario.id), condicao))
    .returning({ usuarioId: cronometro.usuarioId });
  if (alterado) return;
  const [existe] = await db.select({ id: cronometro.usuarioId }).from(cronometro).where(eq(cronometro.usuarioId, usuario.id));
  if (!existe) throw new NaoEncontradoError("Cronômetro");
}

export const pausarCronometro = (db: Db, usuario: Usuario, agora = new Date()) =>
  transitar(db, usuario, isNotNull(cronometro.rodandoDesde), { acumuladoSegundos: segundosAte(agora), rodandoDesde: null });

export const retomarCronometro = (db: Db, usuario: Usuario, agora = new Date()) =>
  transitar(db, usuario, isNull(cronometro.rodandoDesde), { rodandoDesde: agora });

export async function descartarCronometro(db: Db, usuario: Usuario): Promise<void> {
  const [removido] = await db.delete(cronometro).where(eq(cronometro.usuarioId, usuario.id)).returning({ usuarioId: cronometro.usuarioId });
  if (!removido) throw new NaoEncontradoError("Cronômetro");
}

/**
 * Pausa o Cronômetro e devolve a duração para preencher o Registro de estudo. O Cronômetro só
 * some quando o registro é salvo (`registrarEstudo` com `cronometro: true`); cancelar o formulário
 * o deixa pausado.
 */
export async function pararCronometro(db: Db, usuario: Usuario, agora = new Date()): Promise<CronometroParado> {
  await pausarCronometro(db, usuario, agora);
  const ativo = await obterCronometro(db, usuario, agora);
  if (!ativo) throw new NaoEncontradoError("Cronômetro");
  const minutos = Math.max(1, Math.round(ativo.segundos / 60));
  const { duracaoMaximaMinutos } = LIMITES_DO_REGISTRO;
  return { materiaId: ativo.materiaId, duracaoMinutos: Math.min(minutos, duracaoMaximaMinutos), passouDoLimite: minutos > duracaoMaximaMinutos };
}
