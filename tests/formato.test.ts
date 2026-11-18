import { describe, expect, it } from "vitest";
import { avisoDaImportacao, avisoDaVoltaConcluida, dataDaVolta, descricaoDaVolta, duracaoDaVolta, rotuloDaDiferenca, rotuloDaVariacao, situacaoDaEtapa } from "@/app/formato";
import { conteudoDoRegistro } from "@/app/campos-do-registro";
import { percentualDeAcerto, variacaoPercentual } from "@/dominio";

describe("variação e acerto", () => {
  it("variação arredondada contra o período anterior; sem anterior, nenhuma", () => {
    expect(variacaoPercentual(700, 625)).toBe(12);
    expect(variacaoPercentual(300, 600)).toBe(-50);
    expect(variacaoPercentual(0, 120)).toBe(-100);
    expect(variacaoPercentual(120, 0)).toBeNull();
    // meio ponto se afasta do zero nos dois sinais
    expect(variacaoPercentual(90, 80)).toBe(13);
    expect(variacaoPercentual(70, 80)).toBe(-13);
  });

  it("acerto arredondado; sem questões, nenhum", () => {
    expect(percentualDeAcerto(16, 20)).toBe(80);
    expect(percentualDeAcerto(2, 3)).toBe(67);
    expect(percentualDeAcerto(0, 5)).toBe(0);
    expect(percentualDeAcerto(0, 0)).toBeNull();
    expect(percentualDeAcerto(null, null)).toBeNull();
  });

  it("rótulos de chip", () => {
    expect(rotuloDaVariacao(12)).toBe("+12%");
    expect(rotuloDaVariacao(-50)).toBe("−50%");
    expect(rotuloDaDiferenca(25)).toBe("+25min");
    expect(rotuloDaDiferenca(-70)).toBe("−1h10");
  });
});

describe("Volta e Situação da Etapa", () => {
  const hoje = new Date("2026-11-16T15:00:00-03:00");
  it("Volta 3 aberta em 2/11 há 14 dias; Volta 1 é a primeira", () => {
    expect(descricaoDaVolta(3, new Date("2026-11-02T10:00:00-03:00"), hoje)).toBe("Iniciada em 2 de novembro · há 14 dias");
    expect(descricaoDaVolta(2, new Date("2026-11-15T10:00:00-03:00"), hoje)).toBe("Iniciada em 15 de novembro · há 1 dia");
    expect(descricaoDaVolta(1, null, hoje)).toBe("Primeira volta");
  });

  it("uma Situação por Etapa", () => {
    const e = (feitoMinutos: number) => ({ cargaMinutos: 60, feitoMinutos });
    expect(situacaoDaEtapa(e(60), { proxima: false, extraMinutos: 0 })).toBe("Concluída");
    expect(situacaoDaEtapa(e(60), { proxima: false, extraMinutos: 75 })).toBe("+1h15 extra");
    expect(situacaoDaEtapa(e(20), { proxima: true, extraMinutos: 0 })).toBe("Próxima etapa");
    expect(situacaoDaEtapa(e(20), { proxima: false, extraMinutos: 0 })).toBe("Em andamento");
    expect(situacaoDaEtapa(e(0), { proxima: false, extraMinutos: 0 })).toBe("Não iniciada");
  });
});

describe("Tópicos na interface", () => {
  it("o aviso da importação concorda com o número", () => {
    expect(avisoDaImportacao(2, 2)).toBe("2 importados, 2 ignorados.");
    expect(avisoDaImportacao(1, 1)).toBe("1 importado, 1 ignorado.");
    expect(avisoDaImportacao(0, 3)).toBe("0 importados, 3 ignorados.");
  });

  it("o segmento do Conteúdo grava só o campo do segmento escolhido", () => {
    const campos = { topicoId: "t1", conteudoLivre: "crase" };
    expect(conteudoDoRegistro("topico", campos)).toEqual({ topicoId: "t1", conteudoLivre: "" });
    expect(conteudoDoRegistro("topico", { ...campos, topicoId: "" })).toEqual({ erro: "Escolha um tópico." });
    expect(conteudoDoRegistro("livre", campos)).toEqual({ topicoId: null, conteudoLivre: "crase" });
    expect(conteudoDoRegistro("nenhum", campos)).toEqual({ topicoId: null, conteudoLivre: "" });
  });
});

describe("Histórico de Voltas", () => {
  const em = (iso: string) => new Date(`${iso}-03:00`);

  it("datas em dd/mm/aaaa e duração em dias de calendário", () => {
    expect(dataDaVolta(em("2026-11-02T10:00:00"))).toBe("02/11/2026");
    expect(dataDaVolta(new Date("2026-11-03T01:30:00Z"))).toBe("02/11/2026"); // 22h30 em Brasília ainda é dia 2
    expect(duracaoDaVolta(em("2026-11-02T08:00:00"), em("2026-11-02T22:00:00"))).toBe("Mesmo dia");
    expect(duracaoDaVolta(em("2026-11-02T23:00:00"), em("2026-11-03T01:00:00"))).toBe("1 dia");
    expect(duracaoDaVolta(em("2026-11-02T10:00:00"), em("2026-11-16T09:00:00"))).toBe("14 dias");
    // Volta aberta: conta até hoje
    expect(duracaoDaVolta(em("2026-11-02T10:00:00"), null, em("2026-11-16T15:00:00"))).toBe("14 dias");
    expect(duracaoDaVolta(em("2026-11-16T10:00:00"), null, em("2026-11-16T15:00:00"))).toBe("Mesmo dia");
  });

  it("aviso de Volta concluída", () => {
    expect(avisoDaVoltaConcluida(1)).toBe("Volta 1 concluída. A Volta 2 começou.");
    expect(avisoDaVoltaConcluida(9)).toBe("Volta 9 concluída. A Volta 10 começou.");
  });
});
