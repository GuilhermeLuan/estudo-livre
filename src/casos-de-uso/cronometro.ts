import { and, eq, isNotNull, isNull, sql } from "drizzle-orm";
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

export type CronometroParado = {
  materiaId: string;
  /** Duração sugerida ao registro: minutos arredondados, de 1 minuto a 24 horas. */
  duracaoMinutos: number;
  /** O tempo passou de 24 horas e a duração sugerida foi limitada. */
  passouDoLimite: boolean;
};

const POSTGRES_VIOLACAO_DE_UNICIDADE = "23505";

/** Segundos decorridos desde `desde` (relógio do servidor), nunca negativos. */
const segundosDesde = (desde: Date, agora: Date) => Math.max(0, Math.round((agora.getTime() - desde.getTime()) / 1000));

/** Soma ao acumulado o trecho que estava correndo. */
const acumuladoAte = (agora: Date) =>
  sql<number>`${cronometro.acumuladoSegundos} + greatest(0, round(extract(epoch from (${agora.toISOString()}::timestamptz - ${cronometro.rodandoDesde}))))::int`;

export async function obterCronometro(db: Db, usuario: Usuario, agora = new Date()): Promise<CronometroAtivo | null> {
  const [linha] = await db
    .select({
      materiaId: materia.id,
      materia: materia.nome,
      cicloId: ciclo.id,
      ciclo: ciclo.nome,
      acumulado: cronometro.acumuladoSegundos,
      rodandoDesde: cronometro.rodandoDesde,
    })
    .from(cronometro)
    .innerJoin(materia, eq(materia.id, cronometro.materiaId))
    .innerJoin(ciclo, eq(ciclo.id, materia.cicloId))
    .where(eq(cronometro.usuarioId, usuario.id));
  if (!linha) return null;
  const { acumulado, rodandoDesde, ...resto } = linha;
  return { ...resto, segundos: acumulado + (rodandoDesde ? segundosDesde(rodandoDesde, agora) : 0), rodando: rodandoDesde !== null };
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

/** Idempotente: pausar um Cronômetro já pausado não muda nada. */
export async function pausarCronometro(db: Db, usuario: Usuario, agora = new Date()): Promise<void> {
  const [pausado] = await db
    .update(cronometro)
    .set({ acumuladoSegundos: acumuladoAte(agora), rodandoDesde: null })
    .where(and(eq(cronometro.usuarioId, usuario.id), isNotNull(cronometro.rodandoDesde)))
    .returning({ usuarioId: cronometro.usuarioId });
  if (!pausado) await exigirCronometro(db, usuario);
}

/** Idempotente: retomar um Cronômetro que já corre não muda nada. */
export async function retomarCronometro(db: Db, usuario: Usuario, agora = new Date()): Promise<void> {
  const [retomado] = await db
    .update(cronometro)
    .set({ rodandoDesde: agora })
    .where(and(eq(cronometro.usuarioId, usuario.id), isNull(cronometro.rodandoDesde)))
    .returning({ usuarioId: cronometro.usuarioId });
  if (!retomado) await exigirCronometro(db, usuario);
}

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

async function exigirCronometro(db: Db, usuario: Usuario) {
  const [existe] = await db.select({ id: cronometro.usuarioId }).from(cronometro).where(eq(cronometro.usuarioId, usuario.id));
  if (!existe) throw new NaoEncontradoError("Cronômetro");
}
