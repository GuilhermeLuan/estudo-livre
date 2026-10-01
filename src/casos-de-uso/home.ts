import { and, asc, eq, isNull } from "drizzle-orm";
import type { Db } from "@/db";
import { ciclo, user, volta } from "@/db/schema";
import { materiasComProgresso } from "./progresso";
import type { Usuario } from "./usuario";

export type MateriaDaHome = { id: string; nome: string; cargaMinutos: number; feitoMinutos: number };

export type Home = {
  usuario: { nome: string; admin: boolean };
  ciclos: { id: string; nome: string; totalMaterias: number; volta: number; materias: MateriaDaHome[]; proxima: MateriaDaHome | null }[];
};

export async function obterHome(db: Db, usuario: Usuario): Promise<Home> {
  const [linha] = await db.select({ nome: user.name, admin: user.admin }).from(user).where(eq(user.id, usuario.id));
  if (!linha) throw new Error("Usuário não encontrado");
  const ciclos = await db
    .select({ id: ciclo.id, nome: ciclo.nome, volta: volta.numero })
    .from(ciclo)
    .innerJoin(volta, and(eq(volta.cicloId, ciclo.id), isNull(volta.fim)))
    .where(eq(ciclo.usuarioId, usuario.id))
    .orderBy(asc(ciclo.criadoEm), asc(ciclo.id));
  const materias = await materiasComProgresso(db, eq(ciclo.usuarioId, usuario.id));
  return {
    usuario: linha,
    ciclos: ciclos.map((c) => {
      const doCiclo = materias.filter((m) => m.cicloId === c.id).map(({ cicloId: _, ...m }) => m);
      const proxima = doCiclo.find((m) => m.feitoMinutos < m.cargaMinutos) ?? null;
      return { ...c, totalMaterias: doCiclo.length, materias: doCiclo, proxima };
    }),
  };
}
