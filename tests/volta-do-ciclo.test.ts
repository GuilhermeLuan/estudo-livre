import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { adicionarEtapa, criarCiclo, obterCiclo, registrarEstudo } from "@/casos-de-uso";
import { bancoDeTeste, cadastrar, limparBanco } from "./apoio";

const db = bancoDeTeste();
beforeEach(() => limparBanco(db));
afterAll(() => db.$client.end());

const estudo = { tipo: "Teoria" } as const;

describe("progresso na tela do Ciclo", () => {
  it("cada Etapa traz o feito, e o Ciclo traz a Volta, os totais e as Matérias com progresso", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await criarCiclo(db, ana, { nome: "TRF" });
    const pt1 = await adicionarEtapa(db, ana, id, { nome: "Português", cargaMinutos: 60 });
    await adicionarEtapa(db, ana, id, { nome: "Direito", cargaMinutos: 120 });
    await adicionarEtapa(db, ana, id, { nome: "Português", cargaMinutos: 60 });
    await registrarEstudo(db, ana, pt1.materiaId, { ...estudo, duracaoMinutos: 90 });

    const ciclo = await obterCiclo(db, ana, id);

    expect(ciclo.etapas.map((e) => [e.nome, e.feitoMinutos])).toEqual([["Português", 60], ["Direito", 0], ["Português", 30]]);
    expect(ciclo.volta).toEqual({ numero: 1, inicio: null });
    expect([ciclo.cargaMinutos, ciclo.feitoMinutos, ciclo.extraMinutos]).toEqual([240, 90, 0]);
    expect(ciclo.materias.map((m) => [m.nome, m.cargaMinutos, m.feitoMinutos])).toEqual([["Português", 120, 90], ["Direito", 120, 0]]);
    expect(ciclo.materias.map((m) => [m.nome, m.etapas])).toEqual([["Português", 2], ["Direito", 1]]);
    expect([ciclo.etapas.length, ciclo.materias.length, ciclo.cargaMinutos - ciclo.feitoMinutos, ciclo.percentual]).toEqual([3, 2, 150, 38]); // 90/240 = 37,5%
    expect(ciclo.proximaEtapaId).toBe(ciclo.etapas[1].id); // Português 1 está a 100%, Direito é a primeira incompleta
  });

  it("depois de fechar a Volta, mostra a Volta 2 com o instante em que abriu e soma as horas extras", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await criarCiclo(db, ana, { nome: "TRF" });
    const { materiaId } = await adicionarEtapa(db, ana, id, { nome: "Português", cargaMinutos: 60 });
    await adicionarEtapa(db, ana, id, { nome: "Direito", cargaMinutos: 60 });
    const antes = Date.now();
    await registrarEstudo(db, ana, materiaId, { ...estudo, duracaoMinutos: 60 });
    await registrarEstudo(db, ana, (await obterCiclo(db, ana, id)).etapas[1].materiaId, { ...estudo, duracaoMinutos: 60 });
    expect((await obterCiclo(db, ana, id)).volta.numero).toBe(2);
    await registrarEstudo(db, ana, materiaId, { ...estudo, duracaoMinutos: 70 });

    const { volta, extraMinutos } = await obterCiclo(db, ana, id);

    expect(volta.numero).toBe(2);
    expect(volta.inicio!.getTime()).toBeGreaterThanOrEqual(antes);
    expect(extraMinutos).toBe(10);
  });
});
