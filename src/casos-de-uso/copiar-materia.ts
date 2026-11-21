import { and, asc, desc, eq, max, ne, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { ciclo, etapa, materia, topico } from "@/db/schema";
import { cargaValida, nomeValido, travarCiclo } from "./ciclos";
import { NaoEncontradoError, ValidacaoError } from "./erros";
import { avaliarFechamentoDaVolta } from "./progresso";
import type { Usuario } from "./usuario";

/**
 * Cria no Ciclo uma Matéria nova a partir de outra de um Ciclo do Usuário (ADR-0001): uma Etapa no fim com a carga
 * dada e os Tópicos da origem, não estudados. Registros e Cartões não vão; a origem não é tocada.
 */
export async function copiarMateria(
  db: Db,
  usuario: Usuario,
  cicloId: string,
  dados: { origemId: string; nome: string; cargaMinutos: number },
): Promise<{ id: string; materiaId: string; voltaFechada: number | null }> {
  const nome = nomeValido(dados.nome, "da matéria");
  const cargaMinutos = cargaValida(dados.cargaMinutos);
  return db.transaction(async (tx) => {
    await travarCiclo(tx, usuario, cicloId);
    const [origem] = await tx
      .select({ id: materia.id, cicloId: materia.cicloId })
      .from(materia)
      .innerJoin(ciclo, eq(ciclo.id, materia.cicloId))
      .where(and(eq(materia.id, dados.origemId), eq(ciclo.usuarioId, usuario.id)));
    if (!origem) throw new NaoEncontradoError("Matéria");
    if (origem.cicloId === cicloId) throw new ValidacaoError("Escolha uma matéria de outro ciclo.");
    const [repetida] = await tx
      .select({ id: materia.id })
      .from(materia)
      .where(and(eq(materia.cicloId, cicloId), sql`lower(${materia.nome}) = lower(${nome})`));
    if (repetida) throw new ValidacaoError(`Este ciclo já tem a matéria “${nome}”.`);

    const [nova] = await tx.insert(materia).values({ cicloId, nome }).returning({ id: materia.id });
    const [{ ultima }] = await tx.select({ ultima: max(etapa.posicao) }).from(etapa).where(eq(etapa.cicloId, cicloId));
    const [linha] = await tx
      .insert(etapa)
      .values({ cicloId, materiaId: nova.id, cargaMinutos, posicao: (ultima ?? -1) + 1 })
      .returning({ id: etapa.id });
    const topicos = await tx.select({ nome: topico.nome }).from(topico).where(eq(topico.materiaId, origem.id)).orderBy(asc(topico.posicao));
    if (topicos.length) await tx.insert(topico).values(topicos.map((t, i) => ({ materiaId: nova.id, nome: t.nome, posicao: i })));
    return { id: linha.id, materiaId: nova.id, voltaFechada: await avaliarFechamentoDaVolta(tx, cicloId) };
  });
}

export type MateriaCopiavel = { id: string; nome: string; cicloNome: string; arquivado: boolean; cargaMinutos: number };

/** As Matérias dos outros Ciclos do Usuário, ativos e arquivados, com a carga somada das Etapas (0 sem Etapas). */
export async function listarMateriasCopiaveis(db: Db, usuario: Usuario, cicloId: string): Promise<MateriaCopiavel[]> {
  const linhas = await db
    .select({
      id: materia.id,
      nome: materia.nome,
      cicloNome: ciclo.nome,
      arquivadoEm: ciclo.arquivadoEm,
      cargaMinutos: sql<number>`coalesce(sum(${etapa.cargaMinutos}), 0)::int`,
    })
    .from(materia)
    .innerJoin(ciclo, eq(ciclo.id, materia.cicloId))
    .leftJoin(etapa, eq(etapa.materiaId, materia.id))
    .where(and(eq(ciclo.usuarioId, usuario.id), ne(ciclo.id, cicloId)))
    .groupBy(materia.id, ciclo.id)
    .orderBy(desc(ciclo.criadoEm), asc(materia.nome));
  return linhas.map(({ arquivadoEm, ...m }) => ({ ...m, arquivado: arquivadoEm !== null }));
}
