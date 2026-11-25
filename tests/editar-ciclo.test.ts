import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { duracaoDaEdicao } from "@/dominio";
import { bancoDeTeste, limparBanco } from "./apoio";

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
