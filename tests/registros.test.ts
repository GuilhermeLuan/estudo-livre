import { and, eq, isNull } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  adicionarEtapa,
  criarCiclo,
  criarTopico,
  editarRegistro,
  excluirRegistro,
  iniciarCronometro,
  listarRegistros,
  marcarTopico,
  NaoEncontradoError,
  obterCiclo,
  obterCronometro,
  obterHome,
  registrarEstudo,
  ValidacaoError,
} from "@/casos-de-uso";
import { materia, registroDeEstudo, topico, volta } from "@/db/schema";
import { hojeEmBrasilia } from "@/dia";
import { bancoDeTeste, cadastrar, limparBanco } from "./apoio";

const db = bancoDeTeste();
beforeEach(() => limparBanco(db));
afterAll(() => db.$client.end());

const estudo = { tipo: "Teoria" } as const;
const diaDaquiA = (dias: number) => hojeEmBrasilia(new Date(Date.now() + dias * 24 * 3600_000));

async function ciclo(usuario: { id: string }, nome: string, cargas: Record<string, number>) {
  const { id } = await criarCiclo(db, usuario, { nome });
  const materias: Record<string, string> = {};
  for (const [m, cargaMinutos] of Object.entries(cargas)) materias[m] = (await adicionarEtapa(db, usuario, id, { nome: m, cargaMinutos })).materiaId;
  return { id, materias };
}

async function feito(usuario: { id: string }, cicloId: string, nomeDaMateria: string) {
  return (await obterCiclo(db, usuario, cicloId)).materias.find((m) => m.nome === nomeDaMateria)?.feitoMinutos;
}

/** Faz da Volta 1 uma Volta fechada em `fim`: a Volta 2 abre nesse instante. */
async function fecharVolta1Em(cicloId: string, fim: Date) {
  await db.update(volta).set({ fim }).where(and(eq(volta.cicloId, cicloId), eq(volta.numero, 1)));
  await db.update(volta).set({ inicio: fim }).where(and(eq(volta.cicloId, cicloId), eq(volta.numero, 2)));
}

/** Um Ciclo cuja Volta 1 já fechou (Português 60 cumpridos) e a Volta 2 está aberta. */
async function cicloComVolta1Fechada(usuario: { id: string }) {
  const c = await ciclo(usuario, "TRF", { Português: 60 });
  await registrarEstudo(db, usuario, c.materias.Português, { ...estudo, duracaoMinutos: 60 });
  return c;
}

const ids = async (usuario: { id: string }, filtro = {}) => (await listarRegistros(db, usuario, filtro)).registros;

