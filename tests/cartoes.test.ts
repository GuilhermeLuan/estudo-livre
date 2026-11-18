import { eq, sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { adicionarEtapa, criarCiclo, criarTopico, editarRegistro, estimarProximaRevisao, excluirRegistro, excluirTopico, listarRegistros, NaoEncontradoError, obterCartao, recalcularTopico, registrarEstudo, ValidacaoError } from "@/casos-de-uso";
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
    const dia = diaDaquiA(-3);
    await registrarEstudo(db, usuario, materiaId, { ...estudo, topicoId, questoes: 20, acertos: 16, dia });
    const cartao = await obterCartao(db, usuario, topicoId);
    expect(cartao?.proximaRevisao).toEqual(recalcularCartao([{ nota: "Bom", revisadoEm: meioDia(dia) }]).proximaRevisao);
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
    const dia = diaDaquiA(-2);
    await registrarEstudo(db, usuario, materiaId, { ...estudo, topicoId, questoes: 4, acertos: 4, nota: "Difícil", dia });
    expect((await registros())[0].nota).toBe("Difícil");
    expect((await obterCartao(db, usuario, topicoId))?.proximaRevisao).toEqual(recalcularCartao([{ nota: "Difícil", revisadoEm: meioDia(dia) }]).proximaRevisao);
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

/** O Cartão e o log que sairiam de lançar estas notas, um a um, na ordem. */
const reaplicado = (notas: { nota: Nota; dia: string }[]) => recalcularCartao(notas.map((n) => ({ nota: n.nota, revisadoEm: meioDia(n.dia) })));
const cartaoIgual = async (usuario: { id: string }, topicoId: string, notas: { nota: Nota; dia: string }[]) => {
  const esperado = reaplicado(notas);
  const cartao = await obterCartao(db, usuario, topicoId);
  expect(cartao?.proximaRevisao).toEqual(esperado.proximaRevisao);
  expect(cartao?.estado).toEqual(JSON.parse(JSON.stringify(esperado.estado)));
};

describe("recálculo", () => {
  it("criar, editar e excluir dão o Cartão do recálculo do zero", async () => {
    const { usuario, materiaId, topicoId } = await cenario();
    const [d1, d2, d3] = [diaDaquiA(-9), diaDaquiA(-6), diaDaquiA(-3)];
    await registrarEstudo(db, usuario, materiaId, { ...estudo, topicoId, questoes: 20, acertos: 16, dia: d1 });
    const { id } = await registrarEstudo(db, usuario, materiaId, { ...estudo, topicoId, questoes: 20, acertos: 10, dia: d2 });
    await registrarEstudo(db, usuario, materiaId, { ...estudo, topicoId, questoes: 20, acertos: 20, dia: d3 });
    await cartaoIgual(usuario, topicoId, [{ nota: "Bom", dia: d1 }, { nota: "Errei", dia: d2 }, { nota: "Fácil", dia: d3 }]);

    await editarRegistro(db, usuario, id, materiaId, { ...estudo, topicoId, questoes: 20, acertos: 18, dia: d2 });
    await cartaoIgual(usuario, topicoId, [{ nota: "Bom", dia: d1 }, { nota: "Fácil", dia: d2 }, { nota: "Fácil", dia: d3 }]);

    await excluirRegistro(db, usuario, id);
    await cartaoIgual(usuario, topicoId, [{ nota: "Bom", dia: d1 }, { nota: "Fácil", dia: d3 }]);
  });

  it("trocar Matéria ou Tópico recalcula os dois Cartões", async () => {
    const { usuario, cicloId, materiaId, topicoId } = await cenario();
    const { id: outroTopico } = await criarTopico(db, usuario, materiaId, { nome: "Pontuação" });
    const { materiaId: outraMateria } = await adicionarEtapa(db, usuario, cicloId, { nome: "Direito", cargaMinutos: 60 });
    const { id: topicoDaOutra } = await criarTopico(db, usuario, outraMateria, { nome: "Atos" });
    const d1 = diaDaquiA(-8);
    const d2 = diaDaquiA(-4);
    await registrarEstudo(db, usuario, materiaId, { ...estudo, topicoId, questoes: 20, acertos: 16, dia: d1 });
    const { id } = await registrarEstudo(db, usuario, materiaId, { ...estudo, topicoId, questoes: 20, acertos: 20, dia: d2 });

    await editarRegistro(db, usuario, id, materiaId, { ...estudo, topicoId: outroTopico, questoes: 20, acertos: 20, dia: d2 });
    await cartaoIgual(usuario, topicoId, [{ nota: "Bom", dia: d1 }]);
    await cartaoIgual(usuario, outroTopico, [{ nota: "Fácil", dia: d2 }]);

    await editarRegistro(db, usuario, id, outraMateria, { ...estudo, topicoId: topicoDaOutra, questoes: 20, acertos: 20, dia: d2 });
    expect(await obterCartao(db, usuario, outroTopico)).toBeNull();
    await cartaoIgual(usuario, topicoDaOutra, [{ nota: "Fácil", dia: d2 }]);
  });

  it("registro retroativo entra na ordem cronológica", async () => {
    const { usuario, materiaId, topicoId } = await cenario();
    const [antigo, recente] = [diaDaquiA(-12), diaDaquiA(-2)];
    await registrarEstudo(db, usuario, materiaId, { ...estudo, topicoId, questoes: 20, acertos: 16, dia: recente });
    await registrarEstudo(db, usuario, materiaId, { ...estudo, topicoId, questoes: 20, acertos: 20, dia: antigo });
    await cartaoIgual(usuario, topicoId, [{ nota: "Fácil", dia: antigo }, { nota: "Bom", dia: recente }]);
  });

  it("excluir o último registro remove o Cartão e o log", async () => {
    const { usuario, materiaId, topicoId } = await cenario();
    const { id } = await registrarEstudo(db, usuario, materiaId, { ...estudo, topicoId, questoes: 20, acertos: 16 });
    expect(await db.select().from(logDeRevisao)).toHaveLength(1);
    await excluirRegistro(db, usuario, id);
    expect(await obterCartao(db, usuario, topicoId)).toBeNull();
    expect(await db.select().from(logDeRevisao)).toEqual([]);
  });

  it("editar para sem questões apaga a nota", async () => {
    const { usuario, materiaId, topicoId } = await cenario();
    const [d1, d2] = [diaDaquiA(-6), diaDaquiA(-3)];
    await registrarEstudo(db, usuario, materiaId, { ...estudo, topicoId, questoes: 20, acertos: 16, dia: d1 });
    const { id } = await registrarEstudo(db, usuario, materiaId, { ...estudo, topicoId, questoes: 20, acertos: 20, dia: d2 });
    await editarRegistro(db, usuario, id, materiaId, { ...estudo, topicoId, dia: d2, nota: "Fácil" });
    expect((await db.select().from(registroDeEstudo).where(eq(registroDeEstudo.id, id)))[0].nota).toBeNull();
    await cartaoIgual(usuario, topicoId, [{ nota: "Bom", dia: d1 }]);
  });

  it("excluir o Tópico remove Cartão e log e mantém os Registros", async () => {
    const { usuario, materiaId, topicoId } = await cenario();
    await registrarEstudo(db, usuario, materiaId, { ...estudo, topicoId, questoes: 20, acertos: 16 });
    await excluirTopico(db, usuario, topicoId);
    expect(await db.select().from(cartaoDeRevisao)).toEqual([]);
    expect(await db.select().from(logDeRevisao)).toEqual([]);
    expect(await registros()).toHaveLength(1);
  });

  it("Cartão e Registros de outro Usuário não mudam", async () => {
    const ana = await cenario("ana@exemplo.com");
    const bia = await cenario("bia@exemplo.com");
    const dia = diaDaquiA(-5);
    const { id } = await registrarEstudo(db, ana.usuario, ana.materiaId, { ...estudo, topicoId: ana.topicoId, questoes: 20, acertos: 16, dia });
    await registrarEstudo(db, bia.usuario, bia.materiaId, { ...estudo, topicoId: bia.topicoId, questoes: 20, acertos: 20, dia });

    await expect(editarRegistro(db, bia.usuario, id, bia.materiaId, { ...estudo, topicoId: bia.topicoId, questoes: 20, acertos: 0 })).rejects.toThrow(NaoEncontradoError);
    await expect(excluirRegistro(db, bia.usuario, id)).rejects.toThrow(NaoEncontradoError);
    expect(await obterCartao(db, bia.usuario, ana.topicoId)).toBeNull();
    await cartaoIgual(ana.usuario, ana.topicoId, [{ nota: "Bom", dia }]);
    await cartaoIgual(bia.usuario, bia.topicoId, [{ nota: "Fácil", dia }]);
  });
});

describe("log", () => {
  it("um item por registro com nota", async () => {
    const { usuario, materiaId, topicoId } = await cenario();
    const [d1, d2, d3] = [diaDaquiA(-9), diaDaquiA(-6), diaDaquiA(-3)];
    const a = await registrarEstudo(db, usuario, materiaId, { ...estudo, topicoId, questoes: 20, acertos: 16, dia: d1 });
    await registrarEstudo(db, usuario, materiaId, { ...estudo, topicoId, dia: d2 }); // sem questões: sem item
    const c = await registrarEstudo(db, usuario, materiaId, { ...estudo, topicoId, questoes: 20, acertos: 20, dia: d3 });
    const esperado = reaplicado([{ nota: "Bom", dia: d1 }, { nota: "Fácil", dia: d3 }]);

    const log = await db.select().from(logDeRevisao).where(eq(logDeRevisao.topicoId, topicoId)).orderBy(logDeRevisao.revisadoEm);
    expect(log.map((l) => [l.registroId, l.nota, l.revisadoEm])).toEqual([[a.id, "Bom", meioDia(d1)], [c.id, "Fácil", meioDia(d3)]]);
    expect(log.map((l) => [l.antes, l.depois])).toEqual(JSON.parse(JSON.stringify(esperado.log.map((i) => [i.antes, i.depois]))));
  });
});

describe("nota", () => {
  it("o histórico devolve a nota gravada do Registro", async () => {
    const { usuario, materiaId, topicoId } = await cenario();
    await registrarEstudo(db, usuario, materiaId, { ...estudo, topicoId, questoes: 20, acertos: 16, nota: "Fácil" });
    await registrarEstudo(db, usuario, materiaId, { ...estudo, topicoId });
    const { registros: lista } = await listarRegistros(db, usuario, {});
    expect(lista.map((r) => r.nota).sort()).toEqual(["Fácil", null]);
  });
});

describe("estimativa", () => {
  it("a data estimada é a do Cartão depois de salvar", async () => {
    const { usuario, materiaId, topicoId } = await cenario();
    const diaDoCartao = async () => hojeEmBrasilia((await obterCartao(db, usuario, topicoId))!.proximaRevisao!);
    await registrarEstudo(db, usuario, materiaId, { ...estudo, topicoId, questoes: 20, acertos: 16, dia: diaDaquiA(-9) });

    // Registro novo, hoje e retroativo.
    for (const [dia, acertos] of [[undefined, 20], [diaDaquiA(-5), 10], [diaDaquiA(-30), 20]] as const) {
      const rascunho = { materiaId, topicoId, dia, questoes: 20, acertos };
      const estimada = await estimarProximaRevisao(db, usuario, rascunho);
      await registrarEstudo(db, usuario, materiaId, { ...estudo, ...rascunho });
      expect(estimada).toBe(await diaDoCartao());
    }

    // Edição: o rascunho substitui o Registro.
    const { id } = await registrarEstudo(db, usuario, materiaId, { ...estudo, topicoId, questoes: 20, acertos: 16, dia: diaDaquiA(-2) });
    for (const dia of [diaDaquiA(-2), diaDaquiA(-7)]) {
      const rascunho = { materiaId, topicoId, dia, questoes: 20, acertos: 0, registroId: id };
      const estimada = await estimarProximaRevisao(db, usuario, rascunho);
      await editarRegistro(db, usuario, id, materiaId, { ...estudo, ...rascunho });
      expect(estimada).toBe(await diaDoCartao());
    }
  });

  it("sem Tópico ou sem data não há estimativa", async () => {
    const { usuario, materiaId, topicoId } = await cenario();
    const antes = await registros();
    expect(await estimarProximaRevisao(db, usuario, { materiaId, questoes: 20, acertos: 16 })).toBeNull(); // sem Tópico
    expect(await estimarProximaRevisao(db, usuario, { materiaId, topicoId })).toBeNull(); // Cartão sem data
    expect(await estimarProximaRevisao(db, usuario, { materiaId, topicoId, questoes: 4, acertos: 4 })).toBeNull(); // faltou a nota
    expect(await estimarProximaRevisao(db, usuario, { materiaId, topicoId, questoes: 4, acertos: 4, nota: "Bom" })).not.toBeNull();
    expect(await registros()).toEqual(antes);
    expect(await db.select().from(cartaoDeRevisao)).toEqual([]);
    expect(await db.select().from(logDeRevisao)).toEqual([]);
  });
});
