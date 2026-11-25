import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { adicionarEtapa, criarCiclo, criarTopico, NaoEncontradoError, obterSugestaoDoCiclo, removerEtapa } from "@/casos-de-uso";
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

describe("obterSugestaoDoCiclo", () => {
  it("lista as Matérias com Etapa na ordem da primeira Etapa", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await criarCiclo(db, ana, { nome: "Banco", duracaoEtapaMinutos: 90, materias: [M("Português", 12, "media"), M("TI", 50, "dificil"), M("Inglês", 5, "facil")] });
    // Uma Matéria só com Etapa removida fica guardada (com Tópico) mas sai da lista.
    const extra = await adicionarEtapa(db, ana, id, { nome: "Atualidades", cargaMinutos: 60 });
    await criarTopico(db, ana, extra.materiaId, { nome: "Economia" });
    await removerEtapa(db, ana, extra.id);
    const sugestao = await obterSugestaoDoCiclo(db, ana, id);
    expect(sugestao).toEqual({
      id,
      nome: "Banco",
      arquivado: false,
      duracaoEtapaMinutos: 90,
      materias: [
        { nome: "TI", questoesDaProva: 50, dificuldade: "dificil" },
        { nome: "Português", questoesDaProva: 12, dificuldade: "media" },
        { nome: "Inglês", questoesDaProva: 5, dificuldade: "facil" },
      ],
    });
  });

  it("Matéria criada à mão vem sem Questões nem Dificuldade", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await criarCiclo(db, ana, { nome: "TRF" });
    await db.update(ciclo).set({ duracaoEtapaMinutos: null }).where(eq(ciclo.id, id));
    await adicionarEtapa(db, ana, id, { nome: "Direito", cargaMinutos: 120 });
    await adicionarEtapa(db, ana, id, { nome: "Português", cargaMinutos: 60 });
    await adicionarEtapa(db, ana, id, { nome: "Direito", cargaMinutos: 60 });
    const sugestao = await obterSugestaoDoCiclo(db, ana, id);
    expect(sugestao.materias).toEqual([
      { nome: "Direito", questoesDaProva: null, dificuldade: null },
      { nome: "Português", questoesDaProva: null, dificuldade: null },
    ]);
    // Sem duração gravada: a carga mais comum das Etapas (60, 120, 60).
    expect(sugestao.duracaoEtapaMinutos).toBe(60);
  });

  it("não lê Ciclo de outro Usuário", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const bia = await cadastrar(db, "bia@exemplo.com");
    const { id } = await criarCiclo(db, ana, { nome: "Banco" });
    await expect(obterSugestaoDoCiclo(db, bia, id)).rejects.toBeInstanceOf(NaoEncontradoError);
  });
});
