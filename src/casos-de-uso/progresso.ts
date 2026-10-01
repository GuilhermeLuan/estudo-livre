import { and, asc, eq, gt, isNull, or, sql, type SQL } from "drizzle-orm";
import type { Db } from "@/db";
import { ciclo, materia, registroDeEstudo, volta } from "@/db/schema";

export type Executor = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];

export type MateriaComProgresso = { id: string; cicloId: string; nome: string; cargaMinutos: number; feitoMinutos: number };

/**
 * Matérias com o Progresso da matéria na Volta aberta do Ciclo, em ordem de posição.
 * O registro pertence à Volta pelo intervalo (início, fim]; a Volta aberta não tem fim.
 * O progresso trava na carga horária, então o excedente nunca passa para a Volta seguinte.
 */
export async function materiasComProgresso(db: Executor, filtro: SQL | undefined): Promise<MateriaComProgresso[]> {
  return db
    .select({
      id: materia.id,
      cicloId: materia.cicloId,
      nome: materia.nome,
      cargaMinutos: materia.cargaMinutos,
      feitoMinutos: sql<number>`least(coalesce(sum(${registroDeEstudo.duracaoMinutos}), 0), ${materia.cargaMinutos})::int`,
    })
    .from(materia)
    .innerJoin(ciclo, eq(ciclo.id, materia.cicloId))
    .innerJoin(volta, and(eq(volta.cicloId, ciclo.id), isNull(volta.fim)))
    .leftJoin(
      registroDeEstudo,
      and(eq(registroDeEstudo.materiaId, materia.id), or(isNull(volta.inicio), gt(registroDeEstudo.dataHora, volta.inicio))),
    )
    .where(filtro)
    .groupBy(materia.id)
    .orderBy(asc(materia.posicao));
}

/** Fecha a Volta aberta do Ciclo se ele tem Matérias e todas chegaram a 100%, abrindo a seguinte. */
export async function avaliarFechamentoDaVolta(tx: Executor, cicloId: string) {
  const materias = await materiasComProgresso(tx, eq(materia.cicloId, cicloId));
  if (materias.length === 0 || materias.some((m) => m.feitoMinutos < m.cargaMinutos)) return;
  const fim = new Date();
  const [fechada] = await tx
    .update(volta)
    .set({ fim })
    .where(and(eq(volta.cicloId, cicloId), isNull(volta.fim)))
    .returning({ numero: volta.numero });
  await tx.insert(volta).values({ cicloId, numero: fechada.numero + 1, inicio: fim });
}