describe("histórico de registros", () => {
  it("lista do mais recente ao mais antigo, com Matéria, Ciclo, Volta, Tópico e o total", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const c = await ciclo(ana, "TRF", { Português: 600 });
    const { id: topicoId } = await criarTopico(db, ana, c.materias.Português, { nome: "Crase" });
    await registrarEstudo(db, ana, c.materias.Português, { ...estudo, duracaoMinutos: 70, dia: diaDaquiA(-2), questoes: 20, acertos: 16, topicoId });
    await registrarEstudo(db, ana, c.materias.Português, { ...estudo, duracaoMinutos: 30, dia: diaDaquiA(-1), conteudoLivre: "Verbos" });
    await registrarEstudo(db, ana, c.materias.Português, { ...estudo, duracaoMinutos: 10 });

    const { registros, total, temMais } = await listarRegistros(db, ana, {});

    expect(total).toBe(3);
    expect(temMais).toBe(false);
    expect(registros.map((r) => r.duracaoMinutos)).toEqual([10, 30, 70]);
    expect(registros[2]).toMatchObject({ materia: "Português", ciclo: "TRF", volta: 1, tipo: "Teoria", questoes: 20, acertos: 16, topico: "Crase", dia: diaDaquiA(-2) });
    expect(registros[1]).toMatchObject({ conteudoLivre: "Verbos", topico: null });
  });

  it("de duas datas iguais mostra primeiro o criado por último", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const c = await ciclo(ana, "TRF", { Português: 600 });
    await registrarEstudo(db, ana, c.materias.Português, { ...estudo, duracaoMinutos: 11, dia: diaDaquiA(-1) });
    await registrarEstudo(db, ana, c.materias.Português, { ...estudo, duracaoMinutos: 22, dia: diaDaquiA(-1) });
    expect((await ids(ana)).map((r) => r.duracaoMinutos)).toEqual([22, 11]);
  });

  it("devolve 25 por vez e avisa quando há mais", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const c = await ciclo(ana, "TRF", { Português: 6000 });
    for (let i = 0; i < 60; i++) await registrarEstudo(db, ana, c.materias.Português, { ...estudo, duracaoMinutos: 1 + i, dia: diaDaquiA(-(i % 30)) });

    const primeira = await listarRegistros(db, ana, {});
    expect([primeira.registros.length, primeira.total, primeira.temMais]).toEqual([25, 60, true]);
    const segunda = await listarRegistros(db, ana, { limite: 50 });
    expect([segunda.registros.length, segunda.temMais]).toEqual([50, true]);
    expect(segunda.registros.slice(0, 25).map((r) => r.id)).toEqual(primeira.registros.map((r) => r.id));
    const terceira = await listarRegistros(db, ana, { limite: 75 });
    expect([terceira.registros.length, terceira.temMais]).toEqual([60, false]);
  });

  it("um limite absurdo, zero, negativo ou fracionário não quebra a lista", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const c = await ciclo(ana, "TRF", { Português: 600 });
    await registrarEstudo(db, ana, c.materias.Português, { ...estudo, duracaoMinutos: 1 });
    for (const limite of [1e20, 0, -5, 1.5, Number.NaN]) expect((await listarRegistros(db, ana, { limite })).total).toBe(1);
  });

  it("com exatamente 25 registros não há mais", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const c = await ciclo(ana, "TRF", { Português: 6000 });
    for (let i = 0; i < 25; i++) await registrarEstudo(db, ana, c.materias.Português, { ...estudo, duracaoMinutos: 1 });
    const r = await listarRegistros(db, ana, {});
    expect([r.registros.length, r.temMais]).toEqual([25, false]);
  });

  it("filtra por Ciclo e por Matéria, com o total do filtro", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const a = await ciclo(ana, "TRF", { Português: 600, Direito: 600 });
    const b = await ciclo(ana, "INSS", { Português: 600 });
    await registrarEstudo(db, ana, a.materias.Português, { ...estudo, duracaoMinutos: 1 });
    await registrarEstudo(db, ana, a.materias.Direito, { ...estudo, duracaoMinutos: 2 });
    await registrarEstudo(db, ana, b.materias.Português, { ...estudo, duracaoMinutos: 4 });

    expect((await listarRegistros(db, ana, { cicloId: a.id })).total).toBe(2);
    const daMateria = await listarRegistros(db, ana, { cicloId: a.id, materiaId: a.materias.Direito });
    expect([daMateria.total, daMateria.registros.map((r) => r.duracaoMinutos)]).toEqual([1, [2]]);
    expect((await ids(ana, { materiaId: b.materias.Português })).map((r) => r.ciclo)).toEqual(["INSS"]);
    // A Matéria é de outro Ciclo: nada casa.
    expect((await listarRegistros(db, ana, { cicloId: b.id, materiaId: a.materias.Direito })).total).toBe(0);
  });

  it("ids de outro Usuário ou inexistentes não mostram nada, e os Registros dele nunca aparecem", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const bia = await cadastrar(db, "bia@exemplo.com");
    const c = await ciclo(ana, "TRF", { Português: 600 });
    await registrarEstudo(db, ana, c.materias.Português, { ...estudo, duracaoMinutos: 5 });

    expect((await listarRegistros(db, bia, {})).total).toBe(0);
    expect((await listarRegistros(db, bia, { cicloId: c.id })).registros).toEqual([]);
    expect((await listarRegistros(db, bia, { materiaId: c.materias.Português })).registros).toEqual([]);
    expect((await listarRegistros(db, ana, { cicloId: "nao-existe" })).total).toBe(0);
  });

  it("a Volta do Registro é a que contém a data dele em (início, fim]", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const c = await cicloComVolta1Fechada(ana);
    // Volta 1 fechada em 10/11/2026 às 15:00 (Brasília).
    await fecharVolta1Em(c.id, new Date("2026-11-10T15:00:00-03:00"));
    for (const [dia, minutos] of [["2026-09-05", 1], ["2026-11-10", 2], ["2026-11-11", 3]] as const)
      await registrarEstudo(db, ana, c.materias.Português, { ...estudo, duracaoMinutos: minutos, dia });
    const voltas = Object.fromEntries((await ids(ana)).filter((r) => r.duracaoMinutos < 10).map((r) => [r.dia, r.volta]));
    expect(voltas).toEqual({ "2026-09-05": 1, "2026-11-10": 1, "2026-11-11": 2 });
  });

  it("um Registro exatamente no instante do fechamento é da Volta que fecha; um milissegundo depois é da seguinte", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const c = await cicloComVolta1Fechada(ana);
    const fim = new Date("2026-11-10T18:00:00.000Z");
    await fecharVolta1Em(c.id, fim);
    await db.delete(registroDeEstudo);
    const { id: noFim } = await registrarEstudo(db, ana, c.materias.Português, { ...estudo, duracaoMinutos: 7 });
    const { id: depois } = await registrarEstudo(db, ana, c.materias.Português, { ...estudo, duracaoMinutos: 9 });
    await db.update(registroDeEstudo).set({ dataHora: fim }).where(eq(registroDeEstudo.id, noFim));
    await db.update(registroDeEstudo).set({ dataHora: new Date(fim.getTime() + 1) }).where(eq(registroDeEstudo.id, depois));
    expect(Object.fromEntries((await ids(ana)).map((r) => [r.duracaoMinutos, r.volta]))).toEqual({ 7: 1, 9: 2 });
  });
});

