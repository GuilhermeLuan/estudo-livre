import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  adicionarEtapa,
  criarCiclo,
  criarTopico,
  listarFaixasDosCiclos,
  NaoEncontradoError,
  obterFaixas,
  registrarEstudo,
  salvarFaixas,
  ValidacaoError,
} from "@/casos-de-uso";
import { registroDeEstudo } from "@/db/schema";
import { bancoDeTeste, cadastrar, limparBanco } from "./apoio";

const db = bancoDeTeste();
beforeEach(() => limparBanco(db));
afterAll(() => db.$client.end());

const PADRAO = { erreiAte: 60, dificilAte: 75, bomAte: 90, minimo: 5 };

describe("faixas", () => {
  it("todo Ciclo tem as Faixas 60, 75 e 90 e o Mínimo 5", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await criarCiclo(db, ana, { nome: "TRF" });
    expect(await obterFaixas(db, ana, id)).toEqual(PADRAO);
    expect([...(await listarFaixasDosCiclos(db, ana))]).toEqual([[id, PADRAO]]);
  });

  it("salvar valores válidos grava", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await criarCiclo(db, ana, { nome: "TRF" });
    const novas = { erreiAte: 1, dificilAte: 50, bomAte: 100, minimo: 1000 };
    await salvarFaixas(db, ana, id, novas);
    expect(await obterFaixas(db, ana, id)).toEqual(novas);
    expect((await listarFaixasDosCiclos(db, ana)).get(id)).toEqual(novas);
  });

  it("valores inválidos são recusados e os gravados ficam", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await criarCiclo(db, ana, { nome: "TRF" });
    const invalidos = [
      { ...PADRAO, erreiAte: 0 },
      { ...PADRAO, bomAte: 101 },
      { ...PADRAO, dificilAte: 70.5 },
      { ...PADRAO, dificilAte: 60 }, // não cresce
      { ...PADRAO, bomAte: 75 }, // não cresce
      { ...PADRAO, minimo: 0 },
      { ...PADRAO, minimo: 1001 },
    ];
    for (const dados of invalidos) await expect(salvarFaixas(db, ana, id, dados)).rejects.toThrow(ValidacaoError);
    expect(await obterFaixas(db, ana, id)).toEqual(PADRAO);
  });

  it("mudar as Faixas só vale para os Registros seguintes", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id: cicloId } = await criarCiclo(db, ana, { nome: "TRF" });
    const { materiaId } = await adicionarEtapa(db, ana, cicloId, { nome: "Português", cargaMinutos: 60 });
    const { id: topicoId } = await criarTopico(db, ana, materiaId, { nome: "Crase" });
    const dados = { tipo: "Teoria", duracaoMinutos: 30, topicoId, questoes: 20, acertos: 16 } as const; // 80%

    await registrarEstudo(db, ana, materiaId, dados);
    await salvarFaixas(db, ana, cicloId, { erreiAte: 10, dificilAte: 20, bomAte: 30, minimo: 5 });
    await registrarEstudo(db, ana, materiaId, dados);
    const notas = (await db.select({ nota: registroDeEstudo.nota }).from(registroDeEstudo).orderBy(registroDeEstudo.criadoEm)).map((r) => r.nota);
    expect(notas).toEqual(["Bom", "Fácil"]);
  });

  it("o Ciclo de outro Usuário não aparece nem muda", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const bia = await cadastrar(db, "bia@exemplo.com");
    const { id } = await criarCiclo(db, ana, { nome: "TRF" });
    await expect(obterFaixas(db, bia, id)).rejects.toThrow(NaoEncontradoError);
    await expect(salvarFaixas(db, bia, id, { ...PADRAO, minimo: 9 })).rejects.toThrow(NaoEncontradoError);
    expect((await listarFaixasDosCiclos(db, bia)).size).toBe(0);
    expect(await obterFaixas(db, ana, id)).toEqual(PADRAO);
  });
});
