import { eq } from "drizzle-orm";
import type { Db } from "@/db";
import { user } from "@/db/schema";
import type { Usuario } from "./usuario";

export type Home = {
  usuario: { nome: string; admin: boolean };
  ciclos: never[];
};

export async function obterHome(db: Db, usuario: Usuario): Promise<Home> {
  const [linha] = await db.select({ nome: user.name, admin: user.admin }).from(user).where(eq(user.id, usuario.id));
  if (!linha) throw new Error("Usuário não encontrado");
  return { usuario: linha, ciclos: [] };
}