describe("editar registro", () => {
  async function umRegistro(opcoes: { cargas?: Record<string, number> } = {}) {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const c = await ciclo(ana, "TRF", opcoes.cargas ?? { Português: 600, Direito: 600 });
    const { id } = await registrarEstudo(db, ana, c.materias.Português, { ...estudo, duracaoMinutos: 60, dia: diaDaquiA(-3) });
    return { ana, c, id };
  }

  it("grava os valores novos e a lista mostra a linha atualizada na posição da nova data", async () => {
    const { ana, c, id } = await umRegistro();
    await registrarEstudo(db, ana, c.materias.Português, { ...estudo, duracaoMinutos: 5, dia: diaDaquiA(-2) });

    await editarRegistro(db, ana, id, c.materias.Português, { tipo: "Exercícios", duracaoMinutos: 90, dia: diaDaquiA(-1), questoes: 10, acertos: 7, anotacao: "revisar", conteudoLivre: "Crase" });

    const lista = await ids(ana);
    expect(lista[0]).toMatchObject({ id, tipo: "Exercícios", duracaoMinutos: 90, dia: diaDaquiA(-1), questoes: 10, acertos: 7, anotacao: "revisar", conteudoLivre: "Crase" });
    expect(await feito(ana, c.id, "Português")).toBe(95);
  });

  it("trocar a Matéria move as horas para o outro Ciclo e só aceita Tópico da nova Matéria", async () => {
    const { ana, c, id } = await umRegistro();
    const outro = await ciclo(ana, "INSS", { Redes: 600 });
    const { id: topicoNovo } = await criarTopico(db, ana, outro.materias.Redes, { nome: "TCP" });
    const { id: topicoAntigo } = await criarTopico(db, ana, c.materias.Português, { nome: "Crase" });

    await expect(editarRegistro(db, ana, id, outro.materias.Redes, { ...estudo, duracaoMinutos: 60, topicoId: topicoAntigo })).rejects.toThrow("Escolha um tópico desta matéria.");
    expect(await feito(ana, c.id, "Português")).toBe(60);

    await editarRegistro(db, ana, id, outro.materias.Redes, { ...estudo, duracaoMinutos: 60, topicoId: topicoNovo });
    expect(await feito(ana, c.id, "Português")).toBe(0);
    expect(await feito(ana, outro.id, "Redes")).toBe(60);
    expect((await ids(ana))[0]).toMatchObject({ materia: "Redes", ciclo: "INSS", topico: "TCP" });
  });

  it("recusa Tópico de outro Usuário e Tópico com Conteúdo livre, sem gravar", async () => {
    const { ana, c, id } = await umRegistro();
    const bia = await cadastrar(db, "bia@exemplo.com");
    const cb = await ciclo(bia, "TRF", { Português: 600 });
    const { id: deBia } = await criarTopico(db, bia, cb.materias.Português, { nome: "Crase" });
    const { id: dela } = await criarTopico(db, ana, c.materias.Português, { nome: "Crase" });

    await expect(editarRegistro(db, ana, id, c.materias.Português, { ...estudo, duracaoMinutos: 99, topicoId: deBia })).rejects.toThrow("Escolha um tópico desta matéria.");
    await expect(editarRegistro(db, ana, id, c.materias.Português, { ...estudo, duracaoMinutos: 99, topicoId: dela, conteudoLivre: "x" })).rejects.toThrow("Escolha um tópico ou digite um conteúdo, não os dois.");
    expect((await ids(ana))[0].duracaoMinutos).toBe(60);
  });

  it("recusa acertos acima das questões e acertos sem questões", async () => {
    const { ana, c, id } = await umRegistro();
    const edit = (questoes: number | null, acertos: number | null) => editarRegistro(db, ana, id, c.materias.Português, { ...estudo, duracaoMinutos: 60, questoes, acertos });

    await expect(edit(20, 21)).rejects.toThrow("Os acertos não podem passar do total de questões.");
    await expect(edit(null, 3)).rejects.toThrow("Informe as questões para registrar os acertos.");
    expect((await ids(ana))[0]).toMatchObject({ questoes: null, acertos: null });
    await edit(20, 20);
    await edit(0, 0);
    expect((await ids(ana))[0]).toMatchObject({ questoes: 0, acertos: 0 });
  });

  it("recusa as mesmas entradas inválidas do registro e não grava", async () => {
    const { ana, c, id } = await umRegistro();
    const base = { ...estudo, duracaoMinutos: 60 };
    const casos: [object, string][] = [
      [{ duracaoMinutos: 0 }, "A duração precisa ter de 1 minuto a 24 horas."],
      [{ duracaoMinutos: 1441 }, "A duração precisa ter de 1 minuto a 24 horas."],
      [{ dia: diaDaquiA(1) }, "A data do estudo não pode estar no futuro."],
      [{ dia: "2026-02-30" }, "Informe uma data válida."],
      [{ tipo: "Outro" }, "Escolha um tipo de estudo."],
      [{ conteudoLivre: "x".repeat(201) }, "O conteúdo pode ter no máximo 200 caracteres."],
      [{ anotacao: "x".repeat(2001) }, "A anotação pode ter no máximo 2000 caracteres."],
      [{ questoes: 1001 }, "Questões precisa ser um número de 0 a 1000."],
    ];
    for (const [campo, mensagem] of casos) await expect(editarRegistro(db, ana, id, c.materias.Português, { ...base, ...campo } as never)).rejects.toThrow(mensagem);
    expect((await ids(ana))[0].duracaoMinutos).toBe(60);
  });

  it("mantém o instante se a data não muda, vira meio-dia no dia passado e o momento atual em hoje", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const c = await ciclo(ana, "TRF", { Português: 600 });
    const { id } = await registrarEstudo(db, ana, c.materias.Português, { ...estudo, duracaoMinutos: 30 });
    const antigo = new Date(`${hojeEmBrasilia()}T00:05:00-03:00`);
    await db.update(registroDeEstudo).set({ dataHora: antigo }).where(eq(registroDeEstudo.id, id));
    const instante = async () => (await db.select({ d: registroDeEstudo.dataHora }).from(registroDeEstudo).where(eq(registroDeEstudo.id, id)))[0].d.getTime();

    await editarRegistro(db, ana, id, c.materias.Português, { ...estudo, duracaoMinutos: 45, dia: hojeEmBrasilia() });
    expect(await instante()).toBe(antigo.getTime());

    await editarRegistro(db, ana, id, c.materias.Português, { ...estudo, duracaoMinutos: 45, dia: diaDaquiA(-5) });
    expect(await instante()).toBe(new Date(`${diaDaquiA(-5)}T12:00:00-03:00`).getTime());

    await db.update(registroDeEstudo).set({ dataHora: new Date(`${diaDaquiA(-5)}T12:00:00-03:00`) }).where(eq(registroDeEstudo.id, id));
    const antes = Date.now();
    await editarRegistro(db, ana, id, c.materias.Português, { ...estudo, duracaoMinutos: 45, dia: hojeEmBrasilia() });
    expect(await instante()).toBeGreaterThanOrEqual(antes);
    expect(await instante()).toBeLessThanOrEqual(Date.now());

    // Sem `dia`, o instante fica como está.
    const guardado = await instante();
    await editarRegistro(db, ana, id, c.materias.Português, { ...estudo, duracaoMinutos: 46 });
    expect(await instante()).toBe(guardado);
  });

  it("a edição que completa as Etapas da Volta aberta a fecha; a que reduz horas não reabre nada", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const c = await ciclo(ana, "TRF", { Português: 60 });
    const { id } = await registrarEstudo(db, ana, c.materias.Português, { ...estudo, duracaoMinutos: 20 });

    const resultado = await editarRegistro(db, ana, id, c.materias.Português, { ...estudo, duracaoMinutos: 60 });
    expect(resultado.voltaFechada).toBe(1);
    expect((await obterCiclo(db, ana, c.id)).volta.numero).toBe(2);

    // O Registro agora pertence à Volta 1 (fechada): reduzi-lo não reabre a Volta nem renumera.
    await db.update(registroDeEstudo).set({ dataHora: new Date(Date.now() - 3600_000) }).where(eq(registroDeEstudo.id, id));
    await db.update(volta).set({ fim: new Date(Date.now() - 1800_000) }).where(and(eq(volta.cicloId, c.id), eq(volta.numero, 1)));
    await db.update(volta).set({ inicio: new Date(Date.now() - 1800_000) }).where(and(eq(volta.cicloId, c.id), eq(volta.numero, 2)));
    const reduzida = await editarRegistro(db, ana, id, c.materias.Português, { ...estudo, duracaoMinutos: 5 });
    expect(reduzida.voltaFechada).toBeNull();
    const voltas = await db.select({ n: volta.numero, fim: volta.fim }).from(volta).where(eq(volta.cicloId, c.id)).orderBy(volta.numero);
    expect(voltas.map((v) => [v.n, v.fim === null])).toEqual([[1, false], [2, true]]);
  });

  it("recusa Registro excluído ou de outro Usuário sem gravar", async () => {
    const { ana, c, id } = await umRegistro();
    const bia = await cadastrar(db, "bia@exemplo.com");
    await expect(editarRegistro(db, bia, id, c.materias.Português, { ...estudo, duracaoMinutos: 99 })).rejects.toBeInstanceOf(NaoEncontradoError);
    await excluirRegistro(db, ana, id);
    await expect(editarRegistro(db, ana, id, c.materias.Português, { ...estudo, duracaoMinutos: 99 })).rejects.toBeInstanceOf(NaoEncontradoError);
    // Matéria de outro Usuário como destino.
    const { id: outroId } = await registrarEstudo(db, ana, c.materias.Português, { ...estudo, duracaoMinutos: 7 });
    const cb = await ciclo(bia, "TRF", { Português: 600 });
    await expect(editarRegistro(db, ana, outroId, cb.materias.Português, { ...estudo, duracaoMinutos: 99 })).rejects.toBeInstanceOf(NaoEncontradoError);
    expect((await ids(ana))[0].duracaoMinutos).toBe(7);
  });

  it("marca o Tópico novo como estudado e deixa o anterior e as marcas manuais como estão", async () => {
    const { ana, c, id } = await umRegistro();
    const { id: a } = await criarTopico(db, ana, c.materias.Português, { nome: "A" });
    const { id: b } = await criarTopico(db, ana, c.materias.Português, { nome: "B" });
    await editarRegistro(db, ana, id, c.materias.Português, { ...estudo, duracaoMinutos: 60, topicoId: a });
    await marcarTopico(db, ana, b, false);
    await editarRegistro(db, ana, id, c.materias.Português, { ...estudo, duracaoMinutos: 60, topicoId: b });
    const marcas = await db.select({ nome: topico.nome, estudado: topico.estudado }).from(topico).orderBy(topico.nome);
    expect(marcas).toEqual([{ nome: "A", estudado: true }, { nome: "B", estudado: true }]);
    // Uma edição recusada não marca nada.
    await marcarTopico(db, ana, a, false);
    await expect(editarRegistro(db, ana, id, c.materias.Português, { ...estudo, duracaoMinutos: 0, topicoId: a })).rejects.toBeInstanceOf(ValidacaoError);
    expect((await db.select({ e: topico.estudado }).from(topico).where(eq(topico.id, a)))[0].e).toBe(false);
  });
});

