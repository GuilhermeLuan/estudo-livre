import { and, asc, eq } from "drizzle-orm";
import type { Db, Tx } from "@/db";
import { cartaoDeRevisao, ciclo, logDeRevisao, materia, registroDeEstudo, topico } from "@/db/schema";
import { recalcularCartao } from "@/revisao";
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
