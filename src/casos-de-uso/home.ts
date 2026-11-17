import { and, asc, eq, isNull, sql, type AnyColumn } from "drizzle-orm";
import type { Db, Tx } from "@/db";
import { ciclo, materia, registroDeEstudo, user, volta } from "@/db/schema";
import { FUSO, hojeEmBrasilia, segundaDaSemana, somarDias } from "@/dia";
import { concluida, percentualDeAcerto, variacaoPercentual } from "@/dominio";
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

/** Os números do dia e da semana (segunda a domingo, em Brasília), somados em todos os Ciclos do Usuário. */
export type Indicadores = {
  hojeMinutos: number;
  /** Hoje menos ontem; nulo sem estudo hoje ou sem diferença. */
  diferencaHojeMinutos: number | null;
  questoesHoje: number;
  acertoHoje: number | null;
  semanaMinutos: number;
  /** Contra a semana anterior inteira; nulo quando ela não teve estudo. */
  variacaoSemana: number | null;
};

export type Home = {
  usuario: { nome: string; admin: boolean };
  ciclos: CicloDaHome[];
  indicadores: Indicadores;
};

const inicioDoDia = (dia: string) => sql`(${dia}::date)::timestamp at time zone ${FUSO}`;

async function indicadoresDoUsuario(tx: Tx, usuarioId: string): Promise<Indicadores> {
  const hoje = hojeEmBrasilia();
  const segunda = segundaDaSemana(hoje);
  const intervalo = (de: string, ate: string) =>
    sql`${registroDeEstudo.dataHora} >= ${inicioDoDia(de)} and ${registroDeEstudo.dataHora} < ${inicioDoDia(ate)}`;
  const soma = (campo: AnyColumn, filtro: ReturnType<typeof intervalo>) =>
    sql<number>`coalesce(sum(${campo}) filter (where ${filtro}), 0)::int`;
  const amanha = somarDias(hoje, 1);
  const [linha] = await tx
    .select({
      hoje: soma(registroDeEstudo.duracaoMinutos, intervalo(hoje, amanha)),
      ontem: soma(registroDeEstudo.duracaoMinutos, intervalo(somarDias(hoje, -1), hoje)),
      questoes: soma(registroDeEstudo.questoes, intervalo(hoje, amanha)),
      acertos: soma(registroDeEstudo.acertos, intervalo(hoje, amanha)),
      semana: soma(registroDeEstudo.duracaoMinutos, intervalo(segunda, somarDias(segunda, 7))),
      semanaAnterior: soma(registroDeEstudo.duracaoMinutos, intervalo(somarDias(segunda, -7), segunda)),
    })
    .from(registroDeEstudo)
    .innerJoin(materia, eq(materia.id, registroDeEstudo.materiaId))
    .innerJoin(ciclo, eq(ciclo.id, materia.cicloId))
    .where(eq(ciclo.usuarioId, usuarioId));
  const diferenca = linha.hoje - linha.ontem;
  return {
    hojeMinutos: linha.hoje,
    diferencaHojeMinutos: linha.hoje > 0 && diferenca !== 0 ? diferenca : null,
    questoesHoje: linha.questoes,
    acertoHoje: percentualDeAcerto(linha.acertos, linha.questoes),
    semanaMinutos: linha.semana,
    variacaoSemana: variacaoPercentual(linha.semana, linha.semanaAnterior),
  };
}

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
        indicadores: await indicadoresDoUsuario(tx, usuario.id),
      };
    },
    { isolationLevel: "repeatable read", accessMode: "read only" },
  );
}
