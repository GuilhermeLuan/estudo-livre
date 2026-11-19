import { sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  adicionarEtapa,
  arquivarCiclo,
  criarCiclo,
  criarTopico,
  editarRegistro,
  excluirRegistro,
  excluirTopico,
  importarTopicos,
  marcarTopico,
  obterCartao,
  recalcularTopico,
  renomearTopico,
  editarEtapa,
  obterFaixas,
  reiniciarVolta,
  removerEtapa,
  renomearCiclo,
  reordenarEtapas,
  salvarFaixas,
  iniciarCronometro,
  NaoEncontradoError,
  obterCiclo,
  obterEstatisticas,
  obterHome,
  listarRegistros,
  reativarCiclo,
  registrarEstudo,
  ValidacaoError,
} from "@/casos-de-uso";
import { ciclo, cronometro, registroDeEstudo } from "@/db/schema";
import { bancoDeTeste, cadastrar, limparBanco } from "./apoio";

const db = bancoDeTeste();
beforeEach(() => limparBanco(db));
afterAll(() => db.$client.end());

/** Um Usuário com um Ciclo de uma Matéria, um Tópico com Registro (e Cartão) e outro Ciclo vazio. */
async function cenario() {
  const usuario = await cadastrar(db, "ana@exemplo.com");
  const { id: cicloId } = await criarCiclo(db, usuario, { nome: "TRF" });
  const { materiaId } = await adicionarEtapa(db, usuario, cicloId, { nome: "Português", cargaMinutos: 600 });
  const { id: topicoId } = await criarTopico(db, usuario, materiaId, { nome: "Crase" });
  await registrarEstudo(db, usuario, materiaId, { duracaoMinutos: 60, tipo: "Exercícios", questoes: 10, acertos: 8, topicoId });
  const { id: outroId } = await criarCiclo(db, usuario, { nome: "INSS" });
  const { materiaId: outraMateriaId } = await adicionarEtapa(db, usuario, outroId, { nome: "Direito", cargaMinutos: 600 });
  return { usuario, cicloId, materiaId, topicoId, outroId, outraMateriaId };
}

const arquivadoEm = async (id: string) => (await db.select({ a: ciclo.arquivadoEm }).from(ciclo).where(sql`${ciclo.id} = ${id}`))[0].a;

/** Tudo o que arquivar e reativar não pode tocar: cada linha das tabelas do histórico, com as colunas todas. */
async function historico() {
  const tabelas = ["registro_de_estudo", "volta", "etapa", "materia", "topico", "cartao_de_revisao", "log_de_revisao"];
  const linhas = await Promise.all(tabelas.map((t) => db.execute(sql`select * from ${sql.identifier(t)} order by 1`)));
  const faixas = (await db.execute(sql`select id, nome, faixa_errei_ate, faixa_dificil_ate, faixa_bom_ate, minimo_de_questoes, criado_em from ciclo order by id`)).rows;
  return { tabelas: linhas.map((l) => l.rows), faixas };
}

