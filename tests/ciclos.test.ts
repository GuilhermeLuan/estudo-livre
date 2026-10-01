import { sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  adicionarEtapa,
  criarCiclo,
  editarEtapa,
  NaoEncontradoError,
  obterCiclo,
  obterEstatisticas,
  obterHome,
  registrarEstudo,
  removerEtapa,
  renomearCiclo,
  reordenarEtapas,
  ValidacaoError,
} from "@/casos-de-uso";
import { bancoDeTeste, cadastrar, limparBanco } from "./apoio";

const db = bancoDeTeste();
beforeEach(() => limparBanco(db));
afterAll(() => db.$client.end());

const nomes = async (usuario: { id: string }, cicloId: string) =>
  (await obterCiclo(db, usuario, cicloId)).etapas.map((m) => m.nome);

describe("ciclos", () => {
  it("cria e renomeia um Ciclo", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await criarCiclo(db, ana, { nome: "  TRF  " });

    expect((await obterCiclo(db, ana, id)).nome).toBe("TRF");
    await renomearCiclo(db, ana, id, { nome: "TRF 2026" });
    expect((await obterCiclo(db, ana, id)).nome).toBe("TRF 2026");
  });

  it("rejeita nome vazio", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    await expect(criarCiclo(db, ana, { nome: "   " })).rejects.toThrow(ValidacaoError);
    const { id } = await criarCiclo(db, ana, { nome: "TRF" });
    await expect(renomearCiclo(db, ana, id, { nome: "" })).rejects.toThrow(ValidacaoError);
  });

  it("vários Ciclos aparecem na tela inicial", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const a = await criarCiclo(db, ana, { nome: "TRF" });
    await criarCiclo(db, ana, { nome: "INSS" });
    await adicionarEtapa(db, ana, a.id, { nome: "Português", cargaMinutos: 120 });

    const { ciclos } = await obterHome(db, ana);
    expect(ciclos.map((c) => c.nome)).toEqual(["TRF", "INSS"]);
    expect(ciclos.map((c) => c.totalMaterias)).toEqual([1, 0]);
  });
});

