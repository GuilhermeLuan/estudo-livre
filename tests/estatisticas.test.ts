import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { adicionarMateria, criarCiclo, NaoEncontradoError, obterEstatisticas, registrarEstudo } from "@/casos-de-uso";
import { hojeEmBrasilia } from "@/dia";
import { bancoDeTeste, cadastrar, limparBanco } from "./apoio";

const db = bancoDeTeste();
beforeEach(() => limparBanco(db));
afterAll(() => db.$client.end());

const estudo = { tipo: "Teoria" } as const;

/** O dia de Brasília `dias` dias a partir de hoje (negativo = passado). */
const diaDaquiA = (dias: number) => hojeEmBrasilia(new Date(Date.now() + dias * 24 * 3600_000));

/** A segunda-feira (AAAA-MM-DD) da semana do dia informado. */
function segundaDe(dia: string) {
  const data = new Date(`${dia}T00:00:00Z`);
  data.setUTCDate(data.getUTCDate() - ((data.getUTCDay() + 6) % 7));
  return data.toISOString().slice(0, 10);
}

/** Ciclo com Matérias; as cargas são em minutos. */
async function cicloCom(usuario: { id: string }, nome: string, cargas: Record<string, number>) {
  const { id } = await criarCiclo(db, usuario, { nome });
  const materias: Record<string, string> = {};
  for (const [materia, cargaMinutos] of Object.entries(cargas))
    materias[materia] = (await adicionarMateria(db, usuario, id, { nome: materia, cargaMinutos })).id;
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

  it("soma as horas das últimas 8 semanas (segunda a domingo), da mais antiga à atual, com a média", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { materias } = await cicloCom(ana, "TRF", { Português: 600, Direito: 600 });
    await registrarEstudo(db, ana, materias.Português, { ...estudo, duracaoMinutos: 30 });
    await registrarEstudo(db, ana, materias.Direito, { ...estudo, duracaoMinutos: 20, dia: diaDaquiA(-7) });
    await registrarEstudo(db, ana, materias.Português, { ...estudo, duracaoMinutos: 40, dia: diaDaquiA(-7) });
    await registrarEstudo(db, ana, materias.Português, { ...estudo, duracaoMinutos: 90, dia: diaDaquiA(-8 * 7) }); // 9ª semana: fora

    const { horasPorSemana, mediaSemanalMinutos } = await obterEstatisticas(db, ana);

    const segundaAtual = segundaDe(diaDaquiA(0));
    expect(horasPorSemana).toHaveLength(8);
    expect(horasPorSemana[7]).toEqual({ inicio: segundaAtual, minutos: 30 });
    expect(horasPorSemana[6]).toEqual({ inicio: segundaDe(diaDaquiA(-7)), minutos: 60 });
    expect(horasPorSemana.slice(0, 6).map((s) => s.minutos)).toEqual([0, 0, 0, 0, 0, 0]);
    expect(horasPorSemana.map((s) => s.inicio)).toEqual([...horasPorSemana.map((s) => s.inicio)].sort());
    expect(mediaSemanalMinutos).toBe(11); // 90 min em 8 semanas = 11,25
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
    expect(doStj.horasPorSemana[7].minutos).toBe(45);
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
