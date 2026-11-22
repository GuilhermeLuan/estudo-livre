// Regras puras do domínio, sem banco: usadas pelos casos de uso e pela interface.

export const TIPOS_DE_ESTUDO = ["Teoria", "Exercícios", "Revisão", "Videoaula", "Leitura de lei"] as const;
export type TipoDeEstudo = (typeof TIPOS_DE_ESTUDO)[number];

export const LIMITES_DO_REGISTRO = {
  duracaoMaximaMinutos: 24 * 60,
  questoesMaximas: 1000,
  anotacaoMaxima: 2000,
  conteudoLivreMaximo: 200,
} as const;

/** Tamanho máximo do arquivo de backup importado (AD-030); a página checa antes de enviar, o caso de uso de novo. */
export const LIMITE_DO_BACKUP_BYTES = 50 * 1024 * 1024;
export const BACKUP_GRANDE = "O arquivo passa de 50 MB.";

export const LIMITES_DO_TOPICO = { nomeMaximo: 120, importacaoMaxima: 200 } as const;

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

/** Variação percentual arredondada (meio ponto se afasta do zero) contra o período anterior; sem período anterior (0) não há variação. */
export function variacaoPercentual(atual: number, anterior: number): number | null {
  if (anterior <= 0) return null;
  const percentual = ((atual - anterior) / anterior) * 100;
  return Math.sign(percentual) * Math.round(Math.abs(percentual)); // meio ponto se afasta do zero nos dois sinais
}

/** Acerto arredondado de 0 a 100; sem questões não há acerto. */
export function percentualDeAcerto(acertos: number | null, questoes: number | null): number | null {
  return questoes ? Math.round(((acertos ?? 0) * 100) / questoes) : null;
}
