import { and, asc, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { cartaoDeRevisao, ciclo, materia, registroDeEstudo, topico } from "@/db/schema";
import { FUSO, hojeEmBrasilia, somarDias } from "@/dia";
import { percentualDeAcerto } from "@/dominio";
import type { Nota } from "@/revisao";
import type { Usuario } from "./usuario";

/** Uma Revisão: o Cartão de um Tópico cuja próxima data já chegou, ou chega nos próximos 7 dias. */
export type RevisaoDaLista = {
  topicoId: string;
  topico: string;
  materiaId: string;
  materia: string;
  cicloId: string;
  ciclo: string;
  /** Dia (AAAA-MM-DD, em Brasília) do vencimento. */
  dia: string;
  /** Positivo: dias de atraso; 0: vence hoje; negativo: faltam tantos dias. */
  diasDeAtraso: number;
  /** Nota e acerto do Registro mais recente do Tópico que gerou nota (AD-029); nulos sem nenhum. */
  ultimaNota: Nota | null;
  acerto: number | null;
};

export type ListaDeRevisoes = {
  /** O Ciclo do filtro, ou nulo para "Todos os ciclos" (também quando o pedido não é de um Ciclo ativo do Usuário). */
  filtro: string | null;
  /** Os Ciclos ativos, para o filtro. */
  ciclos: { id: string; nome: string }[];
  vencidas: RevisaoDaLista[];
  proximas: RevisaoDaLista[];
  /** Total do filtro, mesmo quando `limiteVencidas` corta a lista. */
  totalVencidas: number;
  totalProximas: number;
  /** Total de vencidas de todos os Ciclos ativos, sem filtro. */
  totalVencidasGeral: number;
};

/** Quantas Revisões vencidas o cartão da Hoje mostra: as 6 mais atrasadas (a página Revisões lista todas). */
export const LIMITE_DO_CARTAO_DE_REVISOES = 6;

/** Dias entre dois dias AAAA-MM-DD. */
const diasEntre = (de: string, ate: string) => Math.round((Date.parse(`${ate}T00:00:00Z`) - Date.parse(`${de}T00:00:00Z`)) / 86_400_000);

/**
 * As Revisões dos Ciclos ativos do Usuário: vencidas (dia de Brasília até hoje) e dos próximos 7 dias (de amanhã a
 * hoje + 7). Cartão sem data não entra. O filtro por Ciclo e o recorte por dia rodam aqui, não na tela.
 */
export async function listarRevisoes(
  db: Db,
  usuario: Usuario,
  opcoes: { cicloId?: string | null; limiteVencidas?: number } = {},
  agora = new Date(),
): Promise<ListaDeRevisoes> {
  const hoje = hojeEmBrasilia(agora);
  const ate = somarDias(hoje, 7);
  const ciclos = await db
    .select({ id: ciclo.id, nome: ciclo.nome })
    .from(ciclo)
    .where(and(eq(ciclo.usuarioId, usuario.id), isNull(ciclo.arquivadoEm)))
    .orderBy(asc(ciclo.criadoEm), asc(ciclo.id));
  const filtro = ciclos.find((c) => c.id === opcoes.cicloId)?.id ?? null;

  const dia = sql<string>`to_char(${cartaoDeRevisao.proximaRevisao} at time zone ${FUSO}, 'YYYY-MM-DD')`;
  const linhas = await db
    .select({
      topicoId: topico.id,
      topico: topico.nome,
      materiaId: materia.id,
      materia: materia.nome,
      cicloId: ciclo.id,
      ciclo: ciclo.nome,
      dia,
    })
    .from(cartaoDeRevisao)
    .innerJoin(topico, eq(topico.id, cartaoDeRevisao.topicoId))
    .innerJoin(materia, eq(materia.id, topico.materiaId))
    .innerJoin(ciclo, eq(ciclo.id, materia.cicloId))
    .where(and(eq(ciclo.usuarioId, usuario.id), isNull(ciclo.arquivadoEm), isNotNull(cartaoDeRevisao.proximaRevisao), sql`${dia} <= ${ate}`))
    .orderBy(asc(dia), asc(topico.nome), asc(topico.id));

  const totalVencidasGeral = linhas.filter((l) => l.dia <= hoje).length;
  const doFiltro = filtro ? linhas.filter((l) => l.cicloId === filtro) : linhas;
  const vencidas = doFiltro.filter((l) => l.dia <= hoje);
  const proximas = doFiltro.filter((l) => l.dia > hoje);

  const recortadas = opcoes.limiteVencidas === undefined ? vencidas : vencidas.slice(0, opcoes.limiteVencidas);
  const visiveis = [...recortadas, ...proximas];
  const ultimos = new Map<string, { nota: Nota; questoes: number | null; acertos: number | null }>();
  if (visiveis.length > 0) {
    const registros = await db
      .selectDistinctOn([registroDeEstudo.topicoId], { topicoId: registroDeEstudo.topicoId, nota: registroDeEstudo.nota, questoes: registroDeEstudo.questoes, acertos: registroDeEstudo.acertos })
      .from(registroDeEstudo)
      .where(and(inArray(registroDeEstudo.topicoId, visiveis.map((l) => l.topicoId)), isNotNull(registroDeEstudo.nota)))
      .orderBy(registroDeEstudo.topicoId, desc(registroDeEstudo.dataHora), desc(registroDeEstudo.criadoEm), desc(registroDeEstudo.id));
    for (const r of registros) ultimos.set(r.topicoId!, { nota: r.nota!, questoes: r.questoes, acertos: r.acertos });
  }
  const completar = (l: (typeof linhas)[number]): RevisaoDaLista => {
    const ultimo = ultimos.get(l.topicoId);
    return {
      ...l,
      diasDeAtraso: diasEntre(l.dia, hoje),
      ultimaNota: ultimo?.nota ?? null,
      acerto: ultimo ? percentualDeAcerto(ultimo.acertos ?? 0, ultimo.questoes ?? 0) : null,
    };
  };
  return {
    filtro,
    ciclos,
    vencidas: recortadas.map(completar),
    proximas: proximas.map(completar),
    totalVencidas: vencidas.length,
    totalProximas: proximas.length,
    totalVencidasGeral,
  };
}

/** O total de Revisões vencidas de todos os Ciclos ativos: o indicador da Hoje e o Counter da Sidebar. */
export async function contarRevisoesVencidas(db: Db, usuario: Usuario, agora = new Date()): Promise<number> {
  const hoje = hojeEmBrasilia(agora);
  const [linha] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(cartaoDeRevisao)
    .innerJoin(topico, eq(topico.id, cartaoDeRevisao.topicoId))
    .innerJoin(materia, eq(materia.id, topico.materiaId))
    .innerJoin(ciclo, eq(ciclo.id, materia.cicloId))
    .where(
      and(
        eq(ciclo.usuarioId, usuario.id),
        isNull(ciclo.arquivadoEm),
        isNotNull(cartaoDeRevisao.proximaRevisao),
        sql`to_char(${cartaoDeRevisao.proximaRevisao} at time zone ${FUSO}, 'YYYY-MM-DD') <= ${hoje}`,
      ),
    );
  return linha.total;
}
