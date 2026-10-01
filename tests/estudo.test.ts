import { sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  adicionarMateria,
  criarCiclo,
  instanteDoDia,
  NaoEncontradoError,
  obterHome,
  registrarEstudo,
  ValidacaoError,
} from "@/casos-de-uso";
import { hojeEmBrasilia } from "@/dia";
import { bancoDeTeste, cadastrar, limparBanco } from "./apoio";

const db = bancoDeTeste();
beforeEach(() => limparBanco(db));
afterAll(() => db.$client.end());

const estudo = { tipo: "Teoria" } as const;

/** O dia de Brasília `dias` dias a partir de hoje (negativo = passado). */
const diaDaquiA = (dias: number) => hojeEmBrasilia(new Date(Date.now() + dias * 24 * 3600_000));

/** Ciclo com Matérias; as cargas são em minutos. */
async function cicloCom(usuario: { id: string }, cargas: Record<string, number>) {
  const { id } = await criarCiclo(db, usuario, { nome: "TRF" });
  const materias: Record<string, string> = {};
  for (const [nome, cargaMinutos] of Object.entries(cargas))
    materias[nome] = (await adicionarMateria(db, usuario, id, { nome, cargaMinutos })).id;
  return { id, materias };
}

async function cicloDaHome(usuario: { id: string }) {
  const [ciclo] = (await obterHome(db, usuario)).ciclos;
  return ciclo;
}

describe("registro de estudo e progresso da volta", () => {
  it("soma as durações ao Progresso da matéria na Volta atual", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { materias } = await cicloCom(ana, { Português: 120, Direito: 90 });

    await registrarEstudo(db, ana, materias.Português, { ...estudo, duracaoMinutos: 30 });
    await registrarEstudo(db, ana, materias.Português, { ...estudo, duracaoMinutos: 45 });

    const ciclo = await cicloDaHome(ana);
    expect(ciclo.volta).toBe(1);
    expect(ciclo.materias.map((m) => [m.nome, m.feitoMinutos])).toEqual([
      ["Português", 75],
      ["Direito", 0],
    ]);
  });

  it("trava o Progresso da matéria em 100% da carga horária", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { materias } = await cicloCom(ana, { Português: 90, Direito: 90 });

    await registrarEstudo(db, ana, materias.Português, { ...estudo, duracaoMinutos: 120 });

    const ciclo = await cicloDaHome(ana);
    expect(ciclo.materias[0]).toMatchObject({ nome: "Português", feitoMinutos: 90 });
  });

  it("a Próxima matéria é a primeira, na ordem, abaixo de 100%, e qualquer Matéria pode ser registrada", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { materias } = await cicloCom(ana, { Português: 60, Direito: 60, Informática: 60 });
    expect((await cicloDaHome(ana)).proxima?.nome).toBe("Português");

    // Estudar fora da ordem não muda a sugestão enquanto a primeira não fecha.
    await registrarEstudo(db, ana, materias.Informática, { ...estudo, duracaoMinutos: 60 });
    expect((await cicloDaHome(ana)).proxima?.nome).toBe("Português");

    await registrarEstudo(db, ana, materias.Português, { ...estudo, duracaoMinutos: 60 });
    expect((await cicloDaHome(ana)).proxima?.nome).toBe("Direito");
  });

  it("a tela inicial resume o Ciclo: percentual da Volta, matérias concluídas e tempo que falta", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { materias } = await cicloCom(ana, { Português: 60, Direito: 120, Informática: 60 });

    await registrarEstudo(db, ana, materias.Português, { ...estudo, duracaoMinutos: 90 }); // trava em 60
    await registrarEstudo(db, ana, materias.Direito, { ...estudo, duracaoMinutos: 30 });

    expect(await cicloDaHome(ana)).toMatchObject({ percentual: 38, concluidas: 1, faltaMinutos: 150 });
  });

  it("um Ciclo sem Matérias não tem Próxima matéria", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    await criarCiclo(db, ana, { nome: "Vazio" });
    expect(await cicloDaHome(ana)).toMatchObject({ proxima: null, percentual: 0, concluidas: 0, faltaMinutos: 0 });
  });

  it("quando todas as Matérias chegam a 100%, a Volta fecha e uma nova começa zerada", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { materias } = await cicloCom(ana, { Português: 60, Direito: 60 });

    const parcial = await registrarEstudo(db, ana, materias.Direito, { ...estudo, duracaoMinutos: 60 });
    expect(parcial.voltaFechada).toBeNull();
    expect((await cicloDaHome(ana)).volta).toBe(1);

    // O excedente (30 min além da carga) não passa para a Volta seguinte.
    const final = await registrarEstudo(db, ana, materias.Português, { ...estudo, duracaoMinutos: 90 });
    expect(final.voltaFechada).toBe(1);

    const ciclo = await cicloDaHome(ana);
    expect(ciclo.volta).toBe(2);
    expect(ciclo.materias.map((m) => m.feitoMinutos)).toEqual([0, 0]);
    expect(ciclo.proxima?.nome).toBe("Português");
  });

  it("a Volta seguinte também fecha quando todas chegam a 100% de novo", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { materias } = await cicloCom(ana, { Português: 60 });

    await registrarEstudo(db, ana, materias.Português, { ...estudo, duracaoMinutos: 60 });
    await registrarEstudo(db, ana, materias.Português, { ...estudo, duracaoMinutos: 30 });
    expect((await cicloDaHome(ana)).materias[0].feitoMinutos).toBe(30);
    await registrarEstudo(db, ana, materias.Português, { ...estudo, duracaoMinutos: 30 });

    expect((await cicloDaHome(ana)).volta).toBe(3);
  });

  it("um estudo retroativo que cai numa Volta já fechada não conta para a Volta atual", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { materias } = await cicloCom(ana, { Português: 60, Direito: 60 });

    await registrarEstudo(db, ana, materias.Português, { ...estudo, duracaoMinutos: 60 });
    await registrarEstudo(db, ana, materias.Direito, { ...estudo, duracaoMinutos: 60 });
    expect((await cicloDaHome(ana)).volta).toBe(2);

    await registrarEstudo(db, ana, materias.Português, { ...estudo, duracaoMinutos: 30, dia: diaDaquiA(-1) });
    expect((await cicloDaHome(ana)).materias.map((m) => m.feitoMinutos)).toEqual([0, 0]);
  });

  it("um estudo com data de hoje depois do fechamento conta para a nova Volta", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { materias } = await cicloCom(ana, { Português: 60 });

    await registrarEstudo(db, ana, materias.Português, { ...estudo, duracaoMinutos: 60 });
    await registrarEstudo(db, ana, materias.Português, { ...estudo, duracaoMinutos: 20 });

    expect((await cicloDaHome(ana)).materias[0].feitoMinutos).toBe(20);
  });
});

