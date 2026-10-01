// Regras puras do domínio, sem banco: usadas pelos casos de uso e pela interface.

export const TIPOS_DE_ESTUDO = ["Teoria", "Exercícios", "Revisão", "Videoaula", "Leitura de lei"] as const;
export type TipoDeEstudo = (typeof TIPOS_DE_ESTUDO)[number];

export const LIMITES_DO_REGISTRO = {
  duracaoMaximaMinutos: 24 * 60,
  questoesMaximas: 1000,
  anotacaoMaxima: 2000,
  conteudoLivreMaximo: 200,
} as const;

/** Carga horária e progresso de uma Etapa ou de uma Matéria: a mesma regra de 100% vale para as duas. */
export type ComProgresso = { cargaMinutos: number; feitoMinutos: number };


/** A Etapa (ou Matéria) chegou a 100% da carga horária na Volta atual. */
export const concluida = (item: ComProgresso) => item.feitoMinutos >= item.cargaMinutos;

/** Progresso como fração de 0 a 1 (o progresso já vem travado em 100%). */
export const fracaoFeita = (item: ComProgresso) => item.feitoMinutos / item.cargaMinutos;

/**
 * Distribui o tempo estudado de cada Matéria pelas Etapas dela, na ordem em que vêm: cada Etapa recebe até a
 * própria carga horária e o que sobra passa para a seguinte. O que ultrapassa todas as Etapas da Matéria são
 * as horas extras (devolvidas por Matéria).
 */
export function preencherEtapas<E extends { materiaId: string; cargaMinutos: number }>(
  etapas: E[],
  estudadoPorMateria: ReadonlyMap<string, number>,
): { etapas: (E & { feitoMinutos: number })[]; extraPorMateria: Map<string, number> } {
  const restante = new Map(estudadoPorMateria);
  const preenchidas = etapas.map((etapa) => {
    const disponivel = restante.get(etapa.materiaId) ?? 0;
    const feitoMinutos = Math.min(disponivel, etapa.cargaMinutos);
    restante.set(etapa.materiaId, disponivel - feitoMinutos);
    return { ...etapa, feitoMinutos };
  });
  return { etapas: preenchidas, extraPorMateria: restante };
}
