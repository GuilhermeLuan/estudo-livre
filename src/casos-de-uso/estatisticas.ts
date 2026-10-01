import { and, asc, eq, gte, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { ciclo, materia, registroDeEstudo } from "@/db/schema";
import { FUSO, hojeEmBrasilia, segundaDaSemana, somarDias } from "@/dia";
import { NaoEncontradoError } from "./erros";
import type { Usuario } from "./usuario";

export const SEMANAS_NAS_ESTATISTICAS = 8;

export type MateriaNasEstatisticas = { id: string; nome: string; ciclo: string; minutos: number };
export type AcertoDaMateria = { id: string; nome: string; ciclo: string; questoes: number; acertos: number; percentual: number };
export type SemanaEstudada = { inicio: string; minutos: number };

export type Estatisticas = {
  /** Todos os Ciclos do Usuário, para o filtro; a lista não muda com o filtro aplicado. */
  ciclos: { id: string; nome: string }[];
  /** Horas de todas as Voltas, sem o limite de 100% do progresso. */
  horasPorMateria: MateriaNasEstatisticas[];
  /** Só Matérias com ao menos uma questão; registros sem questões não entram na conta. */
  acertoPorMateria: AcertoDaMateria[];
  totalQuestoes: number;
  /** As últimas 8 semanas (segunda a domingo, em Brasília), da mais antiga à atual. */
  horasPorSemana: SemanaEstudada[];
  mediaSemanalMinutos: number;
};

/** `cicloId` restringe as estatísticas a um Ciclo do Usuário. */
export async function obterEstatisticas(db: Db, usuario: Usuario, opcoes: { cicloId?: string } = {}): Promise<Estatisticas> {
  // Uma leitura consistente: as três estatísticas vêm do mesmo instante.
  return db.transaction(
    async (tx) => {
      const ciclos = await tx
        .select({ id: ciclo.id, nome: ciclo.nome })
        .from(ciclo)
        .where(eq(ciclo.usuarioId, usuario.id))
        .orderBy(asc(ciclo.criadoEm), asc(ciclo.id));
      if (opcoes.cicloId && !ciclos.some((c) => c.id === opcoes.cicloId)) throw new NaoEncontradoError("Ciclo");
      const doEscopo = and(eq(ciclo.usuarioId, usuario.id), opcoes.cicloId ? eq(ciclo.id, opcoes.cicloId) : undefined);

      const horasPorMateria = await tx
        .select({
          id: materia.id,
          nome: materia.nome,
          ciclo: ciclo.nome,
          minutos: sql<number>`coalesce(sum(${registroDeEstudo.duracaoMinutos}), 0)::int`,
        })
        .from(materia)
        .innerJoin(ciclo, eq(ciclo.id, materia.cicloId))
        .leftJoin(registroDeEstudo, eq(registroDeEstudo.materiaId, materia.id))
        .where(doEscopo)
        .groupBy(materia.id, ciclo.id)
        .orderBy(asc(ciclo.criadoEm), asc(ciclo.id), asc(materia.posicao));

      const comQuestoes = await tx
        .select({
          id: materia.id,
          nome: materia.nome,
          ciclo: ciclo.nome,
          questoes: sql<number>`sum(${registroDeEstudo.questoes})::int`,
          acertos: sql<number>`sum(coalesce(${registroDeEstudo.acertos}, 0))::int`,
        })
        .from(materia)
        .innerJoin(ciclo, eq(ciclo.id, materia.cicloId))
        .innerJoin(registroDeEstudo, eq(registroDeEstudo.materiaId, materia.id))
        .where(doEscopo)
        .groupBy(materia.id, ciclo.id)
        .having(sql`sum(${registroDeEstudo.questoes}) > 0`)
        .orderBy(asc(ciclo.criadoEm), asc(ciclo.id), asc(materia.posicao));
      const acertoPorMateria = comQuestoes.map((m) => ({ ...m, percentual: Math.round((m.acertos * 100) / m.questoes) }));

      const primeiraSemana = somarDias(segundaDaSemana(hojeEmBrasilia()), -7 * (SEMANAS_NAS_ESTATISTICAS - 1));
      const porSemana = await tx
        .select({
          inicio: sql<string>`to_char(date_trunc('week', ${registroDeEstudo.dataHora} at time zone ${FUSO}), 'YYYY-MM-DD')`,
          minutos: sql<number>`sum(${registroDeEstudo.duracaoMinutos})::int`,
        })
        .from(registroDeEstudo)
        .innerJoin(materia, eq(materia.id, registroDeEstudo.materiaId))
        .innerJoin(ciclo, eq(ciclo.id, materia.cicloId))
        .where(and(doEscopo, gte(registroDeEstudo.dataHora, new Date(`${primeiraSemana}T00:00:00-03:00`))))
        .groupBy(sql`1`);
      const minutosDaSemana = new Map(porSemana.map((s) => [s.inicio, s.minutos]));
      const horasPorSemana = Array.from({ length: SEMANAS_NAS_ESTATISTICAS }, (_, i) => {
        const inicio = somarDias(primeiraSemana, 7 * i);
        return { inicio, minutos: minutosDaSemana.get(inicio) ?? 0 };
      });
      const totalMinutos = horasPorSemana.reduce((soma, s) => soma + s.minutos, 0);

      return {
        ciclos,
        horasPorMateria,
        acertoPorMateria,
        totalQuestoes: acertoPorMateria.reduce((soma, m) => soma + m.questoes, 0),
        horasPorSemana,
        mediaSemanalMinutos: Math.round(totalMinutos / SEMANAS_NAS_ESTATISTICAS),
      };
    },
    { isolationLevel: "repeatable read", accessMode: "read only" },
  );
}
