import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { adicionarEtapa, criarCiclo, editarEtapa, listarRegistros, listarVoltas, NaoEncontradoError, obterCiclo, registrarEstudo, reiniciarVolta, removerEtapa, reordenarEtapas, ValidacaoError } from "@/casos-de-uso";
import { ciclo } from "@/db/schema";
import { bancoDeTeste, cadastrar, limparBanco } from "./apoio";

const db = bancoDeTeste();
beforeEach(() => limparBanco(db));
afterAll(() => db.$client.end());

const estudo = { tipo: "Teoria" } as const;

/** Um Ciclo com uma Etapa por nome, na ordem, cada uma com a carga dada em minutos. */
async function cicloCom(usuario: { id: string }, etapas: [string, number][]) {
  const { id } = await criarCiclo(db, usuario, { nome: "TRF" });
  const materias: Record<string, string> = {};
  for (const [nome, cargaMinutos] of etapas) materias[nome] = (await adicionarEtapa(db, usuario, id, { nome, cargaMinutos })).materiaId;
  return { id, materias };
}

describe("Voltas", () => {
  it("lista a Volta aberta primeiro e as fechadas da mais recente à mais antiga", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id, materias } = await cicloCom(ana, [["Português", 60]]);
    await registrarEstudo(db, ana, materias["Português"], { ...estudo, duracaoMinutos: 60 }); // fecha a Volta 1
    await registrarEstudo(db, ana, materias["Português"], { ...estudo, duracaoMinutos: 60 }); // fecha a Volta 2

    const voltas = await listarVoltas(db, ana, id);

    expect(voltas.map((v) => v.numero)).toEqual([3, 2, 1]);
    expect(voltas.map((v) => v.fim === null)).toEqual([true, false, false]);
    expect(voltas[2].fim).toEqual(voltas[1].inicio);
    expect(voltas[1].fim).toEqual(voltas[0].inicio);
  });

  it("a Volta 1 começa na criação do Ciclo", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await cicloCom(ana, [["Português", 60]]);
    const [{ criadoEm }] = await db.select({ criadoEm: ciclo.criadoEm }).from(ciclo).where(eq(ciclo.id, id));

    const [volta1] = await listarVoltas(db, ana, id);

    expect(volta1.numero).toBe(1);
    expect(volta1.inicio).toEqual(criadoEm);
  });

  it("um Ciclo sem Volta fechada lista só a Volta 1 aberta", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await cicloCom(ana, [["Português", 60]]);

    const voltas = await listarVoltas(db, ana, id);

    expect(voltas).toHaveLength(1);
    expect([voltas[0].numero, voltas[0].fim]).toEqual([1, null]);
  });

  it("listar as Voltas de outro Usuário responde não encontrado", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const bia = await cadastrar(db, "bia@exemplo.com");
    const { id } = await cicloCom(ana, [["Português", 60]]);

    await expect(listarVoltas(db, bia, id)).rejects.toBeInstanceOf(NaoEncontradoError);
    await expect(listarVoltas(db, ana, "inexistente")).rejects.toBeInstanceOf(NaoEncontradoError);
  });

  it("reiniciar fecha a Volta aberta e abre a seguinte no mesmo instante", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await cicloCom(ana, [["Português", 60]]);

    await reiniciarVolta(db, ana, id, 1);

    const [aberta, fechada] = await listarVoltas(db, ana, id);
    expect([aberta.numero, aberta.fim]).toEqual([2, null]);
    expect(fechada.numero).toBe(1);
    expect(fechada.fim).not.toBeNull();
    expect(aberta.inicio).toEqual(fechada.fim);
    expect((await obterCiclo(db, ana, id)).volta.numero).toBe(2);
  });

  it("reiniciar sem Registro de estudo é permitido", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await criarCiclo(db, ana, { nome: "Sem etapas" });

    await reiniciarVolta(db, ana, id, 1);
    await reiniciarVolta(db, ana, id, 2);

    expect((await listarVoltas(db, ana, id)).map((v) => v.numero)).toEqual([3, 2, 1]);
  });

  it("reiniciar mantém os Registros na Volta fechada e zera o progresso", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id, materias } = await cicloCom(ana, [["Português", 60], ["Direito", 60]]);
    await registrarEstudo(db, ana, materias["Português"], { ...estudo, duracaoMinutos: 40 });
    expect((await obterCiclo(db, ana, id)).feitoMinutos).toBe(40);

    await reiniciarVolta(db, ana, id, 1);

    const nova = await obterCiclo(db, ana, id);
    expect([nova.volta.numero, nova.feitoMinutos, nova.percentual]).toEqual([2, 0, 0]);
    await registrarEstudo(db, ana, materias["Direito"], { ...estudo, duracaoMinutos: 30 });
    expect((await obterCiclo(db, ana, id)).feitoMinutos).toBe(30);
    const { registros } = await listarRegistros(db, ana, { cicloId: id });
    expect(registros.map((r) => [r.duracaoMinutos, r.volta])).toEqual([[30, 2], [40, 1]]);
  });

  it("reiniciar com o número de uma Volta que já não é a aberta é recusado", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await cicloCom(ana, [["Português", 60]]);
    await reiniciarVolta(db, ana, id, 1);

    await expect(reiniciarVolta(db, ana, id, 1)).rejects.toThrow("Esta volta já foi reiniciada. Atualize a página.");
    await expect(reiniciarVolta(db, ana, id, 1)).rejects.toBeInstanceOf(ValidacaoError);
    expect((await listarVoltas(db, ana, id)).map((v) => [v.numero, v.fim === null])).toEqual([[2, true], [1, false]]);
  });

  it("reiniciar o Ciclo de outro Usuário responde não encontrado", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const bia = await cadastrar(db, "bia@exemplo.com");
    const { id } = await cicloCom(ana, [["Português", 60]]);

    await expect(reiniciarVolta(db, bia, id, 1)).rejects.toBeInstanceOf(NaoEncontradoError);
    expect((await listarVoltas(db, ana, id)).map((v) => v.numero)).toEqual([1]);
  });
});

