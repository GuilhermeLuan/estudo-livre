import { sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  adicionarEtapa,
  arquivarCiclo,
  contarRevisoesVencidas,
  criarCiclo,
  criarTopico,
  excluirTopico,
  LIMITE_DO_CARTAO_DE_REVISOES,
  listarRevisoes,
  reativarCiclo,
  registrarEstudo,
} from "@/casos-de-uso";
import { cartaoDeRevisao, registroDeEstudo } from "@/db/schema";
import { hojeEmBrasilia, somarDias } from "@/dia";
import type { Nota } from "@/revisao";
import { bancoDeTeste, cadastrar, limparBanco } from "./apoio";

const db = bancoDeTeste();
beforeEach(() => limparBanco(db));
afterAll(() => db.$client.end());

const hoje = () => hojeEmBrasilia();
/** Meio-dia de Brasília do dia `n` dias a partir de hoje (negativo: no passado). */
const meioDia = (n: number) => new Date(`${somarDias(hoje(), n)}T12:00:00-03:00`);

type Usuario = { id: string };

/** Um Ciclo com uma Matéria e os Tópicos pedidos. */
async function ciclo(usuario: Usuario, nome: string, topicos: string[], materiaNome = "Português") {
  const { id: cicloId } = await criarCiclo(db, usuario, { nome });
  const { materiaId } = await adicionarEtapa(db, usuario, cicloId, { nome: materiaNome, cargaMinutos: 600 });
  const ids: string[] = [];
  for (const t of topicos) ids.push((await criarTopico(db, usuario, materiaId, { nome: t })).id);
  return { cicloId, materiaId, topicos: ids };
}

/** Grava o Cartão do Tópico com a próxima revisão no instante dado (nulo: Cartão sem data). */
async function cartao(topicoId: string, proximaRevisao: Date | null) {
  await db.insert(cartaoDeRevisao).values({ topicoId, proximaRevisao, estado: null });
}

async function registroComNota(materiaId: string, topicoId: string, n: number, nota: Nota | null, questoes: number | null, acertos: number | null) {
  await db.insert(registroDeEstudo).values({ materiaId, topicoId, dataHora: meioDia(n), duracaoMinutos: 30, tipo: "Exercícios", questoes, acertos, nota });
}