describe("concorrência", () => {
  it("registros simultâneos que fecham a Volta não duplicam a Volta aberta", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { materias } = await cicloCom(ana, { Português: 60 });

    await Promise.all([
      registrarEstudo(db, ana, materias.Português, { ...estudo, duracaoMinutos: 60 }),
      registrarEstudo(db, ana, materias.Português, { ...estudo, duracaoMinutos: 60 }),
    ]);

    const { ciclos } = await obterHome(db, ana);
    expect(ciclos).toHaveLength(1);
    expect(ciclos[0].volta).toBeGreaterThanOrEqual(2);
  });
});

describe("registro que espera outro fechar a Volta", () => {
  it("conta na Volta nova um estudo de hoje que ficou esperando o fechamento", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { materias } = await cicloCom(ana, { Português: 60 });

    // Segura o Ciclo para que os dois registros fiquem na fila, na ordem em que chegaram.
    let soltar!: () => void;
    const solto = new Promise<void>((r) => (soltar = r));
    const preso = db.transaction(async (tx) => {
      await tx.execute(sql`select 1 from ciclo for update`);
      await solto;
    });
    await new Promise((r) => setTimeout(r, 100));
    const fecha = registrarEstudo(db, ana, materias.Português, { ...estudo, duracaoMinutos: 60, dia: hojeEmBrasilia() });
    await new Promise((r) => setTimeout(r, 100));
    const espera = registrarEstudo(db, ana, materias.Português, { ...estudo, duracaoMinutos: 20, dia: hojeEmBrasilia() });
    await new Promise((r) => setTimeout(r, 100));
    soltar();
    await Promise.all([preso, fecha, espera]);

    const ciclo = await cicloDaHome(ana);
    expect(ciclo.volta).toBe(2);
    expect(ciclo.materias[0].feitoMinutos).toBe(20);
  });
});

