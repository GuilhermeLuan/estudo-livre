import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adicionarEtapa, criarCiclo, NaoEncontradoError, obterEstatisticas, registrarEstudo } from "@/casos-de-uso";
import { registroDeEstudo } from "@/db/schema";
import { bancoDeTeste, cadastrar, limparBanco } from "./apoio";

const db = bancoDeTeste();
beforeEach(() => limparBanco(db));
afterEach(() => vi.useRealTimers());
afterAll(() => db.$client.end());

const estudo = { tipo: "Teoria" } as const;

/** Ciclo com Matérias; as cargas são em minutos. */
async function cicloCom(usuario: { id: string }, nome: string, cargas: Record<string, number>) {
  const { id } = await criarCiclo(db, usuario, { nome });
  const materias: Record<string, string> = {};
  for (const [materia, cargaMinutos] of Object.entries(cargas))
    materias[materia] = (await adicionarEtapa(db, usuario, id, { nome: materia, cargaMinutos })).materiaId;
  return { id, materias };
}

describe("estatísticas", () => {
  it("soma as horas estudadas por Matéria, na ordem do ciclo, incluindo as sem estudo", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { materias } = await cicloCom(ana, "TRF", { Português: 120, Direito: 90 });
    await registrarEstudo(db, ana, materias.Português, { ...estudo, duracaoMinutos: 30 });
    await registrarEstudo(db, ana, materias.Português, { ...estudo, duracaoMinutos: 45 });

    const { horasPorMateria } = await obterEstatisticas(db, ana);

    expect(horasPorMateria.map((m) => [m.nome, m.minutos])).toEqual([
      ["Português", 75],
      ["Direito", 0],
    ]);
  });

  it("uma Matéria com várias Etapas aparece uma vez, com a meta somada", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await criarCiclo(db, ana, { nome: "BB" });
    const ti = await adicionarEtapa(db, ana, id, { nome: "TI", cargaMinutos: 60 });
    await adicionarEtapa(db, ana, id, { nome: "Estatística", cargaMinutos: 120 });
    await adicionarEtapa(db, ana, id, { nome: "TI", cargaMinutos: 50 });
    await registrarEstudo(db, ana, ti.materiaId, { ...estudo, duracaoMinutos: 130 });

    const { horasPorMateria } = await obterEstatisticas(db, ana);

    expect(horasPorMateria.map((m) => [m.nome, m.minutos, m.metaMinutos, m.extraMinutos])).toEqual([
      ["TI", 130, 110, 20],
      ["Estatística", 0, 120, 0],
    ]);
  });

  it("calcula o % de acerto por Matéria só com os registros que têm questões", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { materias } = await cicloCom(ana, "TRF", { Português: 120, Direito: 90, Informática: 60 });
    await registrarEstudo(db, ana, materias.Português, { ...estudo, duracaoMinutos: 30, questoes: 10, acertos: 8 });
    await registrarEstudo(db, ana, materias.Português, { ...estudo, duracaoMinutos: 30, questoes: 30, acertos: 15 });
    await registrarEstudo(db, ana, materias.Português, { ...estudo, duracaoMinutos: 60 }); // sem questões: não entra
    await registrarEstudo(db, ana, materias.Direito, { ...estudo, duracaoMinutos: 30 });

    const { acertoPorMateria, totalQuestoes } = await obterEstatisticas(db, ana);

    // 23 acertos em 40 questões = 57,5%, arredondado para 58%. Matérias sem questões ficam de fora.
    expect(acertoPorMateria.map((m) => [m.nome, m.questoes, m.acertos, m.percentual])).toEqual([["Português", 40, 23, 58]]);
    expect(totalQuestoes).toBe(40);
  });

  describe("horas por semana", () => {
    // Quinta-feira, 1/10/2026, 15h em Brasília: a semana atual começa na segunda 28/9 e a primeira das 8 em 10/8.
    beforeEach(() => vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-10-01T15:00:00-03:00") }));

    it("soma as horas das últimas 8 semanas (segunda a domingo), da mais antiga à atual, com a média", async () => {
      const ana = await cadastrar(db, "ana@exemplo.com");
      const { materias } = await cicloCom(ana, "TRF", { Português: 600, Direito: 600 });
      await registrarEstudo(db, ana, materias.Português, { ...estudo, duracaoMinutos: 30 });
      await registrarEstudo(db, ana, materias.Direito, { ...estudo, duracaoMinutos: 20, dia: "2026-09-24" });
      await registrarEstudo(db, ana, materias.Português, { ...estudo, duracaoMinutos: 40, dia: "2026-09-21" });
      await registrarEstudo(db, ana, materias.Português, { ...estudo, duracaoMinutos: 90, dia: "2026-08-05" }); // 9ª semana: fora

      const { horasPorSemana, mediaSemanalMinutos } = await obterEstatisticas(db, ana);

      expect(horasPorSemana.map((s) => [s.inicio, s.minutos])).toEqual([
        ["2026-08-10", 0],
        ["2026-08-17", 0],
        ["2026-08-24", 0],
        ["2026-08-31", 0],
        ["2026-09-07", 0],
        ["2026-09-14", 0],
        ["2026-09-21", 60],
        ["2026-09-28", 30],
      ]);
      expect(mediaSemanalMinutos).toBe(11); // 90 min em 8 semanas = 11,25
    });

    it("usa o fuso de Brasília nas viradas: domingo à noite é da semana que acaba, segunda de madrugada da que começa", async () => {
      const ana = await cadastrar(db, "ana@exemplo.com");
      const { materias } = await cicloCom(ana, "TRF", { Português: 600 });
      const guardar = (dataHora: string, duracaoMinutos: number) =>
        db.insert(registroDeEstudo).values({ materiaId: materias.Português, dataHora: new Date(dataHora), duracaoMinutos, tipo: "Teoria" });
      await guardar("2026-09-27T23:30:00-03:00", 10); // domingo 23h30 (já segunda em UTC)
      await guardar("2026-09-28T00:30:00-03:00", 20); // segunda 0h30
      await guardar("2026-08-09T23:30:00-03:00", 40); // domingo antes da 1ª semana: fora
      await guardar("2026-08-10T00:30:00-03:00", 80); // segunda da 1ª semana: dentro

      const { horasPorSemana } = await obterEstatisticas(db, ana);

      expect(horasPorSemana.map((s) => [s.inicio, s.minutos])).toEqual([
        ["2026-08-10", 80],
        ["2026-08-17", 0],
        ["2026-08-24", 0],
        ["2026-08-31", 0],
        ["2026-09-07", 0],
        ["2026-09-14", 0],
        ["2026-09-21", 10],
        ["2026-09-28", 20],
      ]);
    });
  });

  it("conta como 0 acerto o registro com questões e sem acertos informados", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { materias } = await cicloCom(ana, "TRF", { Português: 120 });
    await registrarEstudo(db, ana, materias.Português, { ...estudo, duracaoMinutos: 30, questoes: 10 });
    await registrarEstudo(db, ana, materias.Português, { ...estudo, duracaoMinutos: 30, questoes: 10, acertos: 10 });

    const { acertoPorMateria } = await obterEstatisticas(db, ana);

    expect(acertoPorMateria.map((m) => [m.questoes, m.acertos, m.percentual])).toEqual([[20, 10, 50]]);
  });

  it("filtra tudo por Ciclo e lista os Ciclos do Usuário para o filtro", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const trf = await cicloCom(ana, "TRF", { Português: 120 });
    const stj = await cicloCom(ana, "STJ", { Direito: 120 });
    await registrarEstudo(db, ana, trf.materias.Português, { ...estudo, duracaoMinutos: 30, questoes: 10, acertos: 5 });
    await registrarEstudo(db, ana, stj.materias.Direito, { ...estudo, duracaoMinutos: 45, questoes: 20, acertos: 20 });

    const geral = await obterEstatisticas(db, ana);
    const doStj = await obterEstatisticas(db, ana, { cicloId: stj.id });

    expect(geral.ciclos.map((c) => c.nome)).toEqual(["TRF", "STJ"]);
    expect(geral.horasPorMateria.map((m) => [m.nome, m.minutos])).toEqual([["Português", 30], ["Direito", 45]]);
    expect(doStj.horasPorMateria.map((m) => [m.nome, m.minutos])).toEqual([["Direito", 45]]);
    expect(doStj.acertoPorMateria.map((m) => [m.nome, m.percentual])).toEqual([["Direito", 100]]);
    expect(doStj.totalQuestoes).toBe(20);
    expect(doStj.horasPorSemana.at(-1)?.minutos).toBe(45);
    expect(doStj.ciclos.map((c) => c.nome)).toEqual(["TRF", "STJ"]);
  });

  it("não mostra dados de outro Usuário nem aceita filtrar por Ciclo alheio", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const bia = await cadastrar(db, "bia@exemplo.com");
    const deAna = await cicloCom(ana, "TRF", { Português: 120 });
    await registrarEstudo(db, ana, deAna.materias.Português, { ...estudo, duracaoMinutos: 30, questoes: 10, acertos: 5 });

    const deBia = await obterEstatisticas(db, bia);

    expect(deBia.ciclos).toEqual([]);
    expect(deBia.horasPorMateria).toEqual([]);
    expect(deBia.acertoPorMateria).toEqual([]);
    expect(deBia.horasPorSemana.every((s) => s.minutos === 0)).toBe(true);
    await expect(obterEstatisticas(db, bia, { cicloId: deAna.id })).rejects.toThrow(NaoEncontradoError);
  });
});