describe("revisões vencidas", () => {
  it("conta como vencida a Revisão com próxima data hoje ou antes", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { materiaId, cicloId, topicos } = await ciclo(ana, "TRT", ["Atrasado", "De hoje", "De amanhã"]);
    await cartao(topicos[0], meioDia(-2));
    await cartao(topicos[1], meioDia(0));
    await cartao(topicos[2], meioDia(1));

    const lista = await listarRevisoes(db, ana);

    expect(lista.vencidas.map((r) => [r.topico, r.diasDeAtraso])).toEqual([
      ["Atrasado", 2],
      ["De hoje", 0],
    ]);
    expect(lista.vencidas[0]).toMatchObject({ topicoId: topicos[0], materiaId, materia: "Português", cicloId, ciclo: "TRT", dia: somarDias(hoje(), -2) });
    expect(lista.totalVencidas).toBe(2);
    expect(await contarRevisoesVencidas(db, ana)).toBe(2);
  });

  it("Cartão sem data não aparece nem conta", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { topicos } = await ciclo(ana, "TRT", ["Sem data", "Com data"]);
    await cartao(topicos[0], null);
    await cartao(topicos[1], meioDia(0));

    const lista = await listarRevisoes(db, ana);

    expect(lista.vencidas.map((r) => r.topico)).toEqual(["Com data"]);
    expect(lista.proximas).toEqual([]);
    expect(lista.totalVencidasGeral).toBe(1);
    expect(await contarRevisoesVencidas(db, ana)).toBe(1);
  });

  it("classifica pelo dia de Brasília, não pelo de UTC", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { topicos } = await ciclo(ana, "TRT", ["Ainda hoje", "Já amanhã"]);
    // 23:30 de 09/03 em Brasília (já é 10/03 em UTC).
    const agora = new Date("2026-03-10T02:30:00Z");
    await cartao(topicos[0], new Date("2026-03-10T02:00:00Z")); // 23:00 de 09/03 em Brasília
    await cartao(topicos[1], new Date("2026-03-10T03:30:00Z")); // 00:30 de 10/03 em Brasília

    const lista = await listarRevisoes(db, ana, {}, agora);

    expect(lista.vencidas.map((r) => [r.topico, r.dia, r.diasDeAtraso])).toEqual([["Ainda hoje", "2026-03-09", 0]]);
    expect(lista.proximas.map((r) => [r.topico, r.dia, r.diasDeAtraso])).toEqual([["Já amanhã", "2026-03-10", -1]]);
    expect(await contarRevisoesVencidas(db, ana, agora)).toBe(1);
  });

  it("ordena do vencimento mais antigo ao mais novo, com desempate pelo nome do Tópico", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { topicos, materiaId } = await ciclo(ana, "TRT", ["Zebra", "Alfa", "Beta", "Gama", "Delta"]);
    await cartao(topicos[0], meioDia(-1)); // Zebra
    await cartao(topicos[1], meioDia(0)); // Alfa
    await cartao(topicos[2], meioDia(-3)); // Beta
    await cartao(topicos[3], meioDia(2)); // Gama
    await cartao(topicos[4], meioDia(-1)); // Delta, empata com Zebra
    const proximos = await criarTopico(db, ana, materiaId, { nome: "Sétimo" });
    const outro = await criarTopico(db, ana, materiaId, { nome: "Quarto" });
    const maisUm = await criarTopico(db, ana, materiaId, { nome: "Terceiro" });
    await cartao(proximos.id, meioDia(4)); // inseridos fora de ordem
    await cartao(outro.id, meioDia(2));
    await cartao(maisUm.id, meioDia(2)); // empata com Quarto

    const lista = await listarRevisoes(db, ana);

    expect(lista.vencidas.map((r) => r.topico)).toEqual(["Beta", "Delta", "Zebra", "Alfa"]);
    expect(lista.proximas.map((r) => r.topico)).toEqual(["Gama", "Quarto", "Terceiro", "Sétimo"]);
  });

  it("o limite devolve só as mais atrasadas e mantém o total completo", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { topicos } = await ciclo(ana, "TRT", ["A", "B", "C"]);
    await cartao(topicos[0], meioDia(-1));
    await cartao(topicos[1], meioDia(-5));
    await cartao(topicos[2], meioDia(-3));

    const lista = await listarRevisoes(db, ana, { limiteVencidas: 2 });

    expect(lista.vencidas.map((r) => r.topico)).toEqual(["B", "C"]);
    expect(lista.totalVencidas).toBe(3);
  });

  it("o limite devolve só as mais atrasadas e mantém o total completo, no limite do cartão", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const nomes = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"];
    const { topicos } = await ciclo(ana, "TRT", nomes);
    for (const [i, id] of topicos.entries()) await cartao(id, meioDia(-(i + 1)));

    const lista = await listarRevisoes(db, ana, { limiteVencidas: LIMITE_DO_CARTAO_DE_REVISOES });

    expect(LIMITE_DO_CARTAO_DE_REVISOES).toBe(6);
    expect(lista.vencidas.map((r) => r.topico)).toEqual(["T8", "T7", "T6", "T5", "T4", "T3"]);
    expect(lista.totalVencidas).toBe(8);
  });

  it("o filtro por Ciclo lista e conta só as Revisões do Ciclo", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const a = await ciclo(ana, "TRT", ["A1", "A2"]);
    const b = await ciclo(ana, "INSS", ["B1"], "Direito");
    await cartao(a.topicos[0], meioDia(-1));
    await cartao(a.topicos[1], meioDia(0));
    await cartao(b.topicos[0], meioDia(-4));

    const lista = await listarRevisoes(db, ana, { cicloId: a.cicloId });

    expect(lista.filtro).toBe(a.cicloId);
    expect(lista.vencidas.map((r) => r.topico)).toEqual(["A1", "A2"]);
    expect(lista.totalVencidas).toBe(2);
    expect(lista.totalVencidasGeral).toBe(3);
  });

  it("sem filtro lista as de todos os Ciclos ativos", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const a = await ciclo(ana, "TRT", ["A1"]);
    const b = await ciclo(ana, "INSS", ["B1"], "Direito");
    await cartao(a.topicos[0], meioDia(-1));
    await cartao(b.topicos[0], meioDia(-4));

    const lista = await listarRevisoes(db, ana);

    expect(lista.filtro).toBeNull();
    expect(lista.vencidas.map((r) => r.topico)).toEqual(["B1", "A1"]);
    expect(lista.ciclos.map((c) => c.nome)).toEqual(["TRT", "INSS"]);
  });

  it("um Ciclo desconhecido, de outro Usuário ou arquivado vale Todos", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const bia = await cadastrar(db, "bia@exemplo.com");
    const a = await ciclo(ana, "TRT", ["A1"]);
    const arquivado = await ciclo(ana, "Velho", ["V1"], "Direito");
    const deBia = await ciclo(bia, "Dela", ["D1"]);
    await cartao(a.topicos[0], meioDia(-1));
    await cartao(arquivado.topicos[0], meioDia(-1));
    await cartao(deBia.topicos[0], meioDia(-1));
    await arquivarCiclo(db, ana, arquivado.cicloId);

    for (const cicloId of ["nao-existe", deBia.cicloId, arquivado.cicloId, "", null]) {
      const lista = await listarRevisoes(db, ana, { cicloId });
      expect(lista.filtro).toBeNull();
      expect(lista.vencidas.map((r) => r.topico)).toEqual(["A1"]);
    }
  });

  it("os próximos 7 dias vão de amanhã a hoje mais 7, inclusive", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { topicos } = await ciclo(ana, "TRT", ["Hoje", "Amanhã", "Dia 7", "Dia 8"]);
    await cartao(topicos[0], meioDia(0));
    await cartao(topicos[1], meioDia(1));
    await cartao(topicos[2], meioDia(7));
    await cartao(topicos[3], meioDia(8));

    const lista = await listarRevisoes(db, ana);

    expect(lista.vencidas.map((r) => r.topico)).toEqual(["Hoje"]);
    expect(lista.proximas.map((r) => [r.topico, r.diasDeAtraso])).toEqual([
      ["Amanhã", -1],
      ["Dia 7", -7],
    ]);
    expect(lista.totalProximas).toBe(2);
  });

  it("traz última nota e acerto do Registro mais recente com nota", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { materiaId, topicos } = await ciclo(ana, "TRT", ["Crase"]);
    await cartao(topicos[0], meioDia(-1));
    await registroComNota(materiaId, topicos[0], -10, "Bom", 10, 9);
    await registroComNota(materiaId, topicos[0], -3, "Errei", 20, 8);
    await registroComNota(materiaId, topicos[0], -1, null, null, null); // o mais recente não gerou nota

    const [revisao] = (await listarRevisoes(db, ana)).vencidas;

    expect(revisao.ultimaNota).toBe("Errei");
    expect(revisao.acerto).toBe(40);
  });

  it("traz nulos sem Registro com nota", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { materiaId, topicos } = await ciclo(ana, "TRT", ["Crase", "Vírgula"]);
    await cartao(topicos[0], meioDia(-1));
    await cartao(topicos[1], meioDia(2));
    await registroComNota(materiaId, topicos[1], -1, null, null, null);

    const lista = await listarRevisoes(db, ana);

    expect(lista.vencidas[0]).toMatchObject({ ultimaNota: null, acerto: null });
    expect(lista.proximas[0]).toMatchObject({ ultimaNota: null, acerto: null });
  });

  it("o filtro vale nas duas seções e nos totais", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const a = await ciclo(ana, "TRT", ["A1", "A2"]);
    const b = await ciclo(ana, "INSS", ["B1", "B2"], "Direito");
    await cartao(a.topicos[0], meioDia(-1));
    await cartao(a.topicos[1], meioDia(3));
    await cartao(b.topicos[0], meioDia(0));
    await cartao(b.topicos[1], meioDia(4));

    const lista = await listarRevisoes(db, ana, { cicloId: b.cicloId });

    expect(lista.vencidas.map((r) => r.topico)).toEqual(["B1"]);
    expect(lista.proximas.map((r) => r.topico)).toEqual(["B2"]);
    expect([lista.totalVencidas, lista.totalProximas]).toEqual([1, 1]);
  });

  it("sem Ciclo ativo não há Revisão", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");

    expect(await listarRevisoes(db, ana)).toEqual({
      filtro: null,
      ciclos: [],
      vencidas: [],
      proximas: [],
      totalVencidas: 0,
      totalProximas: 0,
      totalVencidasGeral: 0,
    });
    expect(await contarRevisoesVencidas(db, ana)).toBe(0);
  });

  it("Revisões de outro Usuário não aparecem", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const bia = await cadastrar(db, "bia@exemplo.com");
    const deAna = await ciclo(ana, "TRT", ["Da Ana"]);
    const deBia = await ciclo(bia, "TRT", ["Da Bia"]);
    await cartao(deAna.topicos[0], meioDia(-1));
    await cartao(deBia.topicos[0], meioDia(-1));

    expect((await listarRevisoes(db, ana)).vencidas.map((r) => r.topico)).toEqual(["Da Ana"]);
    expect(await contarRevisoesVencidas(db, bia)).toBe(1);
  });

  it("excluir o Tópico tira a Revisão", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { topicos } = await ciclo(ana, "TRT", ["Crase", "Vírgula"]);
    await cartao(topicos[0], meioDia(-1));
    await cartao(topicos[1], meioDia(-1));

    await excluirTopico(db, ana, topicos[0]);

    expect((await listarRevisoes(db, ana)).vencidas.map((r) => r.topico)).toEqual(["Vírgula"]);
    expect(await contarRevisoesVencidas(db, ana)).toBe(1);
  });
});