describe("validação do registro de estudo", () => {
  async function materiaDe(usuario: { id: string }) {
    const { materias } = await cicloCom(usuario, { Português: 600 });
    return materias.Português;
  }

  it("aceita todos os campos, e questões, acertos, anotação e conteúdo são opcionais", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const materia = await materiaDe(ana);

    await registrarEstudo(db, ana, materia, { ...estudo, duracaoMinutos: 30 });
    await registrarEstudo(db, ana, materia, {
      tipo: "Exercícios",
      duracaoMinutos: 45,
      dia: hojeEmBrasilia(),
      questoes: 20,
      acertos: 15,
      anotacao: "Revisar crase",
      conteudoLivre: "  Crase antes de horas ",
    });
    await registrarEstudo(db, ana, materia, { tipo: "Leitura de lei", duracaoMinutos: 10, questoes: 0, anotacao: "  ", conteudoLivre: "" });

    expect((await cicloDaHome(ana)).materias[0].feitoMinutos).toBe(85);
  });

  it("rejeita duração fora de 1 minuto a 24 horas ou fracionada", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const materia = await materiaDe(ana);
    for (const duracaoMinutos of [0, -5, 1.5, 1441])
      await expect(registrarEstudo(db, ana, materia, { ...estudo, duracaoMinutos })).rejects.toThrow(ValidacaoError);
  });

  it("rejeita tipo de estudo desconhecido", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const materia = await materiaDe(ana);
    await expect(
      registrarEstudo(db, ana, materia, { tipo: "Simulado" as never, duracaoMinutos: 30 }),
    ).rejects.toThrow(ValidacaoError);
  });

  it("não aceita acertos maiores que questões nem acertos sem questões", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const materia = await materiaDe(ana);
    const base = { ...estudo, duracaoMinutos: 30 };
    await expect(registrarEstudo(db, ana, materia, { ...base, questoes: 10, acertos: 11 })).rejects.toThrow(ValidacaoError);
    await expect(registrarEstudo(db, ana, materia, { ...base, acertos: 3 })).rejects.toThrow(ValidacaoError);
    await expect(registrarEstudo(db, ana, materia, { ...base, questoes: -1 })).rejects.toThrow(ValidacaoError);
    await expect(registrarEstudo(db, ana, materia, { ...base, questoes: 1001 })).rejects.toThrow(ValidacaoError);
    await expect(registrarEstudo(db, ana, materia, { ...base, questoes: 10, acertos: -1 })).rejects.toThrow(ValidacaoError);
  });

  it("rejeita data futura e textos longos demais", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const materia = await materiaDe(ana);
    const base = { ...estudo, duracaoMinutos: 30 };
    await expect(registrarEstudo(db, ana, materia, { ...base, dia: diaDaquiA(1) })).rejects.toThrow(ValidacaoError);
    await expect(registrarEstudo(db, ana, materia, { ...base, anotacao: "a".repeat(2001) })).rejects.toThrow(ValidacaoError);
    await expect(registrarEstudo(db, ana, materia, { ...base, conteudoLivre: "a".repeat(201) })).rejects.toThrow(ValidacaoError);
  });

  it("um Usuário não registra estudo em Matéria de outro", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const bia = await cadastrar(db, "bia@exemplo.com");
    const materia = await materiaDe(ana);

    await expect(registrarEstudo(db, bia, materia, { ...estudo, duracaoMinutos: 30 })).rejects.toThrow(NaoEncontradoError);
    expect((await cicloDaHome(ana)).materias[0].feitoMinutos).toBe(0);
  });
});

describe("instanteDoDia", () => {
  const agora = new Date("2026-10-01T15:00:00-03:00");

  it("hoje vale o instante atual", () => {
    expect(instanteDoDia("2026-10-01", agora)).toEqual(agora);
  });

  it("um dia passado vale meio-dia em Brasília", () => {
    expect(instanteDoDia("2026-09-28", agora)).toEqual(new Date("2026-09-28T12:00:00-03:00"));
  });

  it("perto da meia-noite, hoje continua sendo a data de Brasília", () => {
    const tarde = new Date("2026-10-02T01:30:00Z"); // 22h30 do dia 1º em Brasília
    expect(instanteDoDia("2026-10-01", tarde)).toEqual(tarde);
  });

  it("rejeita data futura ou inválida", () => {
    expect(() => instanteDoDia("2026-10-02", agora)).toThrow(ValidacaoError);
    expect(() => instanteDoDia("01/10/2026", agora)).toThrow(ValidacaoError);
    expect(() => instanteDoDia("2026-02-31", agora)).toThrow(ValidacaoError);
  });
});