describe("etapas", () => {
  it("adiciona Etapas na ordem, edita e remove", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await criarCiclo(db, ana, { nome: "TRF" });
    const port = await adicionarEtapa(db, ana, id, { nome: "Português", cargaMinutos: 120 });
    await adicionarEtapa(db, ana, id, { nome: "Direito", cargaMinutos: 90 });

    expect(await nomes(ana, id)).toEqual(["Português", "Direito"]);

    await editarEtapa(db, ana, port.id, { nome: "Língua Portuguesa", cargaMinutos: 150 });
    const [primeira] = (await obterCiclo(db, ana, id)).etapas;
    expect(primeira).toMatchObject({ nome: "Língua Portuguesa", cargaMinutos: 150 });

    await removerEtapa(db, ana, port.id);
    expect(await nomes(ana, id)).toEqual(["Direito"]);
  });

  it("a Matéria aparece uma só vez, mesmo com várias Etapas (sem diferenciar maiúsculas)", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await criarCiclo(db, ana, { nome: "BB" });
    const a = await adicionarEtapa(db, ana, id, { nome: "TI", cargaMinutos: 60 });
    await adicionarEtapa(db, ana, id, { nome: "Estatística", cargaMinutos: 120 });
    const c = await adicionarEtapa(db, ana, id, { nome: " ti ", cargaMinutos: 50 });

    expect(c.materiaId).toBe(a.materiaId);
    expect(c.id).not.toBe(a.id);
    expect(await nomes(ana, id)).toEqual(["TI", "Estatística", "TI"]);
    expect((await obterHome(db, ana)).ciclos[0]).toMatchObject({ totalMaterias: 2, totalEtapas: 3 });
  });

  it("editar o nome da Etapa a aponta para outra Matéria, criada se não existir", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await criarCiclo(db, ana, { nome: "BB" });
    const ti = await adicionarEtapa(db, ana, id, { nome: "TI", cargaMinutos: 60 });
    const est = await adicionarEtapa(db, ana, id, { nome: "Estatística", cargaMinutos: 60 });

    await editarEtapa(db, ana, ti.id, { nome: "Estatística", cargaMinutos: 60 });
    expect((await obterCiclo(db, ana, id)).etapas.map((e) => e.materiaId)).toEqual([est.materiaId, est.materiaId]);
    await editarEtapa(db, ana, ti.id, { nome: "Inglês", cargaMinutos: 30 });
    expect((await obterCiclo(db, ana, id)).etapas.map((e) => e.nome)).toEqual(["Inglês", "Estatística"]);
    expect((await obterHome(db, ana)).ciclos[0].materias.map((m) => m.nome)).toEqual(["Inglês", "Estatística"]);
  });

  it("remover a última Etapa mantém a Matéria que já tem estudo e descarta a que não tem", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await criarCiclo(db, ana, { nome: "BB" });
    const ti = await adicionarEtapa(db, ana, id, { nome: "TI", cargaMinutos: 60 });
    const ing = await adicionarEtapa(db, ana, id, { nome: "Inglês", cargaMinutos: 60 });
    await registrarEstudo(db, ana, ti.materiaId, { tipo: "Teoria", duracaoMinutos: 30 });

    await removerEtapa(db, ana, ti.id);
    await removerEtapa(db, ana, ing.id);

    expect((await obterCiclo(db, ana, id)).etapas).toEqual([]);
    expect((await obterHome(db, ana)).ciclos[0].materias).toEqual([]);
    expect((await obterEstatisticas(db, ana)).horasPorMateria.map((m) => [m.nome, m.minutos])).toEqual([["TI", 30]]);

    const volta = await adicionarEtapa(db, ana, id, { nome: "TI", cargaMinutos: 60 });
    expect(volta.materiaId).toBe(ti.materiaId);
  });

  it("rejeita nome vazio e carga horária inválida", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await criarCiclo(db, ana, { nome: "TRF" });

    await expect(adicionarEtapa(db, ana, id, { nome: " ", cargaMinutos: 60 })).rejects.toThrow(ValidacaoError);
    await expect(adicionarEtapa(db, ana, id, { nome: "X", cargaMinutos: 0 })).rejects.toThrow(ValidacaoError);
    await expect(adicionarEtapa(db, ana, id, { nome: "X", cargaMinutos: 1.5 })).rejects.toThrow(ValidacaoError);
    await expect(adicionarEtapa(db, ana, id, { nome: "X", cargaMinutos: 2 ** 31 })).rejects.toThrow(ValidacaoError);
  });

  it("reordena as Etapas do Ciclo", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await criarCiclo(db, ana, { nome: "TRF" });
    const a = await adicionarEtapa(db, ana, id, { nome: "A", cargaMinutos: 60 });
    const b = await adicionarEtapa(db, ana, id, { nome: "B", cargaMinutos: 60 });
    const c = await adicionarEtapa(db, ana, id, { nome: "C", cargaMinutos: 60 });

    await reordenarEtapas(db, ana, id, [c.id, a.id, b.id]);
    expect(await nomes(ana, id)).toEqual(["C", "A", "B"]);

    await adicionarEtapa(db, ana, id, { nome: "D", cargaMinutos: 60 });
    expect(await nomes(ana, id)).toEqual(["C", "A", "B", "D"]);
  });

  it("a reordenação espera as outras alterações do Ciclo, para não perder uma Etapa recém-adicionada", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await criarCiclo(db, ana, { nome: "TRF" });
    const a = await adicionarEtapa(db, ana, id, { nome: "A", cargaMinutos: 60 });
    const b = await adicionarEtapa(db, ana, id, { nome: "B", cargaMinutos: 60 });

    // Uma alteração em andamento segura o Ciclo; a reordenação precisa esperar por ela.
    let soltar!: () => void;
    const solto = new Promise<void>((r) => (soltar = r));
    const preso = db.transaction(async (tx) => {
      await tx.execute(sql`select 1 from ciclo for update`);
      await solto;
    });
    await new Promise((r) => setTimeout(r, 100));
    let terminou = false;
    const reordenacao = reordenarEtapas(db, ana, id, [b.id, a.id]).then(() => (terminou = true));
    await new Promise((r) => setTimeout(r, 200));
    expect(terminou).toBe(false);

    soltar();
    await Promise.all([preso, reordenacao]);
    expect(await nomes(ana, id)).toEqual(["B", "A"]);
  });

  it("a reordenação exige exatamente as Etapas do Ciclo", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await criarCiclo(db, ana, { nome: "TRF" });
    const outro = await criarCiclo(db, ana, { nome: "INSS" });
    const a = await adicionarEtapa(db, ana, id, { nome: "A", cargaMinutos: 60 });
    await adicionarEtapa(db, ana, id, { nome: "B", cargaMinutos: 60 });
    const x = await adicionarEtapa(db, ana, outro.id, { nome: "X", cargaMinutos: 60 });

    await expect(reordenarEtapas(db, ana, id, [a.id])).rejects.toThrow(ValidacaoError);
    await expect(reordenarEtapas(db, ana, id, [a.id, x.id])).rejects.toThrow(ValidacaoError);
    await expect(reordenarEtapas(db, ana, id, [a.id, a.id])).rejects.toThrow(ValidacaoError);
  });
});

describe("isolamento entre Usuários", () => {
  it("um Usuário não vê nem altera Ciclos e Etapas de outro", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const bia = await cadastrar(db, "bia@exemplo.com");
    const ciclo = await criarCiclo(db, ana, { nome: "TRF" });
    const etapa = await adicionarEtapa(db, ana, ciclo.id, { nome: "Português", cargaMinutos: 60 });

    expect((await obterHome(db, bia)).ciclos).toEqual([]);
    await expect(obterCiclo(db, bia, ciclo.id)).rejects.toThrow(NaoEncontradoError);
    await expect(renomearCiclo(db, bia, ciclo.id, { nome: "Meu" })).rejects.toThrow(NaoEncontradoError);
    await expect(adicionarEtapa(db, bia, ciclo.id, { nome: "X", cargaMinutos: 60 })).rejects.toThrow(NaoEncontradoError);
    await expect(editarEtapa(db, bia, etapa.id, { nome: "X", cargaMinutos: 60 })).rejects.toThrow(NaoEncontradoError);
    await expect(removerEtapa(db, bia, etapa.id)).rejects.toThrow(NaoEncontradoError);
    await expect(reordenarEtapas(db, bia, ciclo.id, [etapa.id])).rejects.toThrow(NaoEncontradoError);

    const intacto = await obterCiclo(db, ana, ciclo.id);
    expect(intacto.nome).toBe("TRF");
    expect(intacto.etapas.map((m) => m.nome)).toEqual(["Português"]);
  });
});