describe("Ciclo arquivado", () => {
  it("as Revisões do Ciclo arquivado somem da lista e do total", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const a = await ciclo(ana, "TRT", ["A1"]);
    const b = await ciclo(ana, "INSS", ["B1", "B2"], "Direito");
    await cartao(a.topicos[0], meioDia(-1));
    await cartao(b.topicos[0], meioDia(-2));
    await cartao(b.topicos[1], meioDia(3));

    await arquivarCiclo(db, ana, b.cicloId);
    const lista = await listarRevisoes(db, ana);

    expect(lista.vencidas.map((r) => r.topico)).toEqual(["A1"]);
    expect(lista.proximas).toEqual([]);
    expect(lista.ciclos.map((c) => c.nome)).toEqual(["TRT"]);
    expect(lista.totalVencidasGeral).toBe(1);
    expect(await contarRevisoesVencidas(db, ana)).toBe(1);
  });

  it("reativar devolve as Revisões com as mesmas datas", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const b = await ciclo(ana, "INSS", ["B1", "B2"], "Direito");
    await cartao(b.topicos[0], meioDia(-2));
    await cartao(b.topicos[1], meioDia(3));
    const antes = await listarRevisoes(db, ana);

    await arquivarCiclo(db, ana, b.cicloId);
    expect((await listarRevisoes(db, ana)).vencidas).toEqual([]);
    await reativarCiclo(db, ana, b.cicloId);

    expect(await listarRevisoes(db, ana)).toEqual(antes);
    expect(antes.vencidas.map((r) => r.dia)).toEqual([somarDias(hoje(), -2)]);
    expect(antes.proximas.map((r) => r.dia)).toEqual([somarDias(hoje(), 3)]);
  });

  it("arquivar e reativar não alteram os Cartões", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const b = await ciclo(ana, "INSS", ["B1", "B2"], "Direito");
    await cartao(b.topicos[0], meioDia(-2));
    await cartao(b.topicos[1], meioDia(3));
    const cartoes = () => db.execute(sql`select * from cartao_de_revisao order by topico_id`).then((r) => r.rows);
    const antes = await cartoes();

    await arquivarCiclo(db, ana, b.cicloId);
    expect(await cartoes()).toEqual(antes);
    await reativarCiclo(db, ana, b.cicloId);
    expect(await cartoes()).toEqual(antes);
  });

  it("reativado depois da data, a Revisão volta vencida com o atraso até hoje", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const b = await ciclo(ana, "INSS", ["B1"], "Direito");
    await cartao(b.topicos[0], meioDia(3));
    await arquivarCiclo(db, ana, b.cicloId);
    await reativarCiclo(db, ana, b.cicloId);
    const dezDiasDepois = new Date(Date.now() + 10 * 86_400_000);

    const lista = await listarRevisoes(db, ana, {}, dezDiasDepois);

    expect(lista.vencidas.map((r) => [r.topico, r.diasDeAtraso])).toEqual([["B1", 7]]);
    expect(lista.proximas).toEqual([]);
  });
});