describe("arquivar e reativar", () => {
  it("arquivar marca o Ciclo como arquivado", async () => {
    const { usuario, cicloId, outroId } = await cenario();
    await arquivarCiclo(db, usuario, cicloId);
    expect(await arquivadoEm(cicloId)).toBeInstanceOf(Date);
    expect(await arquivadoEm(outroId)).toBeNull();
    expect((await obterHome(db, usuario)).ciclos.map((c) => c.id)).toEqual([outroId]);
  });

  it("recusa arquivar com o Cronômetro do Ciclo ativo", async () => {
    const { usuario, cicloId, materiaId } = await cenario();
    await iniciarCronometro(db, usuario, materiaId);
    const erro = await arquivarCiclo(db, usuario, cicloId).catch((e) => e);
    expect(erro).toBeInstanceOf(ValidacaoError);
    expect(erro.message).toBe("Pare ou descarte o cronômetro antes de arquivar.");
    expect(await arquivadoEm(cicloId)).toBeNull();
  });

  it("arquiva com o Cronômetro de outro Ciclo", async () => {
    const { usuario, cicloId, outraMateriaId } = await cenario();
    await iniciarCronometro(db, usuario, outraMateriaId);
    await arquivarCiclo(db, usuario, cicloId);
    expect(await arquivadoEm(cicloId)).toBeInstanceOf(Date);
  });

  it("arquivar junto com iniciar o Cronômetro nunca deixa Cronômetro em Ciclo arquivado", async () => {
    const { usuario, cicloId, materiaId } = await cenario();
    for (let rodada = 0; rodada < 15; rodada++) {
      await Promise.allSettled([iniciarCronometro(db, usuario, materiaId), arquivarCiclo(db, usuario, cicloId)]);
      const rodando = (await db.select().from(cronometro)).length > 0;
      const arquivado = (await arquivadoEm(cicloId)) !== null;
      expect(rodando && arquivado).toBe(false);
      await db.delete(cronometro);
      await reativarCiclo(db, usuario, cicloId);
    }
  });

  it("arquivar e reativar não alteram o histórico", async () => {
    const { usuario, cicloId } = await cenario();
    const antes = await historico();
    expect(antes.tabelas[0]).toHaveLength(1);
    expect(antes.tabelas[5]).toHaveLength(1); // o Cartão existe
    await arquivarCiclo(db, usuario, cicloId);
    expect(await historico()).toEqual(antes);
    await reativarCiclo(db, usuario, cicloId);
    expect(await historico()).toEqual(antes);
  });

  it("arquivar duas vezes é idempotente", async () => {
    const { usuario, cicloId } = await cenario();
    await arquivarCiclo(db, usuario, cicloId);
    const primeira = await arquivadoEm(cicloId);
    await arquivarCiclo(db, usuario, cicloId);
    expect(await arquivadoEm(cicloId)).toEqual(primeira);
  });

  it("reativar duas vezes é idempotente", async () => {
    const { usuario, cicloId, outroId } = await cenario();
    await reativarCiclo(db, usuario, outroId); // ativo desde o início
    expect(await arquivadoEm(outroId)).toBeNull();
    await arquivarCiclo(db, usuario, cicloId);
    await reativarCiclo(db, usuario, cicloId);
    await reativarCiclo(db, usuario, cicloId);
    expect(await arquivadoEm(cicloId)).toBeNull();
  });

  it("ciclo de outro Usuário ou inexistente não é encontrado", async () => {
    const { cicloId } = await cenario();
    const bia = await cadastrar(db, "bia@exemplo.com", { cadastroAberto: true });
    for (const id of [cicloId, "nao-existe"]) {
      await expect(arquivarCiclo(db, bia, id)).rejects.toBeInstanceOf(NaoEncontradoError);
      await expect(reativarCiclo(db, bia, id)).rejects.toBeInstanceOf(NaoEncontradoError);
    }
    expect(await arquivadoEm(cicloId)).toBeNull();
  });

  it("reativar devolve o Ciclo à Hoje com a mesma Volta e o mesmo progresso", async () => {
    const { usuario, cicloId } = await cenario();
    const antes = await obterCiclo(db, usuario, cicloId);
    await arquivarCiclo(db, usuario, cicloId);
    await reativarCiclo(db, usuario, cicloId);
    expect(await arquivadoEm(cicloId)).toBeNull();
    expect(await obterCiclo(db, usuario, cicloId)).toEqual(antes);
    expect((await obterHome(db, usuario)).ciclos.map((c) => c.id)).toContain(cicloId);
    expect(antes.volta.numero).toBe(1);
    expect(antes.feitoMinutos).toBe(60);
  });
});

