import { asc, eq, sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { criarCiclo, importarCiclo, obterCiclo, obterFaixas, obterMateria, type Usuario, ValidacaoError } from "@/casos-de-uso";
import { ciclo, etapa, materia, registroDeEstudo, topico, volta } from "@/db/schema";
import { bancoDeTeste, cadastrar, limparBanco } from "./apoio";

const db = bancoDeTeste();
beforeEach(() => limparBanco(db));
afterAll(() => db.$client.end());

/** O exemplo da spec (seção "Formato do arquivo"). */
function exemplo(): Record<string, unknown> {
  return {
    formato: "estudo-livre-ciclo",
    versao: 1,
    nome: "TRF 5 - Analista Judiciário",
    materias: [
      { nome: "Português", dificuldade: "media", questoesDaProva: 15, topicos: ["Crase", "Concordância verbal"] },
      { nome: "Direito Constitucional", dificuldade: "dificil", questoesDaProva: 20 },
    ],
    etapas: [
      { materia: "Direito Constitucional", cargaMinutos: 60 },
      { materia: "Português", cargaMinutos: 60 },
      { materia: "Direito Constitucional", cargaMinutos: 90 },
    ],
  };
}

const importar = (usuario: Usuario, arquivo: unknown) => importarCiclo(db, usuario, typeof arquivo === "string" ? arquivo : JSON.stringify(arquivo));

/** Tudo o que pende dos Ciclos do Usuário, para provar que uma recusa não criou nada. */
async function contagem(usuario: Usuario) {
  const doUsuario = eq(ciclo.usuarioId, usuario.id);
  const [c] = await db.select({ n: sql<number>`count(*)::int` }).from(ciclo).where(doUsuario);
  const [m] = await db.select({ n: sql<number>`count(*)::int` }).from(materia).innerJoin(ciclo, eq(ciclo.id, materia.cicloId)).where(doUsuario);
  const [e] = await db.select({ n: sql<number>`count(*)::int` }).from(etapa).innerJoin(ciclo, eq(ciclo.id, etapa.cicloId)).where(doUsuario);
  const [t] = await db.select({ n: sql<number>`count(*)::int` }).from(topico).innerJoin(materia, eq(materia.id, topico.materiaId)).innerJoin(ciclo, eq(ciclo.id, materia.cicloId)).where(doUsuario);
  const [v] = await db.select({ n: sql<number>`count(*)::int` }).from(volta).innerJoin(ciclo, eq(ciclo.id, volta.cicloId)).where(doUsuario);
  return { ciclos: c.n, materias: m.n, etapas: e.n, topicos: t.n, voltas: v.n };
}

async function recusa(usuario: Usuario, arquivo: unknown, mensagem: string) {
  const antes = await contagem(usuario);
  const erro = await importar(usuario, arquivo).catch((e: unknown) => e);
  expect(erro).toBeInstanceOf(ValidacaoError);
  expect((erro as Error).message).toBe(mensagem);
  expect(await contagem(usuario)).toEqual(antes);
}

/** O exemplo com uma alteração aplicada a uma cópia. */
function com(alterar: (a: Record<string, any>) => void) {
  const a = exemplo() as Record<string, any>;
  alterar(a);
  return a;
}

describe("importar ciclo", () => {
  it("cria o ciclo com matérias, etapas e tópicos do arquivo", async () => {
    const usuario = await cadastrar(db, "ana@exemplo.com");
    const { id } = await importar(usuario, exemplo());
    const detalhe = await obterCiclo(db, usuario, id);
    expect(detalhe.nome).toBe("TRF 5 - Analista Judiciário");
    expect(detalhe.arquivado).toBe(false);
    expect(detalhe.etapas.map((e) => [e.nome, e.cargaMinutos, e.posicao])).toEqual([
      ["Direito Constitucional", 60, 0],
      ["Português", 60, 1],
      ["Direito Constitucional", 90, 2],
    ]);
    const materias = await db.select().from(materia).where(eq(materia.cicloId, id)).orderBy(asc(materia.nome));
    expect(materias.map((m) => [m.nome, m.dificuldade, m.questoesDaProva])).toEqual([
      ["Direito Constitucional", "dificil", 20],
      ["Português", "media", 15],
    ]);
    const portugues = await obterMateria(db, usuario, id, materias[1].id);
    expect(portugues.topicos.map((t) => [t.nome, t.estudado])).toEqual([
      ["Crase", false],
      ["Concordância verbal", false],
    ]);
    expect((await obterMateria(db, usuario, id, materias[0].id)).topicos).toEqual([]);
  });

  it("deixa dificuldade e questões da prova sem valor quando ausentes", async () => {
    const usuario = await cadastrar(db, "ana@exemplo.com");
    const { id } = await importar(usuario, com((a) => (a.materias = [{ nome: "TI" }, { nome: "Lei 8.112", dificuldade: null, questoesDaProva: null }]) && (a.etapas = [{ materia: "TI", cargaMinutos: 30 }, { materia: "Lei 8.112", cargaMinutos: 30 }])));
    const materias = await db.select().from(materia).where(eq(materia.cicloId, id));
    expect(materias.map((m) => [m.dificuldade, m.questoesDaProva])).toEqual([
      [null, null],
      [null, null],
    ]);
  });

  it("abre o ciclo na volta 1 sem registros e com faixas padrão", async () => {
    const usuario = await cadastrar(db, "ana@exemplo.com");
    const { id } = await importar(usuario, exemplo());
    const voltas = await db.select().from(volta).where(eq(volta.cicloId, id));
    expect(voltas.map((v) => [v.numero, v.fim])).toEqual([[1, null]]);
    const registros = await db.select().from(registroDeEstudo).innerJoin(materia, eq(materia.id, registroDeEstudo.materiaId)).where(eq(materia.cicloId, id));
    expect(registros).toEqual([]);
    expect(await obterFaixas(db, usuario, id)).toMatchObject({ erreiAte: 60, dificilAte: 75, bomAte: 90, minimo: 5 });
  });

  it("mantém os ciclos que o usuário já tinha", async () => {
    const usuario = await cadastrar(db, "ana@exemplo.com");
    const { id: antigo } = await criarCiclo(db, usuario, { nome: "INSS" });
    const { id } = await importar(usuario, exemplo());
    const ciclos = await db.select({ id: ciclo.id, nome: ciclo.nome }).from(ciclo).where(eq(ciclo.usuarioId, usuario.id)).orderBy(asc(ciclo.criadoEm));
    expect(ciclos).toEqual([
      { id: antigo, nome: "INSS" },
      { id, nome: "TRF 5 - Analista Judiciário" },
    ]);
  });

  it("grava só na conta do usuário da sessão", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const bia = await cadastrar(db, "bia@exemplo.com");
    const { id } = await importar(ana, exemplo());
    const [linha] = await db.select({ usuarioId: ciclo.usuarioId }).from(ciclo).where(eq(ciclo.id, id));
    expect(linha.usuarioId).toBe(ana.id);
    expect((await contagem(bia)).ciclos).toBe(0);
  });

  it("liga a etapa à matéria sem diferenciar maiúsculas e tira espaços das pontas", async () => {
    const usuario = await cadastrar(db, "ana@exemplo.com");
    const { id } = await importar(usuario, com((a) => {
      a.nome = "  TRF 5  ";
      a.materias = [{ nome: " Português ", topicos: [" Crase "] }];
      a.etapas = [{ materia: "português", cargaMinutos: 60 }, { materia: " PORTUGUÊS ", cargaMinutos: 30 }];
    }));
    const detalhe = await obterCiclo(db, usuario, id);
    expect(detalhe.nome).toBe("TRF 5");
    expect(detalhe.etapas.map((e) => [e.nome, e.cargaMinutos])).toEqual([
      ["Português", 60],
      ["Português", 30],
    ]);
    expect((await obterMateria(db, usuario, id, detalhe.materias[0].id)).topicos.map((t) => t.nome)).toEqual(["Crase"]);
  });

  it("cria matéria só com tópicos, sem etapa", async () => {
    const usuario = await cadastrar(db, "ana@exemplo.com");
    const { id } = await importar(usuario, com((a) => a.materias.push({ nome: "Raciocínio Lógico", topicos: ["Proposições"] })));
    const materias = await db.select({ nome: materia.nome }).from(materia).where(eq(materia.cicloId, id));
    expect(materias.map((m) => m.nome)).toContain("Raciocínio Lógico");
    expect((await obterCiclo(db, usuario, id)).etapas).toHaveLength(3);
  });

  it("aceita listas vazias e cria o ciclo vazio", async () => {
    const usuario = await cadastrar(db, "ana@exemplo.com");
    const { id } = await importar(usuario, com((a) => ((a.materias = []), (a.etapas = []))));
    const detalhe = await obterCiclo(db, usuario, id);
    expect([detalhe.nome, detalhe.etapas, detalhe.materias, detalhe.volta.numero]).toEqual(["TRF 5 - Analista Judiciário", [], [], 1]);
  });

  it("importar duas vezes cria dois ciclos de mesmo nome", async () => {
    const usuario = await cadastrar(db, "ana@exemplo.com");
    await importar(usuario, exemplo());
    await importar(usuario, exemplo());
    expect(await contagem(usuario)).toEqual({ ciclos: 2, materias: 4, etapas: 6, topicos: 4, voltas: 2 });
  });

  it("ignora chaves que o formato não define", async () => {
    const usuario = await cadastrar(db, "ana@exemplo.com");
    const { id } = await importar(usuario, com((a) => {
      a.comentario = "gerado por IA";
      a.materias[0].peso = 3;
      a.etapas[0].observacao = "começar por aqui";
    }));
    expect((await obterCiclo(db, usuario, id)).etapas).toHaveLength(3);
  });
});

