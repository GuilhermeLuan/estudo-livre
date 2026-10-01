import { and, asc, eq, isNull } from "drizzle-orm";
import type { Db } from "@/db";
import { ciclo, user, volta } from "@/db/schema";
import { concluida } from "@/dominio";
import { progressoDosCiclos, type EtapaComProgresso, type MateriaComProgresso } from "./progresso";
import type { Usuario } from "./usuario";

export type CicloDaHome = {
  id: string;
  nome: string;
  volta: number;
  totalMaterias: number;
  totalEtapas: number;
  /** Matérias com Etapas, na ordem da primeira Etapa de cada uma. */
  materias: MateriaComProgresso[];
  etapas: EtapaComProgresso[];
  /** A Próxima etapa: a primeira, na ordem do ciclo, que ainda não chegou a 100%. */
  proxima: EtapaComProgresso | null;
  /** Etapas que já chegaram a 100% na Volta atual. */
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

function resumir(base: { id: string; nome: string; volta: number }, { etapas, materias }: { etapas: EtapaComProgresso[]; materias: MateriaComProgresso[] }): CicloDaHome {
  const carga = etapas.reduce((soma, e) => soma + e.cargaMinutos, 0);
  const feito = etapas.reduce((soma, e) => soma + e.feitoMinutos, 0);
  return {
    ...base,
    totalMaterias: materias.length,
    totalEtapas: etapas.length,
    materias,
    etapas,
    proxima: etapas.find((e) => !concluida(e)) ?? null,
    concluidas: etapas.filter(concluida).length,
    percentual: carga ? Math.round((feito / carga) * 100) : 0,
    faltaMinutos: carga - feito,
  };
}

export async function obterHome(db: Db, usuario: Usuario): Promise<Home> {
  // Uma leitura consistente: as Voltas e o progresso das Etapas vêm do mesmo instante.
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
      const progresso = await progressoDosCiclos(tx, eq(ciclo.usuarioId, usuario.id));
      return {
        usuario: linha,
        ciclos: ciclos.map((c) => resumir(c, progresso.get(c.id) ?? { etapas: [], materias: [] })),
      };
    },
    { isolationLevel: "repeatable read", accessMode: "read only" },
  );
}