describe("leituras", () => {
  it("o Ciclo arquivado sai da Hoje e da Próxima etapa", async () => {
    const { usuario, cicloId, outroId, materiaId, outraMateriaId } = await cenario();
    const antes = await obterHome(db, usuario);
    expect(antes.ciclos.map((c) => c.id)).toEqual([cicloId, outroId]);
    expect(antes.ciclos[0].proxima?.materiaId).toBe(materiaId);
    await arquivarCiclo(db, usuario, cicloId);
    const depois = await obterHome(db, usuario);
    expect(depois.ciclos.map((c) => c.id)).toEqual([outroId]);
    expect(depois.ciclos[0].proxima?.materiaId).toBe(outraMateriaId);
    expect(depois.arquivados.map((c) => c.id)).toEqual([cicloId]);
  });

  it("a Hoje descreve cada arquivado com nome, Volta, Etapas e Matérias", async () => {
    const { usuario, cicloId, materiaId } = await cenario();
    await arquivarCiclo(db, usuario, cicloId);
    const [arquivado] = (await obterHome(db, usuario)).arquivados;
    expect(arquivado).toEqual({ id: cicloId, nome: "TRF", volta: 1, totalEtapas: 1, materias: [{ id: materiaId, nome: "Português" }] });
  });

  it("obterCiclo diz se o Ciclo está arquivado", async () => {
    const { usuario, cicloId } = await cenario();
    expect((await obterCiclo(db, usuario, cicloId)).arquivado).toBe(false);
    await arquivarCiclo(db, usuario, cicloId);
    expect((await obterCiclo(db, usuario, cicloId)).arquivado).toBe(true);
  });

  it("arquivados do mais recente ao mais antigo", async () => {
    const { usuario, cicloId, outroId } = await cenario();
    const { id: terceiro } = await criarCiclo(db, usuario, { nome: "TRT" });
    for (const id of [cicloId, outroId, terceiro]) await arquivarCiclo(db, usuario, id);
    const quando = { [cicloId]: "2026-05-02", [outroId]: "2026-05-03", [terceiro]: "2026-05-01" };
    for (const [id, dia] of Object.entries(quando)) await db.execute(sql`update ciclo set arquivado_em = ${dia + "T12:00:00Z"} where id = ${id}`);
    expect((await obterHome(db, usuario)).arquivados.map((c) => c.id)).toEqual([outroId, cicloId, terceiro]);
  });

  it("Registros e Estatísticas seguem contando o Ciclo arquivado", async () => {
    const { usuario, cicloId, materiaId } = await cenario();
    await arquivarCiclo(db, usuario, cicloId);
    expect((await listarRegistros(db, usuario, {})).total).toBe(1);
    expect((await listarRegistros(db, usuario, { cicloId })).total).toBe(1);
    const estatisticas = await obterEstatisticas(db, usuario);
    expect(estatisticas.ciclos.map((c) => c.id)).toContain(cicloId);
    expect(estatisticas.horasPorMateria.find((m) => m.id === materiaId)?.minutos).toBe(60);
    expect((await obterEstatisticas(db, usuario, { cicloId })).totalQuestoes).toBe(10);
  });

  it("indicadores da Hoje seguem somando o Ciclo arquivado", async () => {
    const { usuario, cicloId } = await cenario();
    const antes = (await obterHome(db, usuario)).indicadores;
    expect(antes.hojeMinutos).toBe(60);
    await arquivarCiclo(db, usuario, cicloId);
    const depois = (await obterHome(db, usuario)).indicadores;
    expect(depois).toEqual(antes);
    expect(depois.questoesHoje).toBe(10);
  });
});

const MENSAGEM = "Ciclo arquivado. Reative para alterar.";
const recusa = async (escrita: () => Promise<unknown>) => {
  const erro = (await escrita().catch((e) => e)) as Error;
  expect(erro).toBeInstanceOf(ValidacaoError);
  expect(erro.message).toBe(MENSAGEM);
};

