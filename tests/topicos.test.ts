import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  adicionarEtapa,
  criarCiclo,
  criarTopico,
  excluirTopico,
  importarTopicos,
  listarTopicosDasMaterias,
  marcarTopico,
  NaoEncontradoError,
  obterCiclo,
  obterCartao,
  obterMateria,
  registrarEstudo,
  removerEtapa,
  renomearTopico,
  ValidacaoError,
} from "@/casos-de-uso";
import { materia, registroDeEstudo, topico } from "@/db/schema";
import { hojeEmBrasilia } from "@/dia";
import { bancoDeTeste, cadastrar, limparBanco } from "./apoio";

const db = bancoDeTeste();
beforeEach(() => limparBanco(db));
afterAll(() => db.$client.end());

const estudo = { tipo: "Teoria" } as const;

/** Um Ciclo com uma Etapa de cada Matéria; devolve os ids do Ciclo e das Matérias, por nome. */
async function cicloCom(usuario: { id: string }, nomes: string[], cargaMinutos = 240) {
  const { id } = await criarCiclo(db, usuario, { nome: "TRT" });
  const materias: Record<string, string> = {};
  const etapas: Record<string, string> = {};
  for (const nome of nomes) {
    const etapa = await adicionarEtapa(db, usuario, id, { nome, cargaMinutos });
    materias[nome] = etapa.materiaId;
    etapas[nome] = etapa.id;
  }
  return { cicloId: id, materias, etapas };
}

const nomesDe = async (usuario: { id: string }, cicloId: string, materiaId: string) =>
  (await obterMateria(db, usuario, cicloId, materiaId)).topicos.map((t) => t.nome);

