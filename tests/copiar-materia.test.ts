import { eq, inArray, sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  adicionarEtapa,
  arquivarCiclo,
  copiarMateria,
  criarCiclo,
  criarTopico,
  editarEtapa,
  excluirTopico,
  marcarTopico,
  NaoEncontradoError,
  obterCiclo,
  registrarEstudo,
  renomearTopico,
  ValidacaoError,
} from "@/casos-de-uso";
import { cartaoDeRevisao, etapa, materia, registroDeEstudo, topico } from "@/db/schema";
import { bancoDeTeste, cadastrar, limparBanco } from "./apoio";

const db = bancoDeTeste();
beforeEach(() => limparBanco(db));
afterAll(() => db.$client.end());

/** Ciclo "Origem" com Português: 2 Etapas (60 + 120 min), 4 Tópicos (o 1º com Registro e Cartão, o 2º marcado). */
async function origem(ana: { id: string }) {
  const { id: cicloId } = await criarCiclo(db, ana, { nome: "Origem" });
  const e1 = await adicionarEtapa(db, ana, cicloId, { nome: "Português", cargaMinutos: 60 });
  await adicionarEtapa(db, ana, cicloId, { nome: "Português", cargaMinutos: 120 });
  const t = [];
  for (const nome of ["Crase", "Sintaxe", "Pontuação", "Semântica"]) t.push((await criarTopico(db, ana, e1.materiaId, { nome })).id);
  await registrarEstudo(db, ana, e1.materiaId, { tipo: "Teoria", duracaoMinutos: 30, topicoId: t[0] });
  await marcarTopico(db, ana, t[1], true);
  return { cicloId, materiaId: e1.materiaId, topicos: t };
}

async function destino(ana: { id: string }, nome = "Destino") {
  return (await criarCiclo(db, ana, { nome })).id;
}

/** Tudo o que existe da Matéria, para comparar antes e depois. */
async function retrato(materiaId: string) {
  const topicos = await db.select().from(topico).where(eq(topico.materiaId, materiaId)).orderBy(topico.posicao);
  const ids = topicos.map((t) => t.id);
  return {
    materia: await db.select().from(materia).where(eq(materia.id, materiaId)),
    etapas: await db.select().from(etapa).where(eq(etapa.materiaId, materiaId)).orderBy(etapa.posicao),
    topicos,
    registros: await db.select().from(registroDeEstudo).where(eq(registroDeEstudo.materiaId, materiaId)),
    cartoes: ids.length ? await db.select().from(cartaoDeRevisao).where(inArray(cartaoDeRevisao.topicoId, ids)) : [],
  };
}

const contagens = async () => ({
  materias: (await db.select().from(materia)).length,
  etapas: (await db.select().from(etapa)).length,
  topicos: (await db.select().from(topico)).length,
});

describe("copiarMateria", () => {
  it("cria a Matéria, a Etapa no fim e os Tópicos na ordem", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const o = await origem(ana);
    const d = await destino(ana);
    await adicionarEtapa(db, ana, d, { nome: "Direito", cargaMinutos: 30 });

    const r = await copiarMateria(db, ana, d, { origemId: o.materiaId, nome: "Língua Portuguesa", cargaMinutos: 150 });

    const ciclo = await obterCiclo(db, ana, d);
    expect(ciclo.etapas.map((e) => [e.nome, e.cargaMinutos, e.posicao])).toEqual([["Direito", 30, 0], ["Língua Portuguesa", 150, 1]]);
    expect(ciclo.etapas[1].materiaId).toBe(r.materiaId);
    expect(r.materiaId).not.toBe(o.materiaId);
    const copiados = await db.select().from(topico).where(eq(topico.materiaId, r.materiaId)).orderBy(topico.posicao);
    expect(copiados.map((t) => t.nome)).toEqual(["Crase", "Sintaxe", "Pontuação", "Semântica"]);
    expect(copiados.map((t) => t.id)).not.toContain(o.topicos[0]);
  });

  it("os Tópicos copiados vêm não estudados, sem Registros nem Cartão", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const o = await origem(ana);
    const d = await destino(ana);

    const r = await copiarMateria(db, ana, d, { origemId: o.materiaId, nome: "Português", cargaMinutos: 180 });

    const copia = await retrato(r.materiaId);
    expect(copia.topicos.map((t) => t.estudado)).toEqual([false, false, false, false]);
    expect(copia.registros).toEqual([]);
    expect(copia.cartoes).toEqual([]);
    // a origem tem o que a cópia não leva
    const antes = await retrato(o.materiaId);
    expect(antes.registros).toHaveLength(1);
    expect(antes.cartoes).toHaveLength(1);
    expect(antes.topicos.filter((t) => t.estudado)).toHaveLength(2);
  });

  it("a origem fica inalterada", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const o = await origem(ana);
    const d = await destino(ana);
    const antes = await retrato(o.materiaId);

    await copiarMateria(db, ana, d, { origemId: o.materiaId, nome: "Português", cargaMinutos: 180 });

    expect(await retrato(o.materiaId)).toEqual(antes);
  });

  it("alterar a cópia não altera a origem", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const o = await origem(ana);
    const d = await destino(ana);
    const antes = await retrato(o.materiaId);

    const r = await copiarMateria(db, ana, d, { origemId: o.materiaId, nome: "Português", cargaMinutos: 180 });
    const [crase, sintaxe, pontuacao] = (await retrato(r.materiaId)).topicos.map((t) => t.id);
    await renomearTopico(db, ana, crase, { nome: "Crase 2" });
    await marcarTopico(db, ana, sintaxe, true);
    await excluirTopico(db, ana, pontuacao);
    await criarTopico(db, ana, r.materiaId, { nome: "Novo" });
    await editarEtapa(db, ana, r.id, { nome: "Português", cargaMinutos: 10 });
    await registrarEstudo(db, ana, r.materiaId, { tipo: "Teoria", duracaoMinutos: 20, topicoId: crase });

    expect(await retrato(o.materiaId)).toEqual(antes);
  });
});

