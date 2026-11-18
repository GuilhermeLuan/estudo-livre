import { eq, sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { adicionarEtapa, criarCiclo, criarTopico, obterCartao, recalcularTopico, registrarEstudo, ValidacaoError } from "@/casos-de-uso";
import { cartaoDeRevisao, logDeRevisao, registroDeEstudo } from "@/db/schema";
import { hojeEmBrasilia } from "@/dia";
import { recalcularCartao, type Nota } from "@/revisao";
import { bancoDeTeste, cadastrar, limparBanco } from "./apoio";

const db = bancoDeTeste();
beforeEach(() => limparBanco(db));
afterAll(() => db.$client.end());

const meioDia = (dia: string) => new Date(`${dia}T12:00:00-03:00`);

/** Um Usuário com um Ciclo, uma Matéria e um Tópico. */
async function cenario(email = "ana@exemplo.com") {
  const usuario = await cadastrar(db, email);
  const { id: cicloId } = await criarCiclo(db, usuario, { nome: "TRF" });
  const { materiaId } = await adicionarEtapa(db, usuario, cicloId, { nome: "Português", cargaMinutos: 600 });
  const { id: topicoId } = await criarTopico(db, usuario, materiaId, { nome: "Crase" });
  return { usuario, cicloId, materiaId, topicoId };
}

async function inserir(materiaId: string, topicoId: string | null, dia: string, nota: Nota | null, extra: Partial<typeof registroDeEstudo.$inferInsert> = {}) {
  const [{ id }] = await db
    .insert(registroDeEstudo)
    .values({ materiaId, topicoId, dataHora: meioDia(dia), duracaoMinutos: 30, tipo: "Teoria", questoes: nota ? 10 : null, nota, ...extra })
    .returning({ id: registroDeEstudo.id });
  return id;
}

describe("recalcularTopico", () => {
  it("refaz o Cartão dos Registros com nota, em ordem cronológica e desempate por criação", async () => {
    const { usuario, materiaId, topicoId } = await cenario();
    await inserir(materiaId, topicoId, "2026-05-10", "Fácil");
    await inserir(materiaId, topicoId, "2026-05-01", "Bom");
    await inserir(materiaId, topicoId, "2026-05-10", "Errei"); // mesmo instante: vem depois do Fácil (criadoEm)
    await db.transaction((tx) => recalcularTopico(tx, topicoId));

    const esperado = recalcularCartao([
      { nota: "Bom", revisadoEm: meioDia("2026-05-01") },
      { nota: "Fácil", revisadoEm: meioDia("2026-05-10") },
      { nota: "Errei", revisadoEm: meioDia("2026-05-10") },
    ]);
    const cartao = await obterCartao(db, usuario, topicoId);
    expect(cartao?.proximaRevisao).toEqual(esperado.proximaRevisao);
    expect(cartao?.estado).toEqual(JSON.parse(JSON.stringify(esperado.estado)));
    const log = await db.select().from(logDeRevisao).where(eq(logDeRevisao.topicoId, topicoId)).orderBy(logDeRevisao.revisadoEm);
    expect(log.map((l) => l.nota)).toEqual(["Bom", "Fácil", "Errei"]);
  });

  it("com Registros e nenhuma nota o Cartão é vazio; sem Registros não há Cartão nem log", async () => {
    const { usuario, materiaId, topicoId } = await cenario();
    await db.transaction((tx) => recalcularTopico(tx, topicoId));
    expect(await obterCartao(db, usuario, topicoId)).toBeNull();

    await inserir(materiaId, topicoId, "2026-05-01", null);
    await db.transaction((tx) => recalcularTopico(tx, topicoId));
    expect(await obterCartao(db, usuario, topicoId)).toEqual({ proximaRevisao: null, estado: null });
    expect(await db.select().from(logDeRevisao)).toEqual([]);
  });
});

const estudo = { tipo: "Teoria", duracaoMinutos: 30 } as const;
const diaDaquiA = (dias: number) => hojeEmBrasilia(new Date(Date.now() + dias * 24 * 3600_000));
const registros = () => db.select().from(registroDeEstudo);

describe("cartão", () => {
  it("o primeiro registro de um Tópico cria o Cartão", async () => {
    const { usuario, materiaId, topicoId } = await cenario();
    expect(await obterCartao(db, usuario, topicoId)).toBeNull();
    await registrarEstudo(db, usuario, materiaId, { ...estudo, topicoId, questoes: 20, acertos: 16, dia: diaDaquiA(-3) });
    const cartao = await obterCartao(db, usuario, topicoId);
    expect(cartao?.proximaRevisao).toBeInstanceOf(Date);
  });

  it("primeiro registro sem questões cria o Cartão sem data", async () => {
    const { usuario, materiaId, topicoId } = await cenario();
    await registrarEstudo(db, usuario, materiaId, { ...estudo, topicoId });
    expect(await obterCartao(db, usuario, topicoId)).toEqual({ proximaRevisao: null, estado: null });
    await registrarEstudo(db, usuario, materiaId, { ...estudo, topicoId, questoes: 0, acertos: 0, nota: "Fácil" });
    expect(await obterCartao(db, usuario, topicoId)).toEqual({ proximaRevisao: null, estado: null });
  });

  it("registro sem questões não altera o Cartão", async () => {
    const { usuario, materiaId, topicoId } = await cenario();
    await registrarEstudo(db, usuario, materiaId, { ...estudo, topicoId, questoes: 20, acertos: 16, dia: diaDaquiA(-3) });
    const antes = await obterCartao(db, usuario, topicoId);
    await registrarEstudo(db, usuario, materiaId, { ...estudo, topicoId, dia: diaDaquiA(-1) });
    expect(await obterCartao(db, usuario, topicoId)).toEqual(antes);
    expect((await registros()).map((r) => r.nota).sort()).toEqual(["Bom", null]);
  });

  it("a nota é aplicada na data do registro", async () => {
    const { usuario, materiaId, topicoId } = await cenario();
    const dia = diaDaquiA(-10);
    await registrarEstudo(db, usuario, materiaId, { ...estudo, topicoId, questoes: 20, acertos: 20, dia });
    const esperado = recalcularCartao([{ nota: "Fácil", revisadoEm: meioDia(dia) }]);
    const cartao = await obterCartao(db, usuario, topicoId);
    expect(cartao?.proximaRevisao).toEqual(esperado.proximaRevisao);
  });
});

describe("nota", () => {
  it("questões no mínimo sugerem a nota das Faixas e aceitam a escolhida", async () => {
    const { usuario, materiaId, topicoId } = await cenario();
    await registrarEstudo(db, usuario, materiaId, { ...estudo, topicoId, questoes: 5, acertos: 4 }); // 80%
    await registrarEstudo(db, usuario, materiaId, { ...estudo, topicoId, questoes: 20, acertos: 16, nota: "Fácil" });
    await registrarEstudo(db, usuario, materiaId, { ...estudo, topicoId, questoes: 10, acertos: 5 }); // 50%
    expect((await registros()).map((r) => r.nota).sort()).toEqual(["Bom", "Errei", "Fácil"]);
  });

  it("abaixo do mínimo vale a nota escolhida", async () => {
    const { usuario, materiaId, topicoId } = await cenario();
    await registrarEstudo(db, usuario, materiaId, { ...estudo, topicoId, questoes: 4, acertos: 4, nota: "Difícil" });
    expect((await registros())[0].nota).toBe("Difícil");
    expect((await obterCartao(db, usuario, topicoId))?.proximaRevisao).toBeInstanceOf(Date);
  });

  it("abaixo do mínimo sem nota recusa e não grava nada", async () => {
    const { usuario, materiaId, topicoId } = await cenario();
    const tentativa = registrarEstudo(db, usuario, materiaId, { ...estudo, topicoId, questoes: 4, acertos: 4 });
    await expect(tentativa).rejects.toThrow(new ValidacaoError("Escolha a nota da revisão."));
    expect(await registros()).toEqual([]);
    expect(await db.select().from(cartaoDeRevisao)).toEqual([]);
  });

  it("recusa nota que não existe e descarta a nota sem Tópico ou sem questões", async () => {
    const { usuario, materiaId, topicoId } = await cenario();
    await expect(registrarEstudo(db, usuario, materiaId, { ...estudo, topicoId, questoes: 20, acertos: 16, nota: "Ótimo" as Nota })).rejects.toThrow(ValidacaoError);
    await registrarEstudo(db, usuario, materiaId, { ...estudo, questoes: 20, acertos: 16, nota: "Fácil" }); // sem Tópico
    await registrarEstudo(db, usuario, materiaId, { ...estudo, topicoId, nota: "Fácil" }); // sem questões
    expect((await registros()).map((r) => r.nota)).toEqual([null, null]);
  });

  it("usa as Faixas do Ciclo e o Mínimo dele", async () => {
    const { usuario, cicloId, materiaId, topicoId } = await cenario();
    await db.execute(sql`update ciclo set faixa_errei_ate = 50, faixa_dificil_ate = 70, faixa_bom_ate = 80, minimo_de_questoes = 2 where id = ${cicloId}`);
    await registrarEstudo(db, usuario, materiaId, { ...estudo, topicoId, questoes: 2, acertos: 2 }); // 100%
    await registrarEstudo(db, usuario, materiaId, { ...estudo, topicoId, questoes: 10, acertos: 8 }); // 80%: Fácil
    expect((await registros()).map((r) => r.nota)).toEqual(["Fácil", "Fácil"]);
  });
});
