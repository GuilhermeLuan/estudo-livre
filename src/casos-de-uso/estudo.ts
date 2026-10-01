import { and, eq } from "drizzle-orm";
import type { Db } from "@/db";
import { ciclo, materia, registroDeEstudo } from "@/db/schema";
import { hojeEmBrasilia } from "@/dia";
import { LIMITES_DO_REGISTRO, TIPOS_DE_ESTUDO, type TipoDeEstudo } from "@/dominio";
import { NaoEncontradoError, ValidacaoError } from "./erros";
import { avaliarFechamentoDaVolta } from "./progresso";
import type { Usuario } from "./usuario";

export type DadosDoEstudo = {
  tipo: TipoDeEstudo;
  duracaoMinutos: number;
  /** Dia do estudo (AAAA-MM-DD, em Brasília); padrão: hoje. Não pode estar no futuro. */
  dia?: string;
  questoes?: number | null;
  acertos?: number | null;
  anotacao?: string | null;
  conteudoLivre?: string | null;
};

const { duracaoMaximaMinutos, questoesMaximas, anotacaoMaxima, conteudoLivreMaximo } = LIMITES_DO_REGISTRO;

const DIA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Converte o dia digitado no formulário (AAAA-MM-DD) no instante do estudo: hoje (em Brasília)
 * vale o momento atual; um dia passado vale meio-dia de Brasília, longe das viradas de dia.
 */
export function instanteDoDia(dia: string, agora = new Date()): Date {
  const partes = DIA_ISO.exec(dia);
  const meioDia = partes && new Date(`${dia}T12:00:00-03:00`);
  if (!partes || !meioDia || Number.isNaN(meioDia.getTime()) || meioDia.toISOString().slice(0, 10) !== dia)
    throw new ValidacaoError("Informe uma data válida.");
  const hoje = hojeEmBrasilia(agora);
  if (dia > hoje) throw new ValidacaoError("A data do estudo não pode estar no futuro.");
  return dia === hoje ? agora : meioDia;
}

function inteiroEntre(valor: number, minimo: number, maximo: number) {
  return Number.isInteger(valor) && valor >= minimo && valor <= maximo;
}

function textoOpcional(texto: string | null | undefined, maximo: number, rotulo: string) {
  const limpo = texto?.trim() || null;
  if (limpo && limpo.length > maximo) throw new ValidacaoError(`${rotulo} pode ter no máximo ${maximo} caracteres.`);
  return limpo;
}

function validar(dados: DadosDoEstudo) {
  if (!TIPOS_DE_ESTUDO.includes(dados.tipo)) throw new ValidacaoError("Escolha um tipo de estudo.");
  if (!inteiroEntre(dados.duracaoMinutos, 1, duracaoMaximaMinutos))
    throw new ValidacaoError("A duração precisa ter de 1 minuto a 24 horas.");
  if (dados.dia !== undefined) instanteDoDia(dados.dia);

  const questoes = dados.questoes ?? null;
  const acertos = dados.acertos ?? null;
  if (questoes !== null && !inteiroEntre(questoes, 0, questoesMaximas))
    throw new ValidacaoError(`Questões precisa ser um número de 0 a ${questoesMaximas}.`);
  if (acertos !== null) {
    if (questoes === null) throw new ValidacaoError("Informe as questões para registrar os acertos.");
    if (!inteiroEntre(acertos, 0, questoes)) throw new ValidacaoError("Os acertos não podem passar do total de questões.");
  }
  return {
    tipo: dados.tipo,
    duracaoMinutos: dados.duracaoMinutos,
    questoes,
    acertos,
    anotacao: textoOpcional(dados.anotacao, anotacaoMaxima, "A anotação"),
    conteudoLivre: textoOpcional(dados.conteudoLivre, conteudoLivreMaximo, "O conteúdo"),
  };
}

export async function registrarEstudo(db: Db, usuario: Usuario, materiaId: string, dados: DadosDoEstudo): Promise<{ id: string; materia: string; voltaFechada: number | null }> {
  const registro = validar(dados);
  return db.transaction(async (tx) => {
    const [alvo] = await tx
      .select({ cicloId: materia.cicloId, nome: materia.nome })
      .from(materia)
      .innerJoin(ciclo, eq(ciclo.id, materia.cicloId))
      .where(and(eq(materia.id, materiaId), eq(ciclo.usuarioId, usuario.id)));
    if (!alvo) throw new NaoEncontradoError("Matéria");
    // Trava o Ciclo para que registros simultâneos não fechem a mesma Volta duas vezes.
    await tx.select({ id: ciclo.id }).from(ciclo).where(eq(ciclo.id, alvo.cicloId)).for("update");
    // O instante de "hoje" vale só depois da trava: assim o registro nunca cai numa Volta que outro acabou de fechar.
    const dataHora = dados.dia === undefined ? new Date() : instanteDoDia(dados.dia);
    const [linha] = await tx.insert(registroDeEstudo).values({ materiaId, ...registro, dataHora }).returning({ id: registroDeEstudo.id });
    const voltaFechada = await avaliarFechamentoDaVolta(tx, alvo.cicloId);
    return { id: linha.id, materia: alvo.nome, voltaFechada };
  });
}