describe("excluir registro", () => {
  it("remove o Registro e tira horas, questões e acertos dos totais, mantendo Tópico estudado e Cronômetro", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const c = await ciclo(ana, "TRF", { Português: 600 });
    const { id: topicoId } = await criarTopico(db, ana, c.materias.Português, { nome: "Crase" });
    const { id } = await registrarEstudo(db, ana, c.materias.Português, { ...estudo, duracaoMinutos: 60, questoes: 10, acertos: 8, topicoId });
    await iniciarCronometro(db, ana, c.materias.Português);
    expect((await obterHome(db, ana)).indicadores).toMatchObject({ hojeMinutos: 60, questoesHoje: 10 });

    await excluirRegistro(db, ana, id);

    expect((await listarRegistros(db, ana, {})).total).toBe(0);
    expect(await feito(ana, c.id, "Português")).toBe(0);
    expect((await obterHome(db, ana)).indicadores).toMatchObject({ hojeMinutos: 0, questoesHoje: 0 });
    expect((await db.select({ e: topico.estudado }).from(topico))[0].e).toBe(true);
    expect(await obterCronometro(db, ana)).not.toBeNull();
  });

  it("excluir um Registro de Volta fechada não reabre a Volta nem muda a aberta", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const c = await cicloComVolta1Fechada(ana);
    const { id } = (await ids(ana))[0];
    await registrarEstudo(db, ana, c.materias.Português, { ...estudo, duracaoMinutos: 15 });
    const antes = await db.select().from(volta).where(eq(volta.cicloId, c.id)).orderBy(volta.numero);

    await excluirRegistro(db, ana, id);

    expect(await db.select().from(volta).where(eq(volta.cicloId, c.id)).orderBy(volta.numero)).toEqual(antes);
    expect(await feito(ana, c.id, "Português")).toBe(15);
  });

  it("recusa Registro já excluído ou de outro Usuário e não apaga nada", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const bia = await cadastrar(db, "bia@exemplo.com");
    const c = await ciclo(ana, "TRF", { Português: 600 });
    const { id } = await registrarEstudo(db, ana, c.materias.Português, { ...estudo, duracaoMinutos: 5 });
    await expect(excluirRegistro(db, bia, id)).rejects.toBeInstanceOf(NaoEncontradoError);
    expect((await listarRegistros(db, ana, {})).total).toBe(1);
    await excluirRegistro(db, ana, id);
    await expect(excluirRegistro(db, ana, id)).rejects.toBeInstanceOf(NaoEncontradoError);
  });
});

