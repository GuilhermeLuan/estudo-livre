import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  adicionarMateria,
  criarCiclo,
  descartarCronometro,
  iniciarCronometro,
  NaoEncontradoError,
  obterCronometro,
  obterHome,
  pararCronometro,
  pausarCronometro,
  registrarEstudo,
  retomarCronometro,
  ValidacaoError,
} from "@/casos-de-uso";
import { bancoDeTeste, cadastrar, limparBanco } from "./apoio";

const db = bancoDeTeste();
beforeEach(() => limparBanco(db));
afterAll(() => db.$client.end());

const T0 = new Date("2026-10-01T12:00:00Z");
/** `segundos` depois de T0. */
const depois = (segundos: number) => new Date(T0.getTime() + segundos * 1000);

async function cicloCom(usuario: { id: string }, nomeDoCiclo = "TRF") {
  const { id } = await criarCiclo(db, usuario, { nome: nomeDoCiclo });
  const portugues = await adicionarMateria(db, usuario, id, { nome: "Português", cargaMinutos: 120 });
  const direito = await adicionarMateria(db, usuario, id, { nome: "Direito", cargaMinutos: 90 });
  return { cicloId: id, portugues: portugues.id, direito: direito.id };
}

describe("cronômetro: iniciar e consultar", () => {
  it("sem Cronômetro ativo, a consulta devolve nulo", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    expect(await obterCronometro(db, ana, T0)).toBeNull();
  });

  it("iniciar põe o Cronômetro a correr na Matéria, e o tempo decorrido acompanha o relógio", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { cicloId, portugues } = await cicloCom(ana);

    await iniciarCronometro(db, ana, portugues, T0);

    expect(await obterCronometro(db, ana, depois(90))).toEqual({
      materiaId: portugues,
      materia: "Português",
      cicloId,
      ciclo: "TRF",
      segundos: 90,
      rodando: true,
    });
  });

  it("só existe um Cronômetro ativo por Usuário", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { portugues, direito } = await cicloCom(ana);
    await iniciarCronometro(db, ana, portugues, T0);

    await expect(iniciarCronometro(db, ana, direito, depois(10))).rejects.toThrow(
      new ValidacaoError("Já existe um cronômetro rodando. Pare ou descarte antes de iniciar outro."),
    );
    expect((await obterCronometro(db, ana, depois(10)))?.materia).toBe("Português");
  });

  it("iniciadas ao mesmo tempo, só uma vence", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { portugues, direito } = await cicloCom(ana);

    const resultados = await Promise.allSettled([
      iniciarCronometro(db, ana, portugues, T0),
      iniciarCronometro(db, ana, direito, T0),
    ]);

    expect(resultados.map((r) => r.status).sort()).toEqual(["fulfilled", "rejected"]);
    expect((resultados.find((r) => r.status === "rejected") as PromiseRejectedResult).reason).toBeInstanceOf(ValidacaoError);
  });

  it("cada Usuário tem o seu Cronômetro, e ninguém inicia em Matéria alheia", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const bia = await cadastrar(db, "bia@exemplo.com");
    const { portugues } = await cicloCom(ana);
    const { direito } = await cicloCom(bia, "INSS");

    await expect(iniciarCronometro(db, bia, portugues, T0)).rejects.toThrow(NaoEncontradoError);
    await iniciarCronometro(db, ana, portugues, T0);
    await iniciarCronometro(db, bia, direito, T0);

    expect((await obterCronometro(db, ana, T0))?.materia).toBe("Português");
    expect((await obterCronometro(db, bia, T0))?.materia).toBe("Direito");
  });
});

describe("cronômetro: pausar e retomar", () => {
  it("o tempo pausado não conta", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { portugues } = await cicloCom(ana);
    await iniciarCronometro(db, ana, portugues, T0);

    await pausarCronometro(db, ana, depois(600)); // 10 min estudados
    expect(await obterCronometro(db, ana, depois(5000))).toMatchObject({ segundos: 600, rodando: false });

    await retomarCronometro(db, ana, depois(1800)); // 20 min de pausa
    expect(await obterCronometro(db, ana, depois(1860))).toMatchObject({ segundos: 660, rodando: true });
  });

  it("pausar de novo ou retomar um Cronômetro que já corre não altera o tempo", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { portugues } = await cicloCom(ana);
    await iniciarCronometro(db, ana, portugues, T0);

    await retomarCronometro(db, ana, depois(100));
    expect(await obterCronometro(db, ana, depois(200))).toMatchObject({ segundos: 200, rodando: true });

    await pausarCronometro(db, ana, depois(300));
    await pausarCronometro(db, ana, depois(900));
    expect(await obterCronometro(db, ana, depois(900))).toMatchObject({ segundos: 300, rodando: false });
  });

  it("sem Cronômetro, pausar e retomar dão não encontrado", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    await expect(pausarCronometro(db, ana, T0)).rejects.toThrow(NaoEncontradoError);
    await expect(retomarCronometro(db, ana, T0)).rejects.toThrow(NaoEncontradoError);
  });
});

