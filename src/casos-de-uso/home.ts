import { and, asc, eq, isNull } from "drizzle-orm";
import type { Db } from "@/db";
import { ciclo, user, volta } from "@/db/schema";
import { concluida } from "@/dominio";
import { materiasComProgresso, type MateriaComProgresso } from "./progresso";
import type { Usuario } from "./usuario";

export type CicloDaHome = {
  id: string;
  nome: string;
  volta: number;
  totalMaterias: number;
  materias: MateriaComProgresso[];
  proxima: MateriaComProgresso | null;
  /** Matérias que já chegaram a 100% na Volta atual. */
  concluidas: number;
  /** Fração da carga horária total cumprida na Volta atual, de 0 a 100. */
  percentual: number;
  /** Tempo que falta para fechar a Volta atual. */
  faltaMinutos: number;
};

export type Home = {
  usuario: { nome: string; admin: boolean };
  ciclos: CicloDaHome[];
};

function resumir(base: { id: string; nome: string; volta: number }, materias: MateriaComProgresso[]): CicloDaHome {
  const carga = materias.reduce((soma, m) => soma + m.cargaMinutos, 0);
  const feito = materias.reduce((soma, m) => soma + m.feitoMinutos, 0);
  return {
    ...base,
    totalMaterias: materias.length,
    materias,
    proxima: materias.find((m) => !concluida(m)) ?? null,
    concluidas: materias.filter(concluida).length,
    percentual: carga ? Math.round((feito / carga) * 100) : 0,
    faltaMinutos: carga - feito,
  };
}

export async function obterHome(db: Db, usuario: Usuario): Promise<Home> {
  // Uma leitura consistente: as Voltas e o progresso das Matérias vêm do mesmo instante.
  return db.transaction(
    async (tx) => {
      const [linha] = await tx.select({ nome: user.name, admin: user.admin }).from(user).where(eq(user.id, usuario.id));
      if (!linha) throw new Error("Usuário não encontrado");
      const ciclos = await tx
        .select({ id: ciclo.id, nome: ciclo.nome, volta: volta.numero })
        .from(ciclo)
        .innerJoin(volta, and(eq(volta.cicloId, ciclo.id), isNull(volta.fim)))
        .where(eq(ciclo.usuarioId, usuario.id))
        .orderBy(asc(ciclo.criadoEm), asc(ciclo.id));
      const materias = await materiasComProgresso(tx, eq(ciclo.usuarioId, usuario.id));
      const porCiclo = Map.groupBy(materias, (m) => m.cicloId);
      return {
        usuario: linha,
        ciclos: ciclos.map((c) => resumir(c, (porCiclo.get(c.id) ?? []).map(({ cicloId: _, ...materia }) => materia))),
      };
    },
    { isolationLevel: "repeatable read", accessMode: "read only" },
  );
}