describe("Voltas e carga horária", () => {
  const etapaDe = async (usuario: { id: string }, cicloId: string, nome: string) => (await obterCiclo(db, usuario, cicloId)).etapas.find((e) => e.nome === nome)!;

  it("mudar a carga recalcula o progresso da Volta aberta", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id, materias } = await cicloCom(ana, [["Português", 60], ["Direito", 120]]);
    await registrarEstudo(db, ana, materias["Direito"], { ...estudo, duracaoMinutos: 60 });
    expect((await obterCiclo(db, ana, id)).percentual).toBe(33); // 60 de 180

    await editarEtapa(db, ana, (await etapaDe(ana, id, "Direito")).id, { nome: "Direito", cargaMinutos: 90 });

    const depois = await obterCiclo(db, ana, id);
    expect([depois.cargaMinutos, depois.feitoMinutos, depois.percentual]).toEqual([150, 60, 40]);
  });

  it("editar a carga até completar todas as Etapas fecha a Volta", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id, materias } = await cicloCom(ana, [["Português", 60], ["Direito", 120]]);
    await registrarEstudo(db, ana, materias["Português"], { ...estudo, duracaoMinutos: 60 });
    await registrarEstudo(db, ana, materias["Direito"], { ...estudo, duracaoMinutos: 60 });
    expect((await obterCiclo(db, ana, id)).volta.numero).toBe(1);

    await editarEtapa(db, ana, (await etapaDe(ana, id, "Direito")).id, { nome: "Direito", cargaMinutos: 60 });

    const [aberta, fechada] = await listarVoltas(db, ana, id);
    expect([aberta.numero, aberta.fim, fechada.numero]).toEqual([2, null, 1]);
    expect(fechada.fim).toEqual(aberta.inicio);
    expect((await obterCiclo(db, ana, id)).feitoMinutos).toBe(0);
  });

  it("remover a Etapa que falta fecha a Volta", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id, materias } = await cicloCom(ana, [["Português", 60], ["Direito", 60]]);
    await registrarEstudo(db, ana, materias["Português"], { ...estudo, duracaoMinutos: 60 });

    const fechada = await removerEtapa(db, ana, (await etapaDe(ana, id, "Direito")).id);

    expect(fechada).toBe(1);
    expect((await listarVoltas(db, ana, id)).map((v) => v.numero)).toEqual([2, 1]);
  });

  it("adicionar uma Etapa já cumprida pelas horas extras fecha a Volta", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id, materias } = await cicloCom(ana, [["Português", 60]]);
    await registrarEstudo(db, ana, materias["Português"], { ...estudo, duracaoMinutos: 30 });
    await removerEtapa(db, ana, (await etapaDe(ana, id, "Português")).id); // sem Etapas, a Volta segue aberta e a Matéria guarda o estudo
    expect((await listarVoltas(db, ana, id)).map((v) => v.numero)).toEqual([1]);

    const { voltaFechada } = await adicionarEtapa(db, ana, id, { nome: "Português", cargaMinutos: 30 });

    expect(voltaFechada).toBe(1);
    expect((await listarVoltas(db, ana, id)).map((v) => v.numero)).toEqual([2, 1]);
  });

  it("mudança que deixa uma Etapa abaixo de 100% mantém a Volta aberta", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id, materias } = await cicloCom(ana, [["Português", 60], ["Direito", 120]]);
    await registrarEstudo(db, ana, materias["Português"], { ...estudo, duracaoMinutos: 60 });
    await registrarEstudo(db, ana, materias["Direito"], { ...estudo, duracaoMinutos: 30 });

    const { voltaFechada } = await adicionarEtapa(db, ana, id, { nome: "TI", cargaMinutos: 60 });
    await editarEtapa(db, ana, (await etapaDe(ana, id, "Direito")).id, { nome: "Direito", cargaMinutos: 60 });

    expect(voltaFechada).toBeNull();
    expect((await listarVoltas(db, ana, id)).map((v) => v.numero)).toEqual([1]);
  });

  it("editar a Etapa devolve o número da Volta fechada", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id, materias } = await cicloCom(ana, [["Português", 60], ["Direito", 120]]);
    await registrarEstudo(db, ana, materias["Português"], { ...estudo, duracaoMinutos: 60 });
    await registrarEstudo(db, ana, materias["Direito"], { ...estudo, duracaoMinutos: 60 });

    const fechada = await editarEtapa(db, ana, (await etapaDe(ana, id, "Direito")).id, { nome: "Direito", cargaMinutos: 60 });
    const semMudanca = await editarEtapa(db, ana, (await etapaDe(ana, id, "Português")).id, { nome: "Português", cargaMinutos: 90 });

    expect([fechada, semMudanca]).toEqual([1, null]);
  });

  it("remover a última Etapa mantém a Volta aberta", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id, materias } = await cicloCom(ana, [["Português", 60]]);
    await registrarEstudo(db, ana, materias["Português"], { ...estudo, duracaoMinutos: 30 });

    const fechada = await removerEtapa(db, ana, (await etapaDe(ana, id, "Português")).id);

    expect(fechada).toBeNull();
    expect((await listarVoltas(db, ana, id)).map((v) => [v.numero, v.fim])).toEqual([[1, null]]);
  });

  it("mudar a carga não reabre nem altera a Volta fechada", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id, materias } = await cicloCom(ana, [["Português", 60]]);
    await registrarEstudo(db, ana, materias["Português"], { ...estudo, duracaoMinutos: 60 }); // fecha a Volta 1
    const antes = await listarVoltas(db, ana, id);

    await editarEtapa(db, ana, (await etapaDe(ana, id, "Português")).id, { nome: "Português", cargaMinutos: 600 }); // a Volta 1 já não estaria completa

    const depois = await listarVoltas(db, ana, id);
    expect(depois).toEqual(antes);
    expect(depois[1].fim).not.toBeNull();
  });

  it("reordenar as Etapas não muda as Voltas", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id, materias } = await cicloCom(ana, [["Português", 60], ["Direito", 60]]);
    await registrarEstudo(db, ana, materias["Português"], { ...estudo, duracaoMinutos: 60 });
    const antes = await listarVoltas(db, ana, id);
    const ids = (await obterCiclo(db, ana, id)).etapas.map((e) => e.id).reverse();

    await reordenarEtapas(db, ana, id, ids);

    expect(await listarVoltas(db, ana, id)).toEqual(antes);
  });

  it("registro e mudança de Etapa simultâneos fecham a Volta uma vez", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id, materias } = await cicloCom(ana, [["Português", 60], ["Direito", 120]]);
    await registrarEstudo(db, ana, materias["Português"], { ...estudo, duracaoMinutos: 60 });
    await registrarEstudo(db, ana, materias["Direito"], { ...estudo, duracaoMinutos: 60 });
    const direito = await etapaDe(ana, id, "Direito");

    await Promise.all([
      registrarEstudo(db, ana, materias["Direito"], { ...estudo, duracaoMinutos: 60 }),
      editarEtapa(db, ana, direito.id, { nome: "Direito", cargaMinutos: 60 }),
    ]);

    expect((await listarVoltas(db, ana, id)).map((v) => v.numero)).toEqual([2, 1]);
  });
});
