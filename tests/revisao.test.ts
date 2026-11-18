import { describe, expect, it } from "vitest";
import { FAIXAS_PADRAO, MINIMO_PADRAO, fraseDaNota, notaPelasFaixas, recalcularCartao, sugerirNota, textoDaFaixa, validarFaixas } from "../src/revisao";

describe("faixas e nota", () => {
  it("conversão de nota pelas Faixas padrão", () => {
    const nota = (p: number) => notaPelasFaixas(p, FAIXAS_PADRAO);
    expect([59, 60, 74, 75, 89, 90].map(nota)).toEqual(["Errei", "Difícil", "Difícil", "Bom", "Bom", "Fácil"]);
  });

  it("o texto de cada faixa usa os limites do Ciclo", () => {
    expect((["Errei", "Difícil", "Bom", "Fácil"] as const).map((n) => textoDaFaixa(n, FAIXAS_PADRAO))).toEqual(["< 60%", "60–75%", "75–90%", "≥ 90%"]);
  });

  it("sugere a nota das Faixas a partir do Mínimo de questões", () => {
    expect(sugerirNota(16, 20, FAIXAS_PADRAO, MINIMO_PADRAO)).toBe("Bom");
    expect(sugerirNota(4, 5, FAIXAS_PADRAO, MINIMO_PADRAO)).toBe("Bom"); // 5 questões já bastam
    expect(sugerirNota(4, 4, FAIXAS_PADRAO, MINIMO_PADRAO)).toBeNull();
    expect(sugerirNota(null, null, FAIXAS_PADRAO, MINIMO_PADRAO)).toBeNull();
  });

  it("a frase da faixa traz a porcentagem e a faixa", () => {
    expect(fraseDaNota(16, 20, FAIXAS_PADRAO, MINIMO_PADRAO)).toBe("80% está na faixa 75–90% deste ciclo. Você pode trocar a nota antes de salvar.");
  });

  it("abaixo do Mínimo não há sugestão e a frase pede a nota", () => {
    expect(fraseDaNota(2, 3, FAIXAS_PADRAO, MINIMO_PADRAO)).toBe("Menos de 5 questões: escolha a nota da revisão.");
  });
});

describe("validar faixas", () => {
  const valido = { ...FAIXAS_PADRAO, minimo: 5 };
  it("aceita limites crescentes de 1 a 100 e Mínimo de 1 a 1000", () => {
    expect(validarFaixas(valido)).toBeNull();
    expect(validarFaixas({ erreiAte: 1, dificilAte: 2, bomAte: 100, minimo: 1000 })).toBeNull();
  });
  it("recusa limite fora do intervalo, não crescente, não inteiro ou Mínimo fora do intervalo", () => {
    for (const ruim of [
      { ...valido, erreiAte: 0 }, { ...valido, bomAte: 101 }, { ...valido, dificilAte: 60 },
      { ...valido, bomAte: 70 }, { ...valido, erreiAte: 60.5 }, { ...valido, minimo: 0 }, { ...valido, minimo: 1001 },
    ]) expect(validarFaixas(ruim)?.mensagem).toBeTruthy();
  });
});

describe("recalcular cartão", () => {
  it("sem notas o Cartão fica sem data", () => {
    expect(recalcularCartao([])).toEqual({ proximaRevisao: null, estado: null, log: [] });
  });

  it("com notas devolve o Cartão e um item de log por nota, em ordem", () => {
    const d1 = new Date("2026-11-01T12:00:00Z");
    const d2 = new Date("2026-11-05T12:00:00Z");
    const r = recalcularCartao([{ nota: "Bom", revisadoEm: d1 }, { nota: "Fácil", revisadoEm: d2 }]);
    expect(r.log.map((l) => l.nota)).toEqual(["Bom", "Fácil"]);
    expect(r.log.map((l) => l.revisadoEm)).toEqual([d1, d2]);
    expect(r.log[1].antes).toEqual(r.log[0].depois);
    expect(r.proximaRevisao!.getTime()).toBeGreaterThan(d2.getTime());
    expect(r.estado).toEqual(r.log[1].depois);
    // sem fuzz e sem passos curtos: o mesmo histórico dá sempre a mesma data
    expect(recalcularCartao([{ nota: "Bom", revisadoEm: d1 }, { nota: "Fácil", revisadoEm: d2 }]).proximaRevisao).toEqual(r.proximaRevisao);
  });

  it("uma nota pior agenda a revisão mais cedo", () => {
    const d = new Date("2026-11-01T12:00:00Z");
    const data = (nota: "Errei" | "Fácil") => recalcularCartao([{ nota, revisadoEm: d }]).proximaRevisao!.getTime();
    expect(data("Errei")).toBeLessThan(data("Fácil"));
  });
});
