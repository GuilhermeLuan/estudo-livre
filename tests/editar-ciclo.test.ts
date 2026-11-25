import { asc, eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  adicionarEtapa,
  arquivarCiclo,
  criarCiclo,
  criarTopico,
  exportarBackup,
  gerarEtapas,
  importarBackup,
  listarVoltas,
  NaoEncontradoError,
  obterCiclo,
  obterSugestaoDoCiclo,
  registrarEstudo,
  reiniciarVolta,
  removerEtapa,
  ValidacaoError,
} from "@/casos-de-uso";
import { duracaoDaEdicao, minutosDeHoras, sugerirEtapas, type MateriaParaSugerir } from "@/dominio";
import { ciclo, etapa, materia, registroDeEstudo, topico } from "@/db/schema";
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

const estudo = { tipo: "Teoria" } as const;
const INICIAL = [M("Português", 12, "media"), M("TI", 50, "dificil"), M("Inglês", 5, "facil"), M("Atualidades", 5, "facil")];

/** Um Ciclo criado pela sugestão, com o id de cada Matéria por nome. */
async function cicloSugerido(usuario: { id: string }, materias = INICIAL) {
  const { id } = await criarCiclo(db, usuario, { nome: "Banco", duracaoEtapaMinutos: 60, materias });
  const linhas = await db.select({ id: materia.id, nome: materia.nome }).from(materia).where(eq(materia.cicloId, id));
  return { id, materias: Object.fromEntries(linhas.map((m) => [m.nome, m.id])) as Record<string, string> };
}

const etapasDo = async (cicloId: string) =>
  db.select({ materiaId: etapa.materiaId, cargaMinutos: etapa.cargaMinutos, posicao: etapa.posicao }).from(etapa).where(eq(etapa.cicloId, cicloId)).orderBy(asc(etapa.posicao));