describe("registro retroativo e Volta", () => {
  it("um dia dentro de Volta fechada fica nela, não soma na aberta e não a reabre; um dia depois soma", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const c = await ciclo(ana, "TRF", { Português: 600 });
    await registrarEstudo(db, ana, c.materias.Português, { ...estudo, duracaoMinutos: 600 });
    await fecharVolta1Em(c.id, new Date("2026-11-10T15:00:00-03:00"));
    // As 600 horas do fechamento ficaram em hoje; a Volta 2 só valeria depois de 10/11.
    await db.delete(registroDeEstudo);
    expect(await feito(ana, c.id, "Português")).toBe(0);

    await registrarEstudo(db, ana, c.materias.Português, { ...estudo, duracaoMinutos: 90, dia: "2026-11-08" });
    expect(await feito(ana, c.id, "Português")).toBe(0);
    expect((await ids(ana))[0]).toMatchObject({ dia: "2026-11-08", volta: 1 });

    await registrarEstudo(db, ana, c.materias.Português, { ...estudo, duracaoMinutos: 90, dia: "2026-11-11" });
    expect(await feito(ana, c.id, "Português")).toBe(90);
    expect((await ids(ana))[0]).toMatchObject({ dia: "2026-11-11", volta: 2 });
    const [fechada] = await db.select({ fim: volta.fim }).from(volta).where(and(eq(volta.cicloId, c.id), eq(volta.numero, 1)));
    expect(fechada.fim?.toISOString()).toBe("2026-11-10T18:00:00.000Z");
    expect(await db.select().from(volta).where(and(eq(volta.cicloId, c.id), isNull(volta.fim)))).toHaveLength(1);
  });

  it("um dia passado dentro da Volta aberta soma ao progresso e, completando as Etapas, a fecha", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const c = await ciclo(ana, "TRF", { Português: 60 });
    const r = await registrarEstudo(db, ana, c.materias.Português, { ...estudo, duracaoMinutos: 60, dia: diaDaquiA(-4) });
    expect(r.voltaFechada).toBe(1);
    expect((await obterCiclo(db, ana, c.id)).volta.numero).toBe(2);
  });

  it("um dia passado dentro da Volta aberta soma exatamente as horas dele ao progresso", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const c = await ciclo(ana, "TRF", { Português: 600 });
    await registrarEstudo(db, ana, c.materias.Português, { ...estudo, duracaoMinutos: 25, dia: diaDaquiA(-4) });
    expect(await feito(ana, c.id, "Português")).toBe(25);
  });

  it("recusa data futura ao registrar e ao editar", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const c = await ciclo(ana, "TRF", { Português: 600 });
    const { id } = await registrarEstudo(db, ana, c.materias.Português, { ...estudo, duracaoMinutos: 5 });
    const futuro = diaDaquiA(1);
    await expect(registrarEstudo(db, ana, c.materias.Português, { ...estudo, duracaoMinutos: 5, dia: futuro })).rejects.toThrow("A data do estudo não pode estar no futuro.");
    await expect(editarRegistro(db, ana, id, c.materias.Português, { ...estudo, duracaoMinutos: 5, dia: futuro })).rejects.toThrow("A data do estudo não pode estar no futuro.");
  });

  it("recusa acertos acima das questões mesmo com data retroativa", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const c = await ciclo(ana, "TRF", { Português: 600 });
    await expect(registrarEstudo(db, ana, c.materias.Português, { ...estudo, duracaoMinutos: 5, dia: diaDaquiA(-9), questoes: 10, acertos: 11 })).rejects.toThrow("Os acertos não podem passar do total de questões.");
    expect((await listarRegistros(db, ana, {})).total).toBe(0);
  });
});