describe("Tópicos", () => {
  it("a Matéria devolve os Tópicos em ordem e o X de Y", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { cicloId, materias } = await cicloCom(ana, ["TI", "Português"]);
    const ids: string[] = [];
    for (let i = 1; i <= 10; i++) ids.push((await criarTopico(db, ana, materias.TI, { nome: `Tópico ${i}` })).id);
    for (const id of ids.slice(0, 3)) await marcarTopico(db, ana, id, true);
    const unico = await criarTopico(db, ana, materias["Português"], { nome: "Crase" });
    await marcarTopico(db, ana, unico.id, true);

    const ti = await obterMateria(db, ana, cicloId, materias.TI);
    expect(ti.topicos.map((t) => t.nome)).toEqual(ids.map((_, i) => `Tópico ${i + 1}`));
    expect([ti.nome, ti.ciclo, ti.estudados, ti.total]).toEqual(["TI", { id: cicloId, nome: "TRT" }, 3, 10]);
    const pt = await obterMateria(db, ana, cicloId, materias["Português"]);
    expect([pt.estudados, pt.total]).toEqual([1, 1]);
  });

  it("cria o Tópico no fim, sem espaços nas pontas", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { cicloId, materias } = await cicloCom(ana, ["TI"]);
    await criarTopico(db, ana, materias.TI, { nome: "Redes" });
    await criarTopico(db, ana, materias.TI, { nome: "  IA  " });
    await criarTopico(db, ana, materias.TI, { nome: "x".repeat(120) });
    const lista = (await obterMateria(db, ana, cicloId, materias.TI)).topicos;
    expect(lista.map((t) => t.nome)).toEqual(["Redes", "IA", "x".repeat(120)]);
    expect(lista.map((t) => t.estudado)).toEqual([false, false, false]);
  });

  it("recusa nome vazio ou com mais de 120 caracteres", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { cicloId, materias } = await cicloCom(ana, ["TI"]);
    const mensagem = "O nome do tópico precisa ter de 1 a 120 caracteres.";
    await expect(criarTopico(db, ana, materias.TI, { nome: "   " })).rejects.toThrow(mensagem);
    await expect(criarTopico(db, ana, materias.TI, { nome: "x".repeat(121) })).rejects.toThrow(mensagem);
    const { id } = await criarTopico(db, ana, materias.TI, { nome: "IA" });
    await expect(renomearTopico(db, ana, id, { nome: "" })).rejects.toThrow(mensagem);
    await criarTopico(db, ana, materias.TI, { nome: "😀".repeat(120) }); // 120 caracteres, 240 unidades UTF-16: cabe
    await expect(importarTopicos(db, ana, materias.TI, { texto: "😀".repeat(121) })).rejects.toThrow("A linha 1 passa de 120 caracteres.");
    expect(await nomesDe(ana, cicloId, materias.TI)).toEqual(["IA", "😀".repeat(120)]);
  });

  it("recusa nome repetido na Matéria e aceita em outra", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { cicloId, materias } = await cicloCom(ana, ["TI", "Português"]);
    await criarTopico(db, ana, materias.TI, { nome: "IA" });
    await expect(criarTopico(db, ana, materias.TI, { nome: "ia" })).rejects.toThrow("Já existe um tópico com este nome nesta matéria.");
    await criarTopico(db, ana, materias["Português"], { nome: "IA" });
    expect(await nomesDe(ana, cicloId, materias.TI)).toEqual(["IA"]);
    expect(await nomesDe(ana, cicloId, materias["Português"])).toEqual(["IA"]);
  });

  it("renomeia mantendo posição, marca e Registros", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { cicloId, materias } = await cicloCom(ana, ["TI"]);
    const primeiro = await criarTopico(db, ana, materias.TI, { nome: "ia" });
    await criarTopico(db, ana, materias.TI, { nome: "Redes" });
    await registrarEstudo(db, ana, materias.TI, { ...estudo, duracaoMinutos: 30, topicoId: primeiro.id });

    await renomearTopico(db, ana, primeiro.id, { nome: "IA" }); // só maiúsculas do próprio Tópico
    await renomearTopico(db, ana, primeiro.id, { nome: "Inteligência artificial" });
    await expect(renomearTopico(db, ana, primeiro.id, { nome: "REDES" })).rejects.toThrow("Já existe um tópico com este nome nesta matéria.");

    const lista = (await obterMateria(db, ana, cicloId, materias.TI)).topicos;
    expect(lista.map((t) => [t.nome, t.estudado, t.registros])).toEqual([["Inteligência artificial", true, 1], ["Redes", false, 0]]);
  });

  it("excluir o Tópico mantém os Registros sem conteúdo", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { cicloId, materias } = await cicloCom(ana, ["TI"]);
    const { id } = await criarTopico(db, ana, materias.TI, { nome: "IA" });
    await registrarEstudo(db, ana, materias.TI, { ...estudo, duracaoMinutos: 60, topicoId: id });
    await registrarEstudo(db, ana, materias.TI, { ...estudo, duracaoMinutos: 60, topicoId: id });
    expect((await obterMateria(db, ana, cicloId, materias.TI)).topicos[0].registros).toBe(2);

    await excluirTopico(db, ana, id);

    expect(await nomesDe(ana, cicloId, materias.TI)).toEqual([]);
    const registros = await db.select().from(registroDeEstudo);
    expect(registros.map((r) => [r.topicoId, r.conteudoLivre, r.duracaoMinutos])).toEqual([[null, null, 60], [null, null, 60]]);
    expect((await obterCiclo(db, ana, cicloId)).materias[0].feitoMinutos).toBe(120);
  });

  it("importa um Tópico por linha ignorando vazias e duplicadas", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { cicloId, materias } = await cicloCom(ana, ["TI"]);
    await criarTopico(db, ana, materias.TI, { nome: "SO" });
    const resultado = await importarTopicos(db, ana, materias.TI, { texto: "IA\n\n ia \nRedes\r\nredes\nSO" });
    expect(resultado).toEqual({ importados: 2, ignorados: 3 });
    expect(await nomesDe(ana, cicloId, materias.TI)).toEqual(["SO", "IA", "Redes"]);
    // repetir a mesma importação não muda nada
    expect(await importarTopicos(db, ana, materias.TI, { texto: "IA\nRedes" })).toEqual({ importados: 0, ignorados: 2 });
    expect(await nomesDe(ana, cicloId, materias.TI)).toEqual(["SO", "IA", "Redes"]);
  });

  it("a importação recusa linha longa, excesso de linhas e lista vazia", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { cicloId, materias } = await cicloCom(ana, ["TI"]);
    await expect(importarTopicos(db, ana, materias.TI, { texto: `IA\n\n${"x".repeat(121)}` })).rejects.toThrow("A linha 3 passa de 120 caracteres.");
    const duzentos = Array.from({ length: 200 }, (_, i) => `T${i}`);
    await expect(importarTopicos(db, ana, materias.TI, { texto: [...duzentos, "T200"].join("\n") })).rejects.toThrow("Importe no máximo 200 tópicos por vez.");
    await expect(importarTopicos(db, ana, materias.TI, { texto: " \n\n  " })).rejects.toThrow("Nada para importar.");
    expect(await nomesDe(ana, cicloId, materias.TI)).toEqual([]); // nada gravado pela metade
    expect(await importarTopicos(db, ana, materias.TI, { texto: [...duzentos, "t0"].join("\n") })).toEqual({ importados: 200, ignorados: 1 }); // 200 distintas cabem
  });

  it("o Usuário marca e desmarca, mesmo com Registros", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { cicloId, materias } = await cicloCom(ana, ["TI"]);
    const { id } = await criarTopico(db, ana, materias.TI, { nome: "IA" });
    await marcarTopico(db, ana, id, true);
    await marcarTopico(db, ana, id, false);
    expect((await obterMateria(db, ana, cicloId, materias.TI)).estudados).toBe(0);

    await registrarEstudo(db, ana, materias.TI, { ...estudo, duracaoMinutos: 30, topicoId: id });
    expect((await obterMateria(db, ana, cicloId, materias.TI)).estudados).toBe(1);
    await marcarTopico(db, ana, id, false); // há Registro, e a marca manual vale (AD-009)
    expect((await obterMateria(db, ana, cicloId, materias.TI)).estudados).toBe(0);
    await registrarEstudo(db, ana, materias.TI, { ...estudo, duracaoMinutos: 30, topicoId: id });
    expect((await obterMateria(db, ana, cicloId, materias.TI)).estudados).toBe(1); // um novo Registro marca de novo
  });

  it("nada é lido nem gravado com ids de outro Usuário", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const bia = await cadastrar(db, "bia@exemplo.com");
    const dela = await cicloCom(ana, ["TI"]);
    const outro = await cicloCom(ana, ["Português"]);
    const { id } = await criarTopico(db, ana, dela.materias.TI, { nome: "IA" });

    await expect(obterMateria(db, bia, dela.cicloId, dela.materias.TI)).rejects.toBeInstanceOf(NaoEncontradoError);
    await expect(obterMateria(db, ana, outro.cicloId, dela.materias.TI)).rejects.toBeInstanceOf(NaoEncontradoError); // Matéria de outro Ciclo
    await expect(criarTopico(db, bia, dela.materias.TI, { nome: "X" })).rejects.toBeInstanceOf(NaoEncontradoError);
    await expect(importarTopicos(db, bia, dela.materias.TI, { texto: "X" })).rejects.toBeInstanceOf(NaoEncontradoError);
    await expect(renomearTopico(db, bia, id, { nome: "Y" })).rejects.toBeInstanceOf(NaoEncontradoError);
    await expect(marcarTopico(db, bia, id, true)).rejects.toBeInstanceOf(NaoEncontradoError);
    await expect(excluirTopico(db, bia, id)).rejects.toBeInstanceOf(NaoEncontradoError);
    expect(await nomesDe(ana, dela.cicloId, dela.materias.TI)).toEqual(["IA"]);
    expect([...(await listarTopicosDasMaterias(db, bia)).keys()]).toEqual([]);
  });

  it("duas criações simultâneas do mesmo nome gravam um só", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { cicloId, materias } = await cicloCom(ana, ["TI"]);
    const resultados = await Promise.allSettled([
      criarTopico(db, ana, materias.TI, { nome: "IA" }),
      criarTopico(db, ana, materias.TI, { nome: "ia" }),
      importarTopicos(db, ana, materias.TI, { texto: "IA\nRedes" }),
    ]);
    const importacao = resultados[2];
    expect(importacao.status === "fulfilled" && importacao.value.importados + importacao.value.ignorados).toBe(2);
    expect(resultados.filter((r) => r.status === "rejected").every((r) => (r as PromiseRejectedResult).reason instanceof ValidacaoError)).toBe(true);
    const lista = await nomesDe(ana, cicloId, materias.TI);
    expect(lista.filter((n) => n.toLowerCase() === "ia")).toHaveLength(1);
    const posicoes = (await db.select({ p: topico.posicao }).from(topico)).map((t) => t.p);
    expect(new Set(posicoes).size).toBe(posicoes.length);
  });

  it("o Registro com Tópico grava o topicoId sem Conteúdo livre", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { materias } = await cicloCom(ana, ["TI"]);
    const { id } = await criarTopico(db, ana, materias.TI, { nome: "IA" });
    await registrarEstudo(db, ana, materias.TI, { ...estudo, duracaoMinutos: 30, topicoId: id });
    const [registro] = await db.select().from(registroDeEstudo);
    expect([registro.topicoId, registro.conteudoLivre]).toEqual([id, null]);
  });

  it("Conteúdo livre e Sem conteúdo gravam sem Tópico", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { materias } = await cicloCom(ana, ["TI"]);
    await registrarEstudo(db, ana, materias.TI, { ...estudo, duracaoMinutos: 30, conteudoLivre: "crase antes de horas" });
    await registrarEstudo(db, ana, materias.TI, { ...estudo, duracaoMinutos: 30 });
    await registrarEstudo(db, ana, materias.TI, { ...estudo, duracaoMinutos: 30, conteudoLivre: "x".repeat(200) });
    await expect(registrarEstudo(db, ana, materias.TI, { ...estudo, duracaoMinutos: 30, conteudoLivre: "x".repeat(201) })).rejects.toBeInstanceOf(ValidacaoError);
    const registros = await db.select().from(registroDeEstudo).orderBy(registroDeEstudo.criadoEm);
    expect(registros.map((r) => [r.topicoId, r.conteudoLivre])).toEqual([[null, "crase antes de horas"], [null, null], [null, "x".repeat(200)]]);
  });

  it("registrarEstudo recusa Tópico de outra Matéria, de outro Usuário e Tópico com Conteúdo livre", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const bia = await cadastrar(db, "bia@exemplo.com");
    const { materias } = await cicloCom(ana, ["TI", "Português"]);
    const dela = await cicloCom(bia, ["TI"]);
    const deTi = await criarTopico(db, ana, materias.TI, { nome: "IA" });
    const deBia = await criarTopico(db, bia, dela.materias.TI, { nome: "IA" });

    await expect(registrarEstudo(db, ana, materias["Português"], { ...estudo, duracaoMinutos: 30, topicoId: deTi.id })).rejects.toThrow("Escolha um tópico desta matéria.");
    await expect(registrarEstudo(db, ana, materias.TI, { ...estudo, duracaoMinutos: 30, topicoId: deBia.id })).rejects.toThrow("Escolha um tópico desta matéria.");
    await expect(registrarEstudo(db, ana, materias.TI, { ...estudo, duracaoMinutos: 30, topicoId: deTi.id, conteudoLivre: "algo" })).rejects.toThrow(
      "Escolha um tópico ou digite um conteúdo, não os dois.",
    );
    expect(await db.select().from(registroDeEstudo)).toHaveLength(0);
    expect((await db.select().from(topico).where(eq(topico.id, deTi.id)))[0].estudado).toBe(false);
  });

  it("o Registro com Tópico marca o Tópico como estudado", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { cicloId, materias } = await cicloCom(ana, ["TI"]);
    const ia = await criarTopico(db, ana, materias.TI, { nome: "IA" });
    await criarTopico(db, ana, materias.TI, { nome: "Redes" });
    await registrarEstudo(db, ana, materias.TI, { ...estudo, duracaoMinutos: 30, conteudoLivre: "algo" });
    await registrarEstudo(db, ana, materias.TI, { ...estudo, duracaoMinutos: 30 });
    expect((await obterMateria(db, ana, cicloId, materias.TI)).topicos.map((t) => t.estudado)).toEqual([false, false]);
    await registrarEstudo(db, ana, materias.TI, { ...estudo, duracaoMinutos: 30, topicoId: ia.id });
    expect((await obterMateria(db, ana, cicloId, materias.TI)).topicos.map((t) => t.estudado)).toEqual([true, false]);
    await expect(registrarEstudo(db, ana, materias.TI, { ...estudo, duracaoMinutos: 0, topicoId: (await criarTopico(db, ana, materias.TI, { nome: "SO" })).id })).rejects.toBeInstanceOf(ValidacaoError);
    expect((await obterMateria(db, ana, cicloId, materias.TI)).estudados).toBe(1); // o Registro recusado não marcou o "SO"
    await registrarEstudo(db, ana, materias.TI, { ...estudo, duracaoMinutos: 30, topicoId: ia.id }); // já marcado: continua
    expect((await obterMateria(db, ana, cicloId, materias.TI)).estudados).toBe(1);
  });

  it("registrar com Tópico e excluir o Tópico ao mesmo tempo nunca dá erro de banco", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { materias } = await cicloCom(ana, ["TI"]);
    for (let i = 0; i < 10; i++) {
      const { id } = await criarTopico(db, ana, materias.TI, { nome: `T${i}` });
      const [registro, exclusao] = await Promise.allSettled([registrarEstudo(db, ana, materias.TI, { ...estudo, duracaoMinutos: 10, topicoId: id }), excluirTopico(db, ana, id)]);
      expect(exclusao.status).toBe("fulfilled");
      if (registro.status === "rejected") expect(registro.reason).toBeInstanceOf(ValidacaoError); // perdeu a corrida: "Escolha um tópico desta matéria."
    }
  });

  it("o Ciclo traz estudados e total de Tópicos por Matéria", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { cicloId, materias } = await cicloCom(ana, ["TI", "Português"]);
    await importarTopicos(db, ana, materias.TI, { texto: "IA\nRedes\nSO" });
    const ia = (await obterMateria(db, ana, cicloId, materias.TI)).topicos[0];
    await registrarEstudo(db, ana, materias.TI, { ...estudo, duracaoMinutos: 30, topicoId: ia.id });
    const topicosPorMateria = async () => (await obterCiclo(db, ana, cicloId)).materias.map((m) => [m.nome, m.topicos]);
    expect(await topicosPorMateria()).toEqual([["TI", { estudados: 1, total: 3 }], ["Português", { estudados: 0, total: 0 }]]);
    await excluirTopico(db, ana, ia.id);
    await marcarTopico(db, ana, (await obterMateria(db, ana, cicloId, materias.TI)).topicos[0].id, true);
    expect((await topicosPorMateria())[0]).toEqual(["TI", { estudados: 1, total: 2 }]);
  });

  it("a Matéria com Tópicos não é descartada ao perder a última Etapa", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { cicloId, materias, etapas } = await cicloCom(ana, ["TI", "Português"]);
    await criarTopico(db, ana, materias.TI, { nome: "IA" });

    await removerEtapa(db, ana, etapas.TI);
    await removerEtapa(db, ana, etapas["Português"]);

    const restantes = await db.select({ id: materia.id }).from(materia);
    expect(restantes.map((m) => m.id)).toEqual([materias.TI]); // Português, sem Tópicos nem Registros, some como hoje
    expect((await obterCiclo(db, ana, cicloId)).materias).toEqual([]);

    const volta = await adicionarEtapa(db, ana, cicloId, { nome: "ti", cargaMinutos: 60 });
    expect(volta.materiaId).toBe(materias.TI);
    expect((await obterMateria(db, ana, cicloId, materias.TI)).topicos.map((t) => t.nome)).toEqual(["IA"]);
  });
});

describe("próxima revisão", () => {
  it("a Matéria traz a data de cada Tópico", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { cicloId, materias } = await cicloCom(ana, ["TI"]);
    const comData = (await criarTopico(db, ana, materias.TI, { nome: "Redes" })).id;
    const semQuestoes = (await criarTopico(db, ana, materias.TI, { nome: "IA" })).id;
    await criarTopico(db, ana, materias.TI, { nome: "SO" });
    await registrarEstudo(db, ana, materias.TI, { ...estudo, duracaoMinutos: 30, topicoId: comData, questoes: 20, acertos: 16 });
    await registrarEstudo(db, ana, materias.TI, { ...estudo, duracaoMinutos: 30, topicoId: semQuestoes });

    const { topicos } = await obterMateria(db, ana, cicloId, materias.TI);
    const dia = hojeEmBrasilia((await obterCartao(db, ana, comData))!.proximaRevisao!);
    expect(topicos.map((t) => [t.nome, t.proximaRevisao])).toEqual([["Redes", dia], ["IA", null], ["SO", null]]);
    expect(dia).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
