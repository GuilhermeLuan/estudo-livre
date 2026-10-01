import { asc, count, eq } from "drizzle-orm";
import type { Db } from "@/db";
import { ciclo, materia, user } from "@/db/schema";
import type { Usuario } from "./usuario";

export type Home = {
  usuario: { nome: string; admin: boolean };
  ciclos: { id: string; nome: string; totalMaterias: number }[];
};

export async function obterHome(db: Db, usuario: Usuario): Promise<Home> {
  const [linha] = await db.select({ nome: user.name, admin: user.admin }).from(user).where(eq(user.id, usuario.id));
  if (!linha) throw new Error("Usuário não encontrado");
  const ciclos = await db
    .select({ id: ciclo.id, nome: ciclo.nome, totalMaterias: count(materia.id) })
    .from(ciclo)
    .leftJoin(materia, eq(materia.cicloId, ciclo.id))
    .where(eq(ciclo.usuarioId, usuario.id))
    .groupBy(ciclo.id)
    .orderBy(asc(ciclo.criadoEm), asc(ciclo.id));
  return { usuario: linha, ciclos };
}
