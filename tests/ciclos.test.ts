import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  adicionarMateria,
  criarCiclo,
  editarMateria,
  NaoEncontradoError,
  obterCiclo,
  obterHome,
  removerMateria,
  renomearCiclo,
  reordenarMaterias,
  ValidacaoError,
} from "@/casos-de-uso";
import { bancoDeTeste, cadastrar, limparBanco } from "./apoio";

const db = bancoDeTeste();
beforeEach(() => limparBanco(db));
afterAll(() => db.$client.end());

const nomes = async (usuario: { id: string }, cicloId: string) =>
  (await obterCiclo(db, usuario, cicloId)).materias.map((m) => m.nome);

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
    await adicionarMateria(db, ana, a.id, { nome: "Português", cargaMinutos: 120 });

    const { ciclos } = await obterHome(db, ana);
    expect(ciclos.map((c) => c.nome)).toEqual(["TRF", "INSS"]);
    expect(ciclos.map((c) => c.totalMaterias)).toEqual([1, 0]);
  });
});

describe("matérias", () => {
  it("adiciona Matérias na ordem, edita e remove", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await criarCiclo(db, ana, { nome: "TRF" });
    const port = await adicionarMateria(db, ana, id, { nome: "Português", cargaMinutos: 120 });
    await adicionarMateria(db, ana, id, { nome: "Direito", cargaMinutos: 90 });

    expect(await nomes(ana, id)).toEqual(["Português", "Direito"]);

    await editarMateria(db, ana, port.id, { nome: "Língua Portuguesa", cargaMinutos: 150 });
    const [primeira] = (await obterCiclo(db, ana, id)).materias;
    expect(primeira).toMatchObject({ nome: "Língua Portuguesa", cargaMinutos: 150 });

    await removerMateria(db, ana, port.id);
    expect(await nomes(ana, id)).toEqual(["Direito"]);
  });

  it("rejeita nome vazio e carga horária inválida", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await criarCiclo(db, ana, { nome: "TRF" });

    await expect(adicionarMateria(db, ana, id, { nome: " ", cargaMinutos: 60 })).rejects.toThrow(ValidacaoError);
    await expect(adicionarMateria(db, ana, id, { nome: "X", cargaMinutos: 0 })).rejects.toThrow(ValidacaoError);
    await expect(adicionarMateria(db, ana, id, { nome: "X", cargaMinutos: 1.5 })).rejects.toThrow(ValidacaoError);
    await expect(adicionarMateria(db, ana, id, { nome: "X", cargaMinutos: 2 ** 31 })).rejects.toThrow(ValidacaoError);
  });

  it("reordena as Matérias do Ciclo", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await criarCiclo(db, ana, { nome: "TRF" });
    const a = await adicionarMateria(db, ana, id, { nome: "A", cargaMinutos: 60 });
    const b = await adicionarMateria(db, ana, id, { nome: "B", cargaMinutos: 60 });
    const c = await adicionarMateria(db, ana, id, { nome: "C", cargaMinutos: 60 });

    await reordenarMaterias(db, ana, id, [c.id, a.id, b.id]);
    expect(await nomes(ana, id)).toEqual(["C", "A", "B"]);

    await adicionarMateria(db, ana, id, { nome: "D", cargaMinutos: 60 });
    expect(await nomes(ana, id)).toEqual(["C", "A", "B", "D"]);
  });

  it("a reordenação exige exatamente as Matérias do Ciclo", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await criarCiclo(db, ana, { nome: "TRF" });
    const outro = await criarCiclo(db, ana, { nome: "INSS" });
    const a = await adicionarMateria(db, ana, id, { nome: "A", cargaMinutos: 60 });
    await adicionarMateria(db, ana, id, { nome: "B", cargaMinutos: 60 });
    const x = await adicionarMateria(db, ana, outro.id, { nome: "X", cargaMinutos: 60 });

    await expect(reordenarMaterias(db, ana, id, [a.id])).rejects.toThrow(ValidacaoError);
    await expect(reordenarMaterias(db, ana, id, [a.id, x.id])).rejects.toThrow(ValidacaoError);
    await expect(reordenarMaterias(db, ana, id, [a.id, a.id])).rejects.toThrow(ValidacaoError);
  });
});

describe("isolamento entre Usuários", () => {
  it("um Usuário não vê nem altera Ciclos e Matérias de outro", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const bia = await cadastrar(db, "bia@exemplo.com");
    const ciclo = await criarCiclo(db, ana, { nome: "TRF" });
    const materia = await adicionarMateria(db, ana, ciclo.id, { nome: "Português", cargaMinutos: 60 });

    expect((await obterHome(db, bia)).ciclos).toEqual([]);
    await expect(obterCiclo(db, bia, ciclo.id)).rejects.toThrow(NaoEncontradoError);
    await expect(renomearCiclo(db, bia, ciclo.id, { nome: "Meu" })).rejects.toThrow(NaoEncontradoError);
    await expect(adicionarMateria(db, bia, ciclo.id, { nome: "X", cargaMinutos: 60 })).rejects.toThrow(NaoEncontradoError);
    await expect(editarMateria(db, bia, materia.id, { nome: "X", cargaMinutos: 60 })).rejects.toThrow(NaoEncontradoError);
    await expect(removerMateria(db, bia, materia.id)).rejects.toThrow(NaoEncontradoError);
    await expect(reordenarMaterias(db, bia, ciclo.id, [materia.id])).rejects.toThrow(NaoEncontradoError);

    const intacto = await obterCiclo(db, ana, ciclo.id);
    expect(intacto.nome).toBe("TRF");
    expect(intacto.materias.map((m) => m.nome)).toEqual(["Português"]);
  });
});