describe("escritas no Ciclo arquivado", () => {
  it("Ciclo, Etapas, Volta e Faixas recusam a escrita", async () => {
    const { usuario, cicloId } = await cenario();
    const { etapas } = await obterCiclo(db, usuario, cicloId);
    const faixas = await obterFaixas(db, usuario, cicloId);
    await arquivarCiclo(db, usuario, cicloId);
    const antes = await historico();

    await recusa(() => renomearCiclo(db, usuario, cicloId, { nome: "Outro" }));
    await recusa(() => adicionarEtapa(db, usuario, cicloId, { nome: "Direito", cargaMinutos: 60 }));
    await recusa(() => editarEtapa(db, usuario, etapas[0].id, { nome: "Português", cargaMinutos: 30 }));
    await recusa(() => removerEtapa(db, usuario, etapas[0].id));
    await recusa(() => reordenarEtapas(db, usuario, cicloId, [etapas[0].id]));
    await recusa(() => reiniciarVolta(db, usuario, cicloId, 1));
    await recusa(() => salvarFaixas(db, usuario, cicloId, { ...faixas, minimo: 9 }));

    expect(await historico()).toEqual(antes);
    expect((await obterCiclo(db, usuario, cicloId)).nome).toBe("TRF");
    expect(await obterFaixas(db, usuario, cicloId)).toEqual(faixas);

    await reativarCiclo(db, usuario, cicloId);
    await renomearCiclo(db, usuario, cicloId, { nome: "Outro" });
    await salvarFaixas(db, usuario, cicloId, { ...faixas, minimo: 9 });
    expect((await obterFaixas(db, usuario, cicloId)).minimo).toBe(9);
    expect(await reiniciarVolta(db, usuario, cicloId, 1)).toEqual({ numero: 2 });
  });

  it("Tópicos recusam a escrita", async () => {
    const { usuario, cicloId, materiaId, topicoId } = await cenario();
    await arquivarCiclo(db, usuario, cicloId);
    const antes = await historico();
    await recusa(() => criarTopico(db, usuario, materiaId, { nome: "Pontuação" }));
    await recusa(() => importarTopicos(db, usuario, materiaId, { texto: "Acentuação\nVerbos" }));
    await recusa(() => renomearTopico(db, usuario, topicoId, { nome: "Crase 2" }));
    await recusa(() => marcarTopico(db, usuario, topicoId, false));
    await recusa(() => excluirTopico(db, usuario, topicoId));
    expect(await historico()).toEqual(antes);
  });

  it("Registro novo, troca de Matéria e Cronômetro recusam", async () => {
    const { usuario, cicloId, materiaId, outraMateriaId } = await cenario();
    await arquivarCiclo(db, usuario, cicloId);
    const antes = await historico();
    await recusa(() => registrarEstudo(db, usuario, materiaId, { duracaoMinutos: 30, tipo: "Teoria" }));
    await recusa(() => iniciarCronometro(db, usuario, materiaId));
    expect(await db.select().from(cronometro)).toEqual([]);
    // Mover o Registro do Ciclo ativo (outroId) para a Matéria do arquivado.
    const [{ id: novo }] = await db
      .insert(registroDeEstudo)
      .values({ materiaId: outraMateriaId, dataHora: new Date(), duracaoMinutos: 15, tipo: "Teoria" })
      .returning({ id: registroDeEstudo.id });
    await recusa(() => editarRegistro(db, usuario, novo, materiaId, { duracaoMinutos: 15, tipo: "Teoria" }));
    expect((await db.select().from(registroDeEstudo).where(sql`${registroDeEstudo.id} = ${novo}`))[0].materiaId).toBe(outraMateriaId);
    expect((await historico()).tabelas[0]).toHaveLength(antes.tabelas[0].length + 1); // só o Registro inserido à mão
  });

  it("editar e excluir Registros antigos continua permitido", async () => {
    const { usuario, cicloId, materiaId, topicoId, outraMateriaId } = await cenario();
    const [{ id: registroId }] = await db.select({ id: registroDeEstudo.id }).from(registroDeEstudo);
    await arquivarCiclo(db, usuario, cicloId);
    const antes = await obterCartao(db, usuario, topicoId);
    expect(antes).not.toBeNull();

    // Sem trocar a Matéria: o Registro muda e o Cartão é recalculado (8/10 = Bom, 10/10 = Fácil).
    await editarRegistro(db, usuario, registroId, materiaId, { duracaoMinutos: 90, tipo: "Exercícios", questoes: 10, acertos: 10, topicoId });
    const [editado] = await db.select().from(registroDeEstudo);
    expect(editado.duracaoMinutos).toBe(90);
    expect(editado.nota).toBe("Fácil");
    expect((await obterCartao(db, usuario, topicoId))?.proximaRevisao).not.toEqual(antes?.proximaRevisao);

    // Mover para uma Matéria de Ciclo ativo também vale.
    await editarRegistro(db, usuario, registroId, outraMateriaId, { duracaoMinutos: 90, tipo: "Exercícios" });
    expect((await db.select().from(registroDeEstudo))[0].materiaId).toBe(outraMateriaId);
    expect(await obterCartao(db, usuario, topicoId)).toBeNull();

    // Excluir o Registro que sustenta o Cartão o remove (ARQ-11: o Cartão é recalculado do zero).
    const { id: outroRegistro } = (await db.insert(registroDeEstudo).values({ materiaId, topicoId, dataHora: new Date(), duracaoMinutos: 20, tipo: "Teoria", questoes: 10, nota: "Bom" }).returning({ id: registroDeEstudo.id }))[0];
    await db.transaction((tx) => recalcularTopico(tx, topicoId));
    expect(await obterCartao(db, usuario, topicoId)).not.toBeNull();
    await excluirRegistro(db, usuario, outroRegistro);
    expect((await db.select().from(registroDeEstudo)).map((r) => r.id)).toEqual([registroId]);
    expect(await obterCartao(db, usuario, topicoId)).toBeNull();
  });
});
