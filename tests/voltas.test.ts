import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { adicionarEtapa, criarCiclo, listarRegistros, listarVoltas, NaoEncontradoError, obterCiclo, registrarEstudo, reiniciarVolta, ValidacaoError } from "@/casos-de-uso";
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
