import { and, asc, eq, gt, isNull, or, sql, type SQL } from "drizzle-orm";
import type { Db, Tx } from "@/db";
import { ciclo, etapa, materia, registroDeEstudo, volta } from "@/db/schema";
import { concluida, preencherEtapas } from "@/dominio";

export type Executor = Db | Tx;

export type EtapaComProgresso = { id: string; materiaId: string; nome: string; cargaMinutos: number; feitoMinutos: number };

/** A Matéria soma as Etapas dela; `extraMinutos` é o que passou da carga total na Volta atual. */
export type MateriaComProgresso = { id: string; nome: string; cargaMinutos: number; feitoMinutos: number; extraMinutos: number };

export type ProgressoDoCiclo = { etapas: EtapaComProgresso[]; materias: MateriaComProgresso[] };

/**
 * Progresso da Volta aberta de cada Ciclo que passa no filtro (`ciclo` e `materia` estão na consulta).
 * O registro pertence à Volta pelo intervalo (início, fim]; a Volta aberta não tem fim. As horas de uma
 * Matéria preenchem as Etapas dela em ordem (ADR-0004) e o excedente nunca passa para a Volta seguinte.
 * Matérias sem Etapas não entram: sem carga horária não há progresso a acompanhar.
 */
export async function progressoDosCiclos(db: Executor, filtro: SQL | undefined): Promise<Map<string, ProgressoDoCiclo>> {
  const etapas = await db
    .select({ id: etapa.id, cicloId: etapa.cicloId, materiaId: etapa.materiaId, nome: materia.nome, cargaMinutos: etapa.cargaMinutos })
    .from(etapa)
    .innerJoin(materia, eq(materia.id, etapa.materiaId))
    .innerJoin(ciclo, eq(ciclo.id, etapa.cicloId))
    .where(filtro)
    .orderBy(asc(etapa.posicao));
  const estudado = await db
    .select({
      id: materia.id,
      cicloId: materia.cicloId,
      minutos: sql<number>`coalesce(sum(${registroDeEstudo.duracaoMinutos}), 0)::int`,
    })
    .from(materia)
    .innerJoin(ciclo, eq(ciclo.id, materia.cicloId))
    .innerJoin(volta, and(eq(volta.cicloId, ciclo.id), isNull(volta.fim)))
    .leftJoin(
      registroDeEstudo,
      and(eq(registroDeEstudo.materiaId, materia.id), or(isNull(volta.inicio), gt(registroDeEstudo.dataHora, volta.inicio))),
    )
    .where(filtro)
    .groupBy(materia.id);

  const estudadoDoCiclo = Map.groupBy(estudado, (m) => m.cicloId);
  const resultado = new Map<string, ProgressoDoCiclo>();
  for (const [cicloId, doCiclo] of Map.groupBy(etapas, (e) => e.cicloId)) {
    const { etapas: preenchidas, extraPorMateria } = preencherEtapas(
      doCiclo,
      new Map((estudadoDoCiclo.get(cicloId) ?? []).map((m) => [m.id, m.minutos])),
    );
    const materias = new Map<string, MateriaComProgresso>();
    for (const e of preenchidas) {
      const atual = materias.get(e.materiaId) ?? { id: e.materiaId, nome: e.nome, cargaMinutos: 0, feitoMinutos: 0, extraMinutos: extraPorMateria.get(e.materiaId) ?? 0 };
      atual.cargaMinutos += e.cargaMinutos;
      atual.feitoMinutos += e.feitoMinutos;
      materias.set(e.materiaId, atual);
    }
    resultado.set(cicloId, {
      etapas: preenchidas.map(({ cicloId: _, ...resto }) => resto),
      materias: [...materias.values()],
    });
  }
  return resultado;
}

/**
 * Fecha a Volta aberta do Ciclo se ele tem Etapas e todas chegaram a 100%, abrindo a seguinte.
 * Devolve o número da Volta fechada, ou null se nada mudou.
 */
export async function avaliarFechamentoDaVolta(tx: Executor, cicloId: string): Promise<number | null> {
  const etapas = (await progressoDosCiclos(tx, eq(ciclo.id, cicloId))).get(cicloId)?.etapas ?? [];
  if (etapas.length === 0 || etapas.some((e) => !concluida(e))) return null;
  const fim = new Date();
  const [fechada] = await tx
    .update(volta)
    .set({ fim })
    .where(and(eq(volta.cicloId, cicloId), isNull(volta.fim)))
    .returning({ numero: volta.numero });
  await tx.insert(volta).values({ cicloId, numero: fechada.numero + 1, inicio: fim });
  return fechada.numero;
}
