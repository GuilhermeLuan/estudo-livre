// Regras puras do domínio, sem banco: usadas pelos casos de uso e pela interface.

export const TIPOS_DE_ESTUDO = ["Teoria", "Exercícios", "Revisão", "Videoaula", "Leitura de lei"] as const;
export type TipoDeEstudo = (typeof TIPOS_DE_ESTUDO)[number];

export const LIMITES_DO_REGISTRO = {
  duracaoMaximaMinutos: 24 * 60,
  questoesMaximas: 1000,
  anotacaoMaxima: 2000,
  conteudoLivreMaximo: 200,
} as const;

/** Tamanho máximo do arquivo de backup importado (AD-034); a página checa antes de enviar, o caso de uso de novo. */
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

// Sugestão de ciclo (AD-037, AD-038): o peso de cada Matéria vira Etapas de duração fixa, em rodadas.

export const DIFICULDADES = ["facil", "media", "dificil"] as const;
export type Dificuldade = (typeof DIFICULDADES)[number];
export const ROTULO_DA_DIFICULDADE: Record<Dificuldade, string> = { facil: "Fácil", media: "Média", dificil: "Difícil" };

export const LIMITES_DA_SUGESTAO = { questoesMaximas: 10_000, materiasMaximas: 50, etapasMinimas: 1, etapasMaximas: 8 } as const;
export const DURACAO_PADRAO_DA_ETAPA_MINUTOS = 60;

export const NOME_DA_MATERIA_VAZIO = "Informe o nome da matéria.";
export const LISTA_CHEIA = `A sugestão aceita até ${LIMITES_DA_SUGESTAO.materiasMaximas} matérias.`;
export const QUESTOES_INVALIDAS = `Informe as questões da prova (inteiro de 1 a ${LIMITES_DA_SUGESTAO.questoesMaximas.toLocaleString("pt-BR")}).`;
export const LISTA_VAZIA = "Adicione ao menos uma matéria para gerar as etapas.";
export const materiaRepetida = (nome: string) => `A matéria “${nome}” já está na lista.`;

export const CARGA_MAXIMA_MINUTOS = 10_000 * 60;
export const CARGA_INVALIDA = "A carga horária precisa ser maior que zero e no máximo 10.000 horas.";
export const cargaEmLimites = (minutos: number) => Number.isInteger(minutos) && minutos > 0 && minutos <= CARGA_MAXIMA_MINUTOS;

export const questoesDaProvaValidas = (x: unknown): x is number =>
  typeof x === "number" && Number.isInteger(x) && x >= 1 && x <= LIMITES_DA_SUGESTAO.questoesMaximas;

/** "50" -> 50; vazio, decimal ("7,5"), com ponto de milhar ou texto viram NaN, que `questoesDaProvaValidas` recusa. */
export const questoesDeTexto = (texto: string) => (/^\d+$/.test(texto.trim()) ? Number(texto.trim()) : Number.NaN);

/** Horas digitadas (aceita vírgula ou ponto) em minutos arredondados; texto que não é número vira NaN. */
export const minutosDeHoras = (horas: string) => Math.round(Number(horas.trim().replace(",", ".")) * 60);

export type MateriaParaSugerir = { nome: string; questoesDaProva: number; dificuldade: Dificuldade };
export type EtapaSugerida = { nome: string };

// Fator da dificuldade em dobro (1; 1,5; 2), para a conta ficar em inteiros.
const FATOR_EM_DOBRO: Record<Dificuldade, number> = { facil: 2, media: 3, dificil: 4 };

/** Peso da Matéria: Questões da prova × fator (Fácil 1, Média 1,5, Difícil 2). */
export const pesoDaMateria = (m: Pick<MateriaParaSugerir, "questoesDaProva" | "dificuldade">) => (m.questoesDaProva * FATOR_EM_DOBRO[m.dificuldade]) / 2;

/** Por que a Matéria de `nome` não pode entrar na lista, ou null: nome vazio, lista cheia ou nome repetido (sem diferenciar maiúsculas). */
export function erroDaNovaMateria(existentes: readonly string[], nome: string): string | null {
  const limpo = nome.trim();
  if (!limpo) return NOME_DA_MATERIA_VAZIO;
  if (existentes.length >= LIMITES_DA_SUGESTAO.materiasMaximas) return LISTA_CHEIA;
  if (existentes.some((e) => e.trim().toLowerCase() === limpo.toLowerCase())) return materiaRepetida(limpo);
  return null;
}

/**
 * As Etapas da Sugestão de ciclo: cada Matéria recebe peso ÷ menor peso Etapas (meio para cima, de 1 a 8) e
 * elas saem em rodadas, uma de cada Matéria que ainda tem sobrando, da de maior peso para a de menor; o empate
 * de peso segue a ordem em que as Matérias vieram.
 */
export function sugerirEtapas(materias: readonly MateriaParaSugerir[]): EtapaSugerida[] {
  if (!materias.length) return [];
  const pesos = materias.map((m) => m.questoesDaProva * FATOR_EM_DOBRO[m.dificuldade]);
  const menor = Math.min(...pesos);
  const { etapasMinimas, etapasMaximas } = LIMITES_DA_SUGESTAO;
  const etapas = pesos.map((p) => Math.min(etapasMaximas, Math.max(etapasMinimas, Math.floor((2 * p + menor) / (2 * menor)))));
  const ordem = materias.map((_, i) => i).sort((a, b) => pesos[b] - pesos[a] || a - b);
  const sugeridas: EtapaSugerida[] = [];
  for (let rodada = 0; rodada < etapasMaximas; rodada++) {
    for (const i of ordem) if (etapas[i] > rodada) sugeridas.push({ nome: materias[i].nome });
  }
  return sugeridas;
}

/**
 * A Duração da etapa que a edição do Ciclo mostra (AD-041): a gravada no Ciclo; sem ela, a carga mais comum das
 * Etapas (no empate, a menor); sem Etapas, o padrão de 1h.
 */
export function duracaoDaEdicao(gravada: number | null, cargas: readonly number[]): number {
  if (gravada !== null) return gravada;
  const vezes = new Map<number, number>();
  for (const c of cargas) vezes.set(c, (vezes.get(c) ?? 0) + 1);
  let escolhida = DURACAO_PADRAO_DA_ETAPA_MINUTOS;
  let maior = 0;
  for (const [carga, n] of vezes) if (n > maior || (n === maior && carga < escolhida)) [escolhida, maior] = [carga, n];
  return escolhida;
}