describe("gerarEtapas", () => {
  it("substitui as Etapas pelas sugeridas e grava nome, duração, Questões e Dificuldade", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id, materias } = await cicloSugerido(ana);
    const nova = [M("TI", 50, "media"), M("Português", 30, "dificil"), M("Inglês", 5, "media")];
    expect(await gerarEtapas(db, ana, id, { nome: "Banco do Brasil", duracaoEtapaMinutos: 90, materias: nova })).toEqual({ voltaFechada: null });
    const [gravado] = await db.select().from(ciclo).where(eq(ciclo.id, id));
    expect(gravado.nome).toBe("Banco do Brasil");
    expect(gravado.duracaoEtapaMinutos).toBe(90);
    const detalhe = await obterCiclo(db, ana, id);
    expect(detalhe.etapas.map((e) => e.nome)).toEqual(sugerirEtapas(nova).map((e) => e.nome));
    expect(detalhe.etapas.map((e) => e.posicao)).toEqual(detalhe.etapas.map((_, i) => i));
    expect(new Set(detalhe.etapas.map((e) => e.cargaMinutos))).toEqual(new Set([90]));
    const ti = (await db.select().from(materia).where(eq(materia.id, materias["TI"])))[0];
    expect([ti.questoesDaProva, ti.dificuldade]).toEqual([50, "media"]);
    const pt = (await db.select().from(materia).where(eq(materia.id, materias["Português"])))[0];
    expect([pt.questoesDaProva, pt.dificuldade]).toEqual([30, "dificil"]);
    // A tela de edição reabre com o que foi gerado.
    expect((await obterSugestaoDoCiclo(db, ana, id)).materias).toEqual([
      { nome: "TI", questoesDaProva: 50, dificuldade: "media" },
      { nome: "Português", questoesDaProva: 30, dificuldade: "dificil" },
      { nome: "Inglês", questoesDaProva: 5, dificuldade: "media" },
    ]);
  });

  it("reaproveita a Matéria de mesmo nome com Registros e Tópicos", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id, materias } = await cicloSugerido(ana);
    await registrarEstudo(db, ana, materias["Português"], { ...estudo, duracaoMinutos: 30 });
    const { id: topicoId } = await criarTopico(db, ana, materias["Português"], { nome: "Crase" });
    await gerarEtapas(db, ana, id, { nome: "Banco", duracaoEtapaMinutos: 60, materias: [M("português", 12, "dificil"), M("TI", 50, "dificil")] });
    const doCiclo = await db.select({ id: materia.id, nome: materia.nome }).from(materia).where(eq(materia.cicloId, id)).orderBy(asc(materia.nome));
    expect(doCiclo).toEqual([
      { id: materias["Português"], nome: "Português" },
      { id: materias["TI"], nome: "TI" },
    ]);
    expect((await etapasDo(id)).filter((e) => e.materiaId === materias["Português"]).length).toBeGreaterThan(0);
    expect(await db.select({ id: registroDeEstudo.id }).from(registroDeEstudo).where(eq(registroDeEstudo.materiaId, materias["Português"]))).toHaveLength(1);
    expect(await db.select({ id: topico.id }).from(topico).where(eq(topico.materiaId, materias["Português"]))).toEqual([{ id: topicoId }]);
  });

  it("cria a Matéria nova com Questões e Dificuldade", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await cicloSugerido(ana);
    await gerarEtapas(db, ana, id, { nome: "Banco", duracaoEtapaMinutos: 60, materias: [...INICIAL, M("Matemática", 8, "dificil")] });
    const [nova] = await db.select().from(materia).where(eq(materia.nome, "Matemática"));
    expect(nova.cicloId).toBe(id);
    expect([nova.questoesDaProva, nova.dificuldade]).toEqual([8, "dificil"]);
    expect((await etapasDo(id)).filter((e) => e.materiaId === nova.id).length).toBeGreaterThan(0);
  });

  it("Matéria fora da lista perde as Etapas e só fica com Registro ou Tópico", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id, materias } = await cicloSugerido(ana);
    await registrarEstudo(db, ana, materias["TI"], { ...estudo, duracaoMinutos: 30 });
    await criarTopico(db, ana, materias["Inglês"], { nome: "Reading" });
    await gerarEtapas(db, ana, id, { nome: "Banco", duracaoEtapaMinutos: 60, materias: [M("Português", 12, "media")] });
    const etapas = await etapasDo(id);
    expect(new Set(etapas.map((e) => e.materiaId))).toEqual(new Set([materias["Português"]]));
    const restantes = (await db.select({ nome: materia.nome }).from(materia).where(eq(materia.cicloId, id))).map((m) => m.nome).sort();
    expect(restantes).toEqual(["Inglês", "Português", "TI"]); // Atualidades, sem estudo nem Tópico, foi apagada
  });

  it("mantém a Volta aberta e recalcula o progresso com as horas dela", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id, materias } = await cicloSugerido(ana);
    await reiniciarVolta(db, ana, id, 1);
    const antes = await obterCiclo(db, ana, id);
    expect(antes.volta.numero).toBe(2);
    await registrarEstudo(db, ana, materias["Português"], { ...estudo, duracaoMinutos: 180 });
    // Português (10, Difícil) pesa 20 e TI (5, Difícil) pesa 10: 2 Etapas de Português e 1 de TI, de 1h.
    const r = await gerarEtapas(db, ana, id, { nome: "Banco", duracaoEtapaMinutos: 60, materias: [M("Português", 10, "dificil"), M("TI", 5, "dificil")] });
    expect(r.voltaFechada).toBeNull();
    const depois = await obterCiclo(db, ana, id);
    expect(depois.volta).toEqual(antes.volta);
    const pt = depois.etapas.filter((e) => e.nome === "Português");
    expect(pt.map((e) => e.feitoMinutos)).toEqual([60, 60]);
    expect(depois.materias.find((m) => m.nome === "Português")!.extraMinutos).toBe(60);
    expect(depois.etapas.find((e) => e.nome === "TI")!.feitoMinutos).toBe(0);
  });

  it("fecha a Volta quando todas as novas Etapas ficam completas", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id, materias } = await cicloSugerido(ana, [M("Português", 12, "media"), M("TI", 50, "dificil")]);
    await registrarEstudo(db, ana, materias["Português"], { ...estudo, duracaoMinutos: 60 });
    expect((await obterCiclo(db, ana, id)).volta.numero).toBe(1);
    const r = await gerarEtapas(db, ana, id, { nome: "Banco", duracaoEtapaMinutos: 60, materias: [M("Português", 12, "media")] });
    expect(r).toEqual({ voltaFechada: 1 });
    expect((await obterCiclo(db, ana, id)).volta.numero).toBe(2);
    expect((await listarVoltas(db, ana, id)).map((v) => v.numero)).toEqual([2, 1]);
  });

  it("recusa a lista vazia sem mudar nada", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await cicloSugerido(ana);
    const antes = await etapasDo(id);
    await expect(gerarEtapas(db, ana, id, { nome: "Outro", duracaoEtapaMinutos: 60, materias: [] })).rejects.toThrow(
      new ValidacaoError("Adicione ao menos uma matéria para gerar as etapas."),
    );
    expect(await etapasDo(id)).toEqual(antes);
    expect((await db.select().from(ciclo).where(eq(ciclo.id, id)))[0].nome).toBe("Banco");
  });

  it("recusa Matéria repetida sem mudar as Etapas", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await cicloSugerido(ana);
    const antes = await etapasDo(id);
    const materiasAntes = await db.select().from(materia).where(eq(materia.cicloId, id)).orderBy(asc(materia.nome));
    await expect(
      gerarEtapas(db, ana, id, { nome: "Banco", duracaoEtapaMinutos: 60, materias: [M("Estatística", 7, "dificil"), M("estatística", 5, "facil")] }),
    ).rejects.toThrow(new ValidacaoError("A matéria “estatística” já está na lista."));
    expect(await etapasDo(id)).toEqual(antes);
    // Falha de verdade no meio da transação (byte nulo recusado pelo Postgres): nada muda.
    await expect(gerarEtapas(db, ana, id, { nome: "Banco", duracaoEtapaMinutos: 60, materias: [M("Inglês", 9, "dificil"), M("Ruim\u0000", 5, "facil")] })).rejects.toThrow();
    expect(await etapasDo(id)).toEqual(antes);
    expect(await db.select().from(materia).where(eq(materia.cicloId, id)).orderBy(asc(materia.nome))).toEqual(materiasAntes);
  });

  it("recusa Ciclo arquivado sem mudar nada", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await cicloSugerido(ana);
    await arquivarCiclo(db, ana, id);
    const antes = await etapasDo(id);
    await expect(gerarEtapas(db, ana, id, { nome: "Banco", duracaoEtapaMinutos: 60, materias: [M("Português", 12, "media")] })).rejects.toThrow(
      new ValidacaoError("Ciclo arquivado. Reative para alterar."),
    );
    expect(await etapasDo(id)).toEqual(antes);
    expect((await obterSugestaoDoCiclo(db, ana, id)).arquivado).toBe(true);
  });

  it("não lê nem gera Ciclo de outro Usuário", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const bia = await cadastrar(db, "bia@exemplo.com");
    const { id } = await cicloSugerido(ana);
    const antes = await etapasDo(id);
    await expect(obterSugestaoDoCiclo(db, bia, id)).rejects.toBeInstanceOf(NaoEncontradoError);
    await expect(gerarEtapas(db, bia, id, { nome: "Banco", duracaoEtapaMinutos: 60, materias: [M("Português", 12, "media")] })).rejects.toBeInstanceOf(NaoEncontradoError);
    expect(await etapasDo(id)).toEqual(antes);
  });

  it("ignora Etapas enviadas pelo cliente", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await cicloSugerido(ana);
    const lista = [M("Português", 12, "media"), M("TI", 50, "dificil")];
    const dados = { nome: "Banco", duracaoEtapaMinutos: 60, materias: lista, etapas: [{ nome: "Inventada", cargaMinutos: 1 }] };
    await gerarEtapas(db, ana, id, dados as never);
    const nomes = (await obterCiclo(db, ana, id)).etapas.map((e) => e.nome);
    expect(nomes).toEqual(sugerirEtapas(lista).map((e) => e.nome));
  });

  it("recusa o nome do Ciclo vazio", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await cicloSugerido(ana);
    const antes = await etapasDo(id);
    await expect(gerarEtapas(db, ana, id, { nome: "  ", duracaoEtapaMinutos: 60, materias: [M("Português", 12, "media")] })).rejects.toThrow(
      new ValidacaoError("Informe o nome do ciclo."),
    );
    expect(await etapasDo(id)).toEqual(antes);
  });
});