describe("cronômetro: descartar", () => {
  it("descartar remove o Cronômetro sem criar registro de estudo", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    await cicloCom(ana).then(({ portugues }) => iniciarCronometro(db, ana, portugues, T0));

    await descartarCronometro(db, ana);

    expect(await obterCronometro(db, ana, depois(600))).toBeNull();
    const [ciclo] = (await obterHome(db, ana)).ciclos;
    expect(ciclo.materias.map((m) => m.feitoMinutos)).toEqual([0, 0]);
  });

  it("depois de descartar, um novo Cronômetro pode começar do zero", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { portugues, direito } = await cicloCom(ana);
    await iniciarCronometro(db, ana, portugues, T0);
    await descartarCronometro(db, ana);

    await iniciarCronometro(db, ana, direito, depois(100));

    expect(await obterCronometro(db, ana, depois(130))).toMatchObject({ materia: "Direito", segundos: 30 });
  });

  it("descartar sem Cronômetro dá não encontrado", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    await expect(descartarCronometro(db, ana)).rejects.toThrow(NaoEncontradoError);
  });
});

describe("cronômetro: parar e registrar", () => {
  it("parar pausa o Cronômetro e sugere a duração em minutos arredondados", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { portugues } = await cicloCom(ana);
    await iniciarCronometro(db, ana, portugues, T0);

    const parado = await pararCronometro(db, ana, depois(25 * 60 + 40));

    expect(parado).toEqual({ materiaId: portugues, duracaoMinutos: 26, passouDoLimite: false });
    expect(await obterCronometro(db, ana, depois(9999))).toMatchObject({ segundos: 25 * 60 + 40, rodando: false });
  });

  it("a duração sugerida tem no mínimo 1 minuto e no máximo 24 horas", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { portugues } = await cicloCom(ana);
    await iniciarCronometro(db, ana, portugues, T0);
    expect((await pararCronometro(db, ana, depois(5))).duracaoMinutos).toBe(1);

    await retomarCronometro(db, ana, depois(5));
    const longo = await pararCronometro(db, ana, depois(30 * 3600));
    expect(longo).toMatchObject({ duracaoMinutos: 1440, passouDoLimite: true });
  });

  it("registrar a partir do Cronômetro grava o estudo e consome o Cronômetro na mesma operação", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { portugues } = await cicloCom(ana);
    await iniciarCronometro(db, ana, portugues, T0);
    const { duracaoMinutos } = await pararCronometro(db, ana, depois(30 * 60));

    await registrarEstudo(db, ana, portugues, { tipo: "Teoria", duracaoMinutos }, { cronometro: true });

    expect(await obterCronometro(db, ana, depois(9999))).toBeNull();
    const [ciclo] = (await obterHome(db, ana)).ciclos;
    expect(ciclo.materias[0]).toMatchObject({ nome: "Português", feitoMinutos: 30 });
  });

  it("cancelar o formulário deixa o Cronômetro pausado para retomar ou descartar", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { portugues } = await cicloCom(ana);
    await iniciarCronometro(db, ana, portugues, T0);
    await pararCronometro(db, ana, depois(600));

    await retomarCronometro(db, ana, depois(700));

    expect(await obterCronometro(db, ana, depois(760))).toMatchObject({ segundos: 660, rodando: true });
  });

  it("um registro que falha na validação não consome o Cronômetro", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { portugues } = await cicloCom(ana);
    await iniciarCronometro(db, ana, portugues, T0);

    await expect(registrarEstudo(db, ana, portugues, { tipo: "Teoria", duracaoMinutos: 0 }, { cronometro: true })).rejects.toThrow(ValidacaoError);

    expect(await obterCronometro(db, ana, T0)).not.toBeNull();
  });

  it("registrar sem a opção do Cronômetro não mexe no Cronômetro ativo", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { portugues, direito } = await cicloCom(ana);
    await iniciarCronometro(db, ana, portugues, T0);

    await registrarEstudo(db, ana, direito, { tipo: "Teoria", duracaoMinutos: 20 });

    expect(await obterCronometro(db, ana, depois(60))).toMatchObject({ materia: "Português", rodando: true });
  });

  it("apagar a Matéria remove o Cronômetro dela", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { portugues } = await cicloCom(ana);
    await iniciarCronometro(db, ana, portugues, T0);

    const { removerMateria } = await import("@/casos-de-uso");
    await removerMateria(db, ana, portugues);

    expect(await obterCronometro(db, ana, T0)).toBeNull();
  });
});
