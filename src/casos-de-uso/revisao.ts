import { and, asc, eq, ne } from "drizzle-orm";
import { hojeEmBrasilia } from "@/dia";
import type { Db, Tx } from "@/db";
import { cartaoDeRevisao, ciclo, logDeRevisao, materia, registroDeEstudo, topico } from "@/db/schema";
import { NOTAS, recalcularCartao, sugerirNota, type Faixas, type Nota } from "@/revisao";
import { NaoEncontradoError, ValidacaoError } from "./erros";
import { instanteDoDia, type DadosDoEstudo } from "./estudo";
import type { Executor } from "./progresso";
import type { Usuario } from "./usuario";

/** Apaga e refaz o Cartão e o log do Tópico a partir dos Registros com nota (ADR-0002). Sem Registros, não há Cartão. */
export async function recalcularTopico(tx: Tx, topicoId: string): Promise<void> {
  await tx.delete(cartaoDeRevisao).where(eq(cartaoDeRevisao.topicoId, topicoId));
  await tx.delete(logDeRevisao).where(eq(logDeRevisao.topicoId, topicoId));
  const registros = await tx
    .select({ id: registroDeEstudo.id, nota: registroDeEstudo.nota, dataHora: registroDeEstudo.dataHora })
    .from(registroDeEstudo)
    .where(eq(registroDeEstudo.topicoId, topicoId))
    .orderBy(asc(registroDeEstudo.dataHora), asc(registroDeEstudo.criadoEm), asc(registroDeEstudo.id));
  if (registros.length === 0) return;
  const comNota = registros.filter((r) => r.nota !== null);
  const { proximaRevisao, estado, log } = recalcularCartao(comNota.map((r) => ({ nota: r.nota!, revisadoEm: r.dataHora })));
  await tx.insert(cartaoDeRevisao).values({ topicoId, proximaRevisao, estado });
  if (log.length > 0)
    await tx.insert(logDeRevisao).values(log.map((item, i) => ({ topicoId, registroId: comNota[i].id, nota: item.nota, revisadoEm: item.revisadoEm, antes: item.antes, depois: item.depois })));
}

/** O Cartão do Tópico do Usuário, ou nulo se o Tópico não tem Registros (ou é de outro Usuário). */
export async function obterCartao(db: Db, usuario: Usuario, topicoId: string): Promise<{ proximaRevisao: Date | null; estado: unknown } | null> {
  const [cartao] = await db
    .select({ proximaRevisao: cartaoDeRevisao.proximaRevisao, estado: cartaoDeRevisao.estado })
    .from(cartaoDeRevisao)
    .innerJoin(topico, eq(topico.id, cartaoDeRevisao.topicoId))
    .innerJoin(materia, eq(materia.id, topico.materiaId))
    .innerJoin(ciclo, eq(ciclo.id, materia.cicloId))
    .where(and(eq(cartaoDeRevisao.topicoId, topicoId), eq(ciclo.usuarioId, usuario.id)));
  return cartao ?? null;
}

export async function faixasDoCiclo(db: Executor, cicloId: string): Promise<{ faixas: Faixas; minimo: number }> {
  const [c] = await db
    .select({ erreiAte: ciclo.faixaErreiAte, dificilAte: ciclo.faixaDificilAte, bomAte: ciclo.faixaBomAte, minimo: ciclo.minimoDeQuestoes })
    .from(ciclo)
    .where(eq(ciclo.id, cicloId));
  return { faixas: { erreiAte: c.erreiAte, dificilAte: c.dificilAte, bomAte: c.bomAte }, minimo: c.minimo };
}

/**
 * A nota que o Registro grava: só há nota com Tópico e questões; a escolhida vale no lugar da sugerida e abaixo do
 * Mínimo é obrigatória (AD-020).
 */