const INVALIDO = "O arquivo não é um backup válido do Estudo Livre.";
const exportar = async (usuario: { id: string }) => JSON.parse(JSON.stringify(await exportarBackup(db, usuario)));

describe("backup", () => {
  it("exporta duracaoEtapaMinutos", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    await criarCiclo(db, ana, { nome: "Banco", duracaoEtapaMinutos: 90, materias: [M("Português", 12, "media")] });
    const antigo = await criarCiclo(db, ana, { nome: "TRF" });
    await db.update(ciclo).set({ duracaoEtapaMinutos: null }).where(eq(ciclo.id, antigo.id));
    const arquivo = await exportar(ana);
    const porNome = Object.fromEntries(arquivo.ciclos.map((c: { nome: string; duracaoEtapaMinutos: unknown }) => [c.nome, c.duracaoEtapaMinutos]));
    expect(porNome).toEqual({ Banco: 90, TRF: null });
  });

  it("importa duracaoEtapaMinutos ou nulo quando ausente", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    await criarCiclo(db, ana, { nome: "Banco", duracaoEtapaMinutos: 90, materias: [M("Português", 12, "media")] });
    const bia = await cadastrar(db, "bia@exemplo.com");
    await importarBackup(db, bia, JSON.stringify(await exportar(ana)));
    const [daBia] = await db.select().from(ciclo).where(eq(ciclo.usuarioId, bia.id));
    expect(daBia.duracaoEtapaMinutos).toBe(90);
    expect((await obterSugestaoDoCiclo(db, bia, daBia.id)).duracaoEtapaMinutos).toBe(90);

    const semCampo = await exportar(ana);
    delete semCampo.ciclos[0].duracaoEtapaMinutos;
    await importarBackup(db, bia, JSON.stringify(semCampo));
    const [deNovo] = await db.select().from(ciclo).where(eq(ciclo.usuarioId, bia.id));
    expect(deNovo.duracaoEtapaMinutos).toBeNull();
  });

  it("recusa duracaoEtapaMinutos inválida sem substituir nada", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    await criarCiclo(db, ana, { nome: "Banco", duracaoEtapaMinutos: 90 });
    const bia = await cadastrar(db, "bia@exemplo.com");
    await criarCiclo(db, bia, { nome: "Da Bia" });
    for (const valor of [0, 2.5, "60", 600_001]) {
      const arquivo = await exportar(ana);
      arquivo.ciclos[0].duracaoEtapaMinutos = valor;
      await expect(importarBackup(db, bia, JSON.stringify(arquivo))).rejects.toThrow(new ValidacaoError(INVALIDO));
      expect((await exportar(bia)).ciclos.map((c: { nome: string }) => c.nome)).toEqual(["Da Bia"]);
    }
    const limite = await exportar(ana);
    limite.ciclos[0].duracaoEtapaMinutos = 600_000;
    await expect(importarBackup(db, bia, JSON.stringify(limite))).resolves.toEqual({ ciclos: 1 });
  });
});
