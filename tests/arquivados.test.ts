import { sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  adicionarEtapa,
  arquivarCiclo,
  criarCiclo,
  criarTopico,
  iniciarCronometro,
  NaoEncontradoError,
  obterCiclo,
  reativarCiclo,
  registrarEstudo,
  ValidacaoError,
} from "@/casos-de-uso";
import { ciclo } from "@/db/schema";
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
    expect(antes.volta.numero).toBe(1);
    expect(antes.feitoMinutos).toBe(60);
  });
});
