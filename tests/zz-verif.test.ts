import { and, eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { adicionarEtapa, criarCiclo, editarRegistro, listarRegistros, obterCiclo, registrarEstudo } from "@/casos-de-uso";
import { registroDeEstudo, volta } from "@/db/schema";
import { bancoDeTeste, cadastrar, limparBanco } from "./apoio";
const db = bancoDeTeste();
beforeEach(() => limparBanco(db));
afterAll(() => db.$client.end());
const estudo = { tipo: "Teoria" } as const;
async function ciclo(u: { id: string }, nome: string, cargas: Record<string, number>) {
  const { id } = await criarCiclo(db, u, { nome });
  const m: Record<string, string> = {};
  for (const [k, v] of Object.entries(cargas)) m[k] = (await adicionarEtapa(db, u, id, { nome: k, cargaMinutos: v })).materiaId;
  return { id, m };
}
const feito = async (u: { id: string }, c: string, n: string) => (await obterCiclo(db, u, c)).materias.find((x) => x.nome === n)?.feitoMinutos;
describe("verif", () => {
  it("registro exatamente no instante de fechamento fica na Volta 1 e nao soma na 2", async () => {
    const ana = await cadastrar(db, "a@e.com");
    const c = await ciclo(ana, "T", { P: 600 });
    const { id } = await registrarEstudo(db, ana, c.m.P, { ...estudo, duracaoMinutos: 600 });
    const fim = new Date("2026-11-10T15:00:00-03:00");
    await db.update(volta).set({ fim }).where(and(eq(volta.cicloId, c.id), eq(volta.numero, 1)));
    await db.update(volta).set({ inicio: fim }).where(and(eq(volta.cicloId, c.id), eq(volta.numero, 2)));
    await db.update(registroDeEstudo).set({ dataHora: fim }).where(eq(registroDeEstudo.id, id));
    expect((await listarRegistros(db, ana, {})).registros[0].volta).toBe(1);
    expect(await feito(ana, c.id, "P")).toBe(0);
    await db.update(registroDeEstudo).set({ dataHora: new Date(fim.getTime() + 1) }).where(eq(registroDeEstudo.id, id));
    expect((await listarRegistros(db, ana, {})).registros[0].volta).toBe(2);
    expect(await feito(ana, c.id, "P")).toBe(600);
  });
  it("mover para Materia de outro Ciclo que completa fecha o destino, nao o de origem; mesmo Ciclo idem", async () => {
    const ana = await cadastrar(db, "a@e.com");
    const a = await ciclo(ana, "A", { P: 60, D: 60 });
    const b = await ciclo(ana, "B", { R: 60 });
    await registrarEstudo(db, ana, a.m.P, { ...estudo, duracaoMinutos: 60 });
    const { id } = await registrarEstudo(db, ana, a.m.D, { ...estudo, duracaoMinutos: 30 });
    const r = await editarRegistro(db, ana, id, b.m.R, { ...estudo, duracaoMinutos: 60 });
    expect(r.voltaFechada).toBe(1);
    expect((await obterCiclo(db, ana, b.id)).volta.numero).toBe(2);
    expect((await obterCiclo(db, ana, a.id)).volta.numero).toBe(1);
    expect(await feito(ana, a.id, "D")).toBe(0);
  });
  it("limite 0 e negativo caem em 25", async () => {
    const ana = await cadastrar(db, "a@e.com");
    const c = await ciclo(ana, "T", { P: 6000 });
    for (let i = 0; i < 30; i++) await registrarEstudo(db, ana, c.m.P, { ...estudo, duracaoMinutos: 1 });
    for (const limite of [0, -5, 1.5, NaN]) expect((await listarRegistros(db, ana, { limite })).registros.length).toBe(25);
    expect((await listarRegistros(db, ana, { limite: 1 })).registros.length).toBe(1);
  });
});