describe("progresso consistente", () => {
  it("editar e excluir mudam a Hoje e o Ciclo na próxima leitura", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const c = await ciclo(ana, "TRF", { Português: 600 });
    const { id } = await registrarEstudo(db, ana, c.materias.Português, { ...estudo, duracaoMinutos: 60 });
    expect((await obterHome(db, ana)).indicadores.hojeMinutos).toBe(60);

    await editarRegistro(db, ana, id, c.materias.Português, { ...estudo, duracaoMinutos: 60, dia: diaDaquiA(-1) });
    expect((await obterHome(db, ana)).indicadores.hojeMinutos).toBe(0);
    expect(await feito(ana, c.id, "Português")).toBe(60);

    await excluirRegistro(db, ana, id);
    expect(await feito(ana, c.id, "Português")).toBe(0);
  });

  it("mudanças simultâneas no mesmo Registro e entre dois Ciclos não dão erro 500 nem fecham a Volta duas vezes", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const a = await ciclo(ana, "A", { Português: 60 });
    const b = await ciclo(ana, "B", { Direito: 60 });
    const { id } = await registrarEstudo(db, ana, a.materias.Português, { ...estudo, duracaoMinutos: 30 });

    const dois = await Promise.allSettled([excluirRegistro(db, ana, id), excluirRegistro(db, ana, id)]);
    expect(dois.map((d) => d.status).sort()).toEqual(["fulfilled", "rejected"]);
    expect((dois.find((d) => d.status === "rejected") as PromiseRejectedResult).reason).toBeInstanceOf(NaoEncontradoError);

    const x = await registrarEstudo(db, ana, a.materias.Português, { ...estudo, duracaoMinutos: 10 });
    const y = await registrarEstudo(db, ana, b.materias.Direito, { ...estudo, duracaoMinutos: 10 });
    const cruzadas = await Promise.allSettled([
      editarRegistro(db, ana, x.id, b.materias.Direito, { ...estudo, duracaoMinutos: 50 }),
      editarRegistro(db, ana, y.id, a.materias.Português, { ...estudo, duracaoMinutos: 50 }),
    ]);
    expect(cruzadas.map((d) => d.status)).toEqual(["fulfilled", "fulfilled"]);
    const abertas = await db.select().from(volta).where(isNull(volta.fim));
    expect(abertas).toHaveLength(2);

    // Duas edições que completam a mesma Volta ao mesmo tempo: ela fecha uma só vez.
    const c2 = await ciclo(ana, "C", { Redes: 60 });
    const r1 = await registrarEstudo(db, ana, c2.materias.Redes, { ...estudo, duracaoMinutos: 10 });
    const r2 = await registrarEstudo(db, ana, c2.materias.Redes, { ...estudo, duracaoMinutos: 10 });
    const fechamentos = await Promise.all([
      editarRegistro(db, ana, r1.id, c2.materias.Redes, { ...estudo, duracaoMinutos: 60 }),
      editarRegistro(db, ana, r2.id, c2.materias.Redes, { ...estudo, duracaoMinutos: 60 }),
    ]);
    expect(fechamentos.filter((f) => f.voltaFechada === 1)).toHaveLength(1);
    expect((await obterCiclo(db, ana, c2.id)).volta.numero).toBe(2);
    expect(await db.select().from(materia)).toHaveLength(3);
  });
});
