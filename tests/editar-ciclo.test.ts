import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { criarCiclo } from "@/casos-de-uso";
import { duracaoDaEdicao, minutosDeHoras, type MateriaParaSugerir } from "@/dominio";
import { ciclo } from "@/db/schema";
import { bancoDeTeste, cadastrar, limparBanco } from "./apoio";

const db = bancoDeTeste();
beforeEach(() => limparBanco(db));
afterAll(() => db.$client.end());

describe("duracaoDaEdicao", () => {
  it("usa a gravada, senão a carga mais comum (empate a menor), senão 1h", () => {
    expect(duracaoDaEdicao(90, [60, 60, 120])).toBe(90);
    expect(duracaoDaEdicao(null, [60, 60, 120])).toBe(60);
    expect(duracaoDaEdicao(null, [120, 60])).toBe(60);
    expect(duracaoDaEdicao(null, [120, 120, 30])).toBe(120);
    expect(duracaoDaEdicao(null, [])).toBe(60);
  });
});

const M = (nome: string, questoesDaProva: number, dificuldade: MateriaParaSugerir["dificuldade"]): MateriaParaSugerir => ({ nome, questoesDaProva, dificuldade });
const duracaoGravada = async (id: string) => (await db.select({ d: ciclo.duracaoEtapaMinutos }).from(ciclo).where(eq(ciclo.id, id)))[0].d;

describe("criarCiclo", () => {
  it("grava a duração da Etapa no Ciclo", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const comMaterias = await criarCiclo(db, ana, { nome: "Banco", duracaoEtapaMinutos: minutosDeHoras("1,5"), materias: [M("Português", 12, "media")] });
    expect(await duracaoGravada(comMaterias.id)).toBe(90);
    const vazio = await criarCiclo(db, ana, { nome: "TRF", duracaoEtapaMinutos: 45 });
    expect(await duracaoGravada(vazio.id)).toBe(45);
    const semDuracao = await criarCiclo(db, ana, { nome: "TRT" });
    expect(await duracaoGravada(semDuracao.id)).toBe(60);
  });
});