describe("recusas", () => {
  it("recusa nome repetido no destino", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const o = await origem(ana);
    const d = await destino(ana);
    await adicionarEtapa(db, ana, d, { nome: "português", cargaMinutos: 30 });
    const antes = await contagens();

    await expect(copiarMateria(db, ana, d, { origemId: o.materiaId, nome: " Português ", cargaMinutos: 60 })).rejects.toThrow("Este ciclo já tem a matéria “Português”.");
    expect(await contagens()).toEqual(antes);
  });

  it("recusa carga inválida", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const o = await origem(ana);
    const d = await destino(ana);
    const antes = await contagens();

    for (const cargaMinutos of [0, -5, 1.5, NaN, 10_000 * 60 + 1])
      await expect(copiarMateria(db, ana, d, { origemId: o.materiaId, nome: "X", cargaMinutos })).rejects.toThrow("A carga horária precisa ser maior que zero e no máximo 10.000 horas.");
    expect(await contagens()).toEqual(antes);
  });

  it("recusa nome vazio", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const o = await origem(ana);
    const d = await destino(ana);
    const antes = await contagens();

    await expect(copiarMateria(db, ana, d, { origemId: o.materiaId, nome: "  ", cargaMinutos: 60 })).rejects.toThrow("Informe o nome da matéria.");
    expect(await contagens()).toEqual(antes);
  });

  it("recusa origem inexistente, de outro Usuário ou do próprio Ciclo", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const bia = await cadastrar(db, "bia@exemplo.com");
    const o = await origem(ana);
    const d = await destino(ana);
    const deBia = await origem(bia);
    const antes = await contagens();

    await expect(copiarMateria(db, ana, d, { origemId: crypto.randomUUID(), nome: "X", cargaMinutos: 60 })).rejects.toThrow(NaoEncontradoError);
    await expect(copiarMateria(db, ana, d, { origemId: deBia.materiaId, nome: "X", cargaMinutos: 60 })).rejects.toThrow(NaoEncontradoError);
    await expect(copiarMateria(db, ana, o.cicloId, { origemId: o.materiaId, nome: "X", cargaMinutos: 60 })).rejects.toThrow(ValidacaoError);
    expect(await contagens()).toEqual(antes);
  });

  it("recusa destino arquivado", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const o = await origem(ana);
    const d = await destino(ana);
    await arquivarCiclo(db, ana, d);
    const antes = await contagens();

    await expect(copiarMateria(db, ana, d, { origemId: o.materiaId, nome: "X", cargaMinutos: 60 })).rejects.toThrow("Ciclo arquivado. Reative para alterar.");
    expect(await contagens()).toEqual(antes);
  });

  it("uma falha no meio desfaz tudo", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const o = await origem(ana);
    const d = await destino(ana);
    await criarTopico(db, ana, o.materiaId, { nome: "Bomba" });
    const antes = await contagens();
    // O banco recusa a inserção do Tópico "Bomba", depois da Matéria e da Etapa já gravadas na transação.
    await db.execute(sql`create function falha_bomba() returns trigger language plpgsql as $$ begin if new.nome = 'Bomba' then raise exception 'falha forçada'; end if; return new; end $$`);
    await db.execute(sql`create trigger falha_bomba before insert on topico for each row execute function falha_bomba()`);
    try {
      await expect(copiarMateria(db, ana, d, { origemId: o.materiaId, nome: "Português", cargaMinutos: 60 })).rejects.toThrow();
    } finally {
      await db.execute(sql`drop trigger falha_bomba on topico`);
      await db.execute(sql`drop function falha_bomba()`);
    }
    expect(await contagens()).toEqual(antes);
  });
});

describe("bordas", () => {
  it("origem sem Tópicos gera cópia sem Tópicos", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await criarCiclo(db, ana, { nome: "Origem" });
    const e = await adicionarEtapa(db, ana, id, { nome: "Direito", cargaMinutos: 60 });
    const d = await destino(ana);

    const r = await copiarMateria(db, ana, d, { origemId: e.materiaId, nome: "Direito", cargaMinutos: 60 });

    expect(await db.select().from(topico).where(eq(topico.materiaId, r.materiaId))).toEqual([]);
    expect((await obterCiclo(db, ana, d)).etapas).toHaveLength(1);
  });

  it("a mesma cópia duas vezes recusa a segunda", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const o = await origem(ana);
    const d = await destino(ana);

    await copiarMateria(db, ana, d, { origemId: o.materiaId, nome: "Português", cargaMinutos: 180 });
    await expect(copiarMateria(db, ana, d, { origemId: o.materiaId, nome: "Português", cargaMinutos: 180 })).rejects.toThrow("Este ciclo já tem a matéria “Português”.");

    expect((await obterCiclo(db, ana, d)).etapas).toHaveLength(1);
  });
});
