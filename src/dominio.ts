// Regras puras do domínio, sem banco: usadas pelos casos de uso e pela interface.

export const TIPOS_DE_ESTUDO = ["Teoria", "Exercícios", "Revisão", "Videoaula", "Leitura de lei"] as const;
export type TipoDeEstudo = (typeof TIPOS_DE_ESTUDO)[number];

export const LIMITES_DO_REGISTRO = {
  duracaoMaximaMinutos: 24 * 60,
  questoesMaximas: 1000,
  anotacaoMaxima: 2000,
  conteudoLivreMaximo: 200,
} as const;

export type ProgressoDaMateria = { cargaMinutos: number; feitoMinutos: number };

/** A Matéria chegou a 100% da carga horária na Volta atual. */
export const concluida = (m: ProgressoDaMateria) => m.feitoMinutos >= m.cargaMinutos;

/** Progresso da matéria como fração de 0 a 1 (o progresso já vem travado em 100%). */
export const fracaoFeita = (m: ProgressoDaMateria) => m.feitoMinutos / m.cargaMinutos;