describe("recusar ciclo", () => {
  const casos: { caso: string; arquivo: unknown; mensagem: string }[] = [
    { caso: "arquivo que não é JSON", arquivo: "{ nome: TRF", mensagem: "O arquivo não é um JSON válido." },
    { caso: "raiz que não é objeto", arquivo: "[1, 2]", mensagem: 'O arquivo não é um ciclo do Estudo Livre: falta "formato": "estudo-livre-ciclo".' },
    { caso: "formato do backup", arquivo: com((a) => (a.formato = "estudo-livre")), mensagem: 'O arquivo não é um ciclo do Estudo Livre: falta "formato": "estudo-livre-ciclo".' },
    { caso: "versão desconhecida", arquivo: com((a) => (a.versao = 2)), mensagem: "Versão de ciclo desconhecida: 2." },
    { caso: "nome ausente", arquivo: com((a) => delete a.nome), mensagem: 'Informe o nome do ciclo em "nome".' },
    { caso: "nome vazio", arquivo: com((a) => (a.nome = "   ")), mensagem: 'Informe o nome do ciclo em "nome".' },
    { caso: "materias que não é lista", arquivo: com((a) => (a.materias = { nome: "TI" })), mensagem: '"materias" precisa ser uma lista.' },
    { caso: "etapas ausente", arquivo: com((a) => delete a.etapas), mensagem: '"etapas" precisa ser uma lista.' },
    { caso: "matéria sem nome", arquivo: com((a) => (a.materias[1] = { dificuldade: "facil" })), mensagem: "Matéria 2: informe o nome." },
    { caso: "matéria repetida", arquivo: com((a) => a.materias.push({ nome: "PORTUGUÊS" })), mensagem: 'Matéria "PORTUGUÊS" aparece mais de uma vez.' },
    { caso: "dificuldade inválida", arquivo: com((a) => (a.materias[0].dificuldade = "alta")), mensagem: 'Matéria "Português": dificuldade precisa ser "facil", "media" ou "dificil".' },
    { caso: "questões da prova fora do limite", arquivo: com((a) => (a.materias[1].questoesDaProva = 10_001)), mensagem: 'Matéria "Direito Constitucional": questoesDaProva precisa ser um inteiro de 1 a 10.000.' },
    { caso: "questões da prova fracionárias", arquivo: com((a) => (a.materias[1].questoesDaProva = 2.5)), mensagem: 'Matéria "Direito Constitucional": questoesDaProva precisa ser um inteiro de 1 a 10.000.' },
    { caso: "tópico vazio", arquivo: com((a) => (a.materias[0].topicos = ["Crase", ""])), mensagem: 'Matéria "Português", tópico 2: precisa ser um texto de 1 a 120 caracteres.' },
    { caso: "tópico longo demais", arquivo: com((a) => (a.materias[0].topicos = ["x".repeat(121)])), mensagem: 'Matéria "Português", tópico 1: precisa ser um texto de 1 a 120 caracteres.' },
    { caso: "tópico repetido", arquivo: com((a) => a.materias[0].topicos.push("crase")), mensagem: 'Matéria "Português": o tópico "crase" aparece mais de uma vez.' },
    { caso: "matéria sem etapa nem tópico", arquivo: com((a) => a.materias.push({ nome: "TI" })), mensagem: 'Matéria "TI": informe ao menos uma etapa ou um tópico.' },
    { caso: "etapa com matéria desconhecida", arquivo: com((a) => (a.etapas[2].materia = "Direito Penal")), mensagem: 'Etapa 3: a matéria "Direito Penal" não está em materias.' },
    { caso: "carga zero", arquivo: com((a) => (a.etapas[0].cargaMinutos = 0)), mensagem: "Etapa 1: cargaMinutos precisa ser um inteiro de 1 a 600.000." },
    { caso: "carga acima do limite", arquivo: com((a) => (a.etapas[1].cargaMinutos = 600_001)), mensagem: "Etapa 2: cargaMinutos precisa ser um inteiro de 1 a 600.000." },
    { caso: "mais de 50 matérias", arquivo: com((a) => ((a.materias = Array.from({ length: 51 }, (_, i) => ({ nome: `M${i}`, topicos: ["T"] }))), (a.etapas = []))), mensagem: "O ciclo aceita até 50 matérias." },
    { caso: "mais de 200 etapas", arquivo: com((a) => (a.etapas = Array.from({ length: 201 }, () => ({ materia: "Português", cargaMinutos: 30 })))), mensagem: "O ciclo aceita até 200 etapas." },
    { caso: "mais de 200 tópicos", arquivo: com((a) => (a.materias[0].topicos = Array.from({ length: 201 }, (_, i) => `T${i}`))), mensagem: 'Matéria "Português": até 200 tópicos.' },
    { caso: "vários problemas, mostra o primeiro", arquivo: com((a) => ((a.etapas[0].cargaMinutos = 0), (a.materias[1].dificuldade = "x"), (a.nome = ""))), mensagem: 'Informe o nome do ciclo em "nome".' },
    { caso: "matéria antes de etapa", arquivo: com((a) => ((a.etapas[0].cargaMinutos = 0), (a.materias[1].dificuldade = "x"))), mensagem: 'Matéria "Direito Constitucional": dificuldade precisa ser "facil", "media" ou "dificil".' },
    { caso: "tamanho antes de JSON", arquivo: "x".repeat(1024 * 1024 + 1), mensagem: "O arquivo passa de 1 MB." },
  ];

  it.each(casos)("recusa $caso sem criar nada", async ({ arquivo, mensagem }) => {
    const usuario = await cadastrar(db, "ana@exemplo.com");
    await criarCiclo(db, usuario, { nome: "INSS" });
    await recusa(usuario, arquivo, mensagem);
  });

  it("aceita arquivo de exatamente 1 MB", async () => {
    const usuario = await cadastrar(db, "ana@exemplo.com");
    const texto = JSON.stringify(exemplo());
    await importar(usuario, texto + " ".repeat(1024 * 1024 - Buffer.byteLength(texto)));
    expect((await contagem(usuario)).ciclos).toBe(1);
  });

  it("desfaz tudo quando a gravação falha no meio", async () => {
    const usuario = await cadastrar(db, "ana@exemplo.com");
    await criarCiclo(db, usuario, { nome: "INSS" });
    const antes = await contagem(usuario);
    // Os Tópicos são gravados depois do Ciclo, das Matérias e das Etapas: a falha neles tem de levar tudo junto.
    await db.execute(sql`create function falhar_topico() returns trigger language plpgsql as $$ begin raise exception 'falha simulada'; end $$`);
    await db.execute(sql`create trigger falhar_topico before insert on topico for each row execute function falhar_topico()`);
    try {
      await expect(importar(usuario, exemplo())).rejects.toThrow();
    } finally {
      await db.execute(sql`drop trigger falhar_topico on topico`);
      await db.execute(sql`drop function falhar_topico()`);
    }
    expect(await contagem(usuario)).toEqual(antes);
  });
});
