import { and, desc, eq, isNull } from "drizzle-orm";
import type { Db } from "@/db";
import { ciclo, volta } from "@/db/schema";
import { travarCiclo } from "./ciclos";
import { NaoEncontradoError, ValidacaoError } from "./erros";
import type { Usuario } from "./usuario";

export type VoltaDoHistorico = { numero: number; inicio: Date; fim: Date | null };

/** As Voltas do Ciclo, da maior à menor: a aberta vem primeiro. A Volta 1 não guarda início; mostra a criação do Ciclo (AD-015). */
export async function listarVoltas(db: Db, usuario: Usuario, cicloId: string): Promise<VoltaDoHistorico[]> {
  const [dono] = await db.select({ criadoEm: ciclo.criadoEm }).from(ciclo).where(and(eq(ciclo.id, cicloId), eq(ciclo.usuarioId, usuario.id)));
  if (!dono) throw new NaoEncontradoError("Ciclo");
  const voltas = await db.select({ numero: volta.numero, inicio: volta.inicio, fim: volta.fim }).from(volta).where(eq(volta.cicloId, cicloId)).orderBy(desc(volta.numero));
  return voltas.map((v) => ({ ...v, inicio: v.inicio ?? dono.criadoEm }));
}

/**
 * Fecha a Volta aberta e abre a seguinte no mesmo instante. `numero` é a Volta que o Usuário viu: se já não é a
 * aberta (reinício duplicado), recusa em vez de fechar a Volta nova. Sempre permitido, mesmo sem estudo (AD-017).
 */
export async function reiniciarVolta(db: Db, usuario: Usuario, cicloId: string, numero: number): Promise<{ numero: number }> {
  // O número vem do cliente: um valor que não é inteiro nunca é uma Volta aberta.
  if (!Number.isInteger(numero)) throw new ValidacaoError("Esta volta já foi reiniciada. Atualize a página.");
  return db.transaction(async (tx) => {
    await travarCiclo(tx, usuario, cicloId);
    const agora = new Date();
    const [fechada] = await tx
      .update(volta)
      .set({ fim: agora })
      .where(and(eq(volta.cicloId, cicloId), isNull(volta.fim), eq(volta.numero, numero)))
      .returning({ numero: volta.numero });
    if (!fechada) throw new ValidacaoError("Esta volta já foi reiniciada. Atualize a página.");
    await tx.insert(volta).values({ cicloId, numero: numero + 1, inicio: agora });
    return { numero: numero + 1 };
  });
}