describe("cumprir a Revisão", () => {
  /** Um Tópico com um Registro de 30 dias atrás nota Errei: o Cartão vence logo depois, e já está vencido. */
  async function vencido(ana: Usuario) {
    const c = await ciclo(ana, "TRT", ["Crase"]);
    await registrarEstudo(db, ana, c.materiaId, { duracaoMinutos: 30, tipo: "Exercícios", dia: somarDias(hoje(), -30), questoes: 10, acertos: 3, topicoId: c.topicos[0] });
    return c;
  }

  it("um Registro com questões tira a Revisão de Vencidas", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const c = await vencido(ana);
    expect((await listarRevisoes(db, ana)).vencidas.map((r) => r.topico)).toEqual(["Crase"]);

    await registrarEstudo(db, ana, c.materiaId, { duracaoMinutos: 30, tipo: "Exercícios", questoes: 10, acertos: 9, topicoId: c.topicos[0] });

    const lista = await listarRevisoes(db, ana);
    expect(lista.vencidas).toEqual([]);
    expect(await contarRevisoesVencidas(db, ana)).toBe(0);
  });

  it("um Registro sem questões mantém a Revisão em Vencidas", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const c = await vencido(ana);

    await registrarEstudo(db, ana, c.materiaId, { duracaoMinutos: 30, tipo: "Teoria", topicoId: c.topicos[0] });

    expect((await listarRevisoes(db, ana)).vencidas.map((r) => r.topico)).toEqual(["Crase"]);
    expect(await contarRevisoesVencidas(db, ana)).toBe(1);
  });
});