export function resolverNota(ciclo: { faixas: Faixas; minimo: number }, d: { topicoId?: string | null; questoes?: number | null; acertos?: number | null; nota?: Nota | null }): Nota | null {
  if (d.nota != null && !NOTAS.includes(d.nota)) throw new ValidacaoError("Escolha uma nota válida.");
  if (!d.topicoId || !d.questoes) return null;
  const nota = d.nota ?? sugerirNota(d.acertos ?? null, d.questoes, ciclo.faixas, ciclo.minimo);
  if (!nota) throw new ValidacaoError("Escolha a nota da revisão.");
  return nota;
}

export type RascunhoDeRegistro = Pick<DadosDoEstudo, "dia" | "questoes" | "acertos" | "nota" | "topicoId"> & {
  materiaId: string;
  /** Registro em edição: o rascunho o substitui. */
  registroId?: string;
};

/**
 * O dia (Brasília) da próxima revisão que o Tópico teria se o rascunho fosse salvo: a mesma conta do recálculo, sem
 * gravar. Nulo sem Tópico, com rascunho que seria recusado, ou se o Cartão ficaria sem data.
 */
export async function estimarProximaRevisao(db: Db, usuario: Usuario, rascunho: RascunhoDeRegistro): Promise<string | null> {
  const [alvo] = await db
    .select({ cicloId: materia.cicloId })
    .from(materia)
    .innerJoin(ciclo, eq(ciclo.id, materia.cicloId))
    .where(and(eq(materia.id, rascunho.materiaId), eq(ciclo.usuarioId, usuario.id)));
  if (!alvo) throw new NaoEncontradoError("Matéria");
  if (!rascunho.topicoId) return null;
  const [doTopico] = await db.select({ id: topico.id }).from(topico).where(and(eq(topico.id, rascunho.topicoId), eq(topico.materiaId, rascunho.materiaId)));
  if (!doTopico) return null;

  let nota: Nota | null;
  try {
    nota = resolverNota(await faixasDoCiclo(db, alvo.cicloId), rascunho);
  } catch (erro) {
    if (erro instanceof ValidacaoError) return null;
    throw erro;
  }
  // Como o editarRegistro: o mesmo dia mantém o instante do Registro; senão o dia digitado.
  const [atual] = rascunho.registroId
    ? await db
        .select({ dataHora: registroDeEstudo.dataHora, criadoEm: registroDeEstudo.criadoEm })
        .from(registroDeEstudo)
        .innerJoin(materia, eq(materia.id, registroDeEstudo.materiaId))
        .innerJoin(ciclo, eq(ciclo.id, materia.cicloId))
        .where(and(eq(registroDeEstudo.id, rascunho.registroId), eq(ciclo.usuarioId, usuario.id)))
    : [];
  if (rascunho.registroId && !atual) throw new NaoEncontradoError("Registro");
  const agora = new Date();
  const dataHora = rascunho.dia === undefined || (atual && rascunho.dia === hojeEmBrasilia(atual.dataHora)) ? (atual?.dataHora ?? agora) : instanteDoDia(rascunho.dia, agora);

  const outros = await db
    .select({ id: registroDeEstudo.id, nota: registroDeEstudo.nota, dataHora: registroDeEstudo.dataHora, criadoEm: registroDeEstudo.criadoEm })
    .from(registroDeEstudo)
    .where(and(eq(registroDeEstudo.topicoId, rascunho.topicoId), rascunho.registroId ? ne(registroDeEstudo.id, rascunho.registroId) : undefined));
  const registros = [...outros, { id: rascunho.registroId ?? "\uffff", nota, dataHora, criadoEm: atual?.criadoEm ?? agora }]
    .filter((r) => r.nota !== null)
    .sort((a, b) => +a.dataHora - +b.dataHora || +a.criadoEm - +b.criadoEm || a.id.localeCompare(b.id));
  const { proximaRevisao } = recalcularCartao(registros.map((r) => ({ nota: r.nota!, revisadoEm: r.dataHora })));
  return proximaRevisao && hojeEmBrasilia(proximaRevisao);
}
