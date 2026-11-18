import { and, eq } from "drizzle-orm";
import type { Db } from "@/db";
import { ciclo, cronometro, materia } from "@/db/schema";
import { NaoEncontradoError, ValidacaoError } from "./erros";
import type { Usuario } from "./usuario";

/** O Ciclo do Usuário, travado até o fim da transação. Não usa `travarCiclo`: arquivar e reativar valem também em arquivado. */
async function travar(db: Db, usuario: Usuario, cicloId: string, mudar: (tx: Parameters<Parameters<Db["transaction"]>[0]>[0], arquivadoEm: Date | null) => Promise<void>) {
  await db.transaction(async (tx) => {
    const [linha] = await tx
      .select({ arquivadoEm: ciclo.arquivadoEm })
      .from(ciclo)
      .where(and(eq(ciclo.id, cicloId), eq(ciclo.usuarioId, usuario.id)))
      .for("update");
    if (!linha) throw new NaoEncontradoError("Ciclo");
    await mudar(tx, linha.arquivadoEm);
  });
}

/** Tira o Ciclo da Hoje e das sugestões, mantendo todo o histórico (AD-023). Arquivar um arquivado não muda nada. */
export async function arquivarCiclo(db: Db, usuario: Usuario, cicloId: string): Promise<void> {
  await travar(db, usuario, cicloId, async (tx, arquivadoEm) => {
    if (arquivadoEm) return;
    const [rodando] = await tx
      .select({ usuarioId: cronometro.usuarioId })
      .from(cronometro)
      .innerJoin(materia, eq(materia.id, cronometro.materiaId))
      .where(and(eq(cronometro.usuarioId, usuario.id), eq(materia.cicloId, cicloId)));
    if (rodando) throw new ValidacaoError("Pare ou descarte o cronômetro antes de arquivar.");
    await tx.update(ciclo).set({ arquivadoEm: new Date() }).where(eq(ciclo.id, cicloId));
  });
}

/** Devolve o Ciclo à Hoje como estava. Reativar um ativo não muda nada. */
export async function reativarCiclo(db: Db, usuario: Usuario, cicloId: string): Promise<void> {
  await travar(db, usuario, cicloId, async (tx, arquivadoEm) => {
    if (arquivadoEm) await tx.update(ciclo).set({ arquivadoEm: null }).where(eq(ciclo.id, cicloId));
  });
}
