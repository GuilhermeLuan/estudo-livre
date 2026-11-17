import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adicionarEtapa, criarCiclo, obterHome, registrarEstudo } from "@/casos-de-uso";
import { registroDeEstudo } from "@/db/schema";
import { eq } from "drizzle-orm";
import { bancoDeTeste, cadastrar, limparBanco } from "./apoio";

const db = bancoDeTeste();
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-17T15:00:00-03:00") }); // terça-feira
  return limparBanco(db);
});
afterEach(() => vi.useRealTimers());
afterAll(() => db.$client.end());

const estudo = { tipo: "Teoria" } as const;

async function cicloCom(usuario: { id: string }, nome = "TRF") {
  const { id } = await criarCiclo(db, usuario, { nome });
  const { materiaId } = await adicionarEtapa(db, usuario, id, { nome: "Português", cargaMinutos: 6000 });
  return materiaId;
}
const indicadores = async (usuario: { id: string }) => (await obterHome(db, usuario)).indicadores;

describe("indicadores da Hoje", () => {
  it("Estudado hoje soma o dia em Brasília e dá a diferença contra ontem", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const materia = await cicloCom(ana);
    await registrarEstudo(db, ana, materia, { ...estudo, duracaoMinutos: 70 });
    await registrarEstudo(db, ana, materia, { ...estudo, duracaoMinutos: 45, dia: "2026-11-16" });

    expect(await indicadores(ana)).toMatchObject({ hojeMinutos: 70, diferencaHojeMinutos: 25 });
  });

  it("um registro das 23h50 de ontem em Brasília não conta hoje", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const materia = await cicloCom(ana);
    await registrarEstudo(db, ana, materia, { ...estudo, duracaoMinutos: 45, dia: "2026-11-16" });
    await db.update(registroDeEstudo).set({ dataHora: new Date("2026-11-16T23:50:00-03:00") }).where(eq(registroDeEstudo.materiaId, materia));

    expect(await indicadores(ana)).toMatchObject({ hojeMinutos: 0, diferencaHojeMinutos: null });
  });

  it("soma todos os Ciclos e ignora outro Usuário; sem estudo, tudo zera e sem diferença", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const bia = await cadastrar(db, "bia@exemplo.com");
    expect(await indicadores(ana)).toEqual({
      hojeMinutos: 0,
      diferencaHojeMinutos: null,
      questoesHoje: 0,
      acertoHoje: null,
      semanaMinutos: 0,
      variacaoSemana: null,
    });
    await registrarEstudo(db, ana, await cicloCom(ana, "A"), { ...estudo, duracaoMinutos: 30 });
    await registrarEstudo(db, ana, await cicloCom(ana, "B"), { ...estudo, duracaoMinutos: 40 });
    await registrarEstudo(db, bia, await cicloCom(bia), { ...estudo, duracaoMinutos: 99 });

    expect((await indicadores(ana)).hojeMinutos).toBe(70);
  });

  it("Questões hoje soma as questões e arredonda o acerto", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const materia = await cicloCom(ana);
    await registrarEstudo(db, ana, materia, { ...estudo, duracaoMinutos: 30, questoes: 20, acertos: 16 });
    expect(await indicadores(ana)).toMatchObject({ questoesHoje: 20, acertoHoje: 80 });

    await limparBanco(db);
    const bia = await cadastrar(db, "bia@exemplo.com");
    await registrarEstudo(db, bia, await cicloCom(bia), { ...estudo, duracaoMinutos: 30, questoes: 3, acertos: 2 });
    expect(await indicadores(bia)).toMatchObject({ questoesHoje: 3, acertoHoje: 67 });
  });

  it("Nesta semana compara com a semana anterior inteira, de segunda a domingo", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const materia = await cicloCom(ana);
    await registrarEstudo(db, ana, materia, { ...estudo, duracaoMinutos: 700 });
    await registrarEstudo(db, ana, materia, { ...estudo, duracaoMinutos: 625, dia: "2026-11-15" }); // domingo anterior
    await registrarEstudo(db, ana, materia, { ...estudo, duracaoMinutos: 90, dia: "2026-11-08" }); // duas semanas atrás: fora

    expect(await indicadores(ana)).toMatchObject({ semanaMinutos: 700, variacaoSemana: 12 });
  });

  it("Nesta semana cai 50% e não mostra variação sem semana anterior", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const materia = await cicloCom(ana);
    await registrarEstudo(db, ana, materia, { ...estudo, duracaoMinutos: 300 });
    expect((await indicadores(ana)).variacaoSemana).toBeNull();
    await registrarEstudo(db, ana, materia, { ...estudo, duracaoMinutos: 600, dia: "2026-11-12" });
    expect((await indicadores(ana)).variacaoSemana).toBe(-50);
  });
});
