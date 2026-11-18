// Regras puras da revisão espaçada (sem banco). Importa só `ts-fsrs`: `scripts/cartoes.mjs` carrega este arquivo
// direto no Node, sem build.
import { createEmptyCard, fsrs, generatorParameters, Rating, type Card, type Grade } from "ts-fsrs";

export const NOTAS = ["Errei", "Difícil", "Bom", "Fácil"] as const;
export type Nota = (typeof NOTAS)[number];

export type Faixas = { erreiAte: number; dificilAte: number; bomAte: number };
export const FAIXAS_PADRAO: Faixas = { erreiAte: 60, dificilAte: 75, bomAte: 90 };
export const MINIMO_PADRAO = 5;

/** Nota do percentual de acerto: abaixo de cada limite fica na faixa anterior, o último limite em diante é Fácil. */
export function notaPelasFaixas(percentual: number, f: Faixas): Nota {
  if (percentual < f.erreiAte) return "Errei";
  if (percentual < f.dificilAte) return "Difícil";
  if (percentual < f.bomAte) return "Bom";
  return "Fácil";
}

export function textoDaFaixa(nota: Nota, f: Faixas): string {
  return {
    Errei: `< ${f.erreiAte}%`,
    Difícil: `${f.erreiAte}–${f.dificilAte}%`,
    Bom: `${f.dificilAte}–${f.bomAte}%`,
    Fácil: `≥ ${f.bomAte}%`,
  }[nota];
}

const percentual = (acertos: number | null, questoes: number) => Math.round(((acertos ?? 0) * 100) / questoes);

/** Sugestão das Faixas; sem questões ou abaixo do Mínimo não há sugestão. */
export function sugerirNota(acertos: number | null, questoes: number | null, f: Faixas, minimo: number): Nota | null {
  if (!questoes || questoes < minimo) return null;
  return notaPelasFaixas(percentual(acertos, questoes), f);
}

export function fraseDaNota(acertos: number | null, questoes: number | null, f: Faixas, minimo: number): string {
  const nota = sugerirNota(acertos, questoes, f, minimo);
  if (!nota) return `Menos de ${minimo} questões: escolha a nota da revisão.`;
  return `${percentual(acertos, questoes!)}% está na faixa ${textoDaFaixa(nota, f)} deste ciclo. Você pode trocar a nota antes de salvar.`;
}

const inteiroEntre = (n: number, de: number, ate: number) => Number.isInteger(n) && n >= de && n <= ate;

/** Primeiro erro das Faixas (com o campo que o causou) ou nulo se estão válidas. */
export function validarFaixas(d: Faixas & { minimo: number }): { campo: keyof Faixas | "minimo"; mensagem: string } | null {
  const limites = [["erreiAte", d.erreiAte], ["dificilAte", d.dificilAte], ["bomAte", d.bomAte]] as const;
  for (const [campo, valor] of limites) {
    if (!inteiroEntre(valor, 1, 100)) return { campo, mensagem: "Informe um número inteiro de 1 a 100." };
  }
  if (d.dificilAte <= d.erreiAte) return { campo: "dificilAte", mensagem: "Cada limite deve ser maior que o anterior." };
  if (d.bomAte <= d.dificilAte) return { campo: "bomAte", mensagem: "Cada limite deve ser maior que o anterior." };
  if (!inteiroEntre(d.minimo, 1, 1000)) return { campo: "minimo", mensagem: "Informe um número inteiro de 1 a 1000." };
  return null;
}

const GRAUS: Record<Nota, Grade> = { Errei: Rating.Again, Difícil: Rating.Hard, Bom: Rating.Good, Fácil: Rating.Easy };
const agendador = fsrs(generatorParameters({ enable_fuzz: false, enable_short_term: false, request_retention: 0.9 }));

export type ItemDoLog = { nota: Nota; revisadoEm: Date; antes: Card; depois: Card };

/** Refaz o Cartão do zero aplicando as notas, já em ordem cronológica. Sem notas não há Cartão com data. */
export function recalcularCartao(notas: { nota: Nota; revisadoEm: Date }[]): { proximaRevisao: Date | null; estado: Card | null; log: ItemDoLog[] } {
  let estado: Card | null = null;
  const log: ItemDoLog[] = [];
  for (const { nota, revisadoEm } of notas) {
    const antes: Card = estado ?? createEmptyCard(revisadoEm);
    const depois = agendador.next(antes, revisadoEm, GRAUS[nota]).card;
    log.push({ nota, revisadoEm, antes, depois });
    estado = depois;
  }
  return { proximaRevisao: estado?.due ?? null, estado, log };
}
