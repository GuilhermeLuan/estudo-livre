import { asc, eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  adicionarEtapa,
  copiarMateria,
  criarCiclo,
  exportarBackup,
  importarBackup,
  obterCiclo,
  ValidacaoError,
} from "@/casos-de-uso";
import {
  erroDaNovaMateria,
  LISTA_CHEIA,
  minutosDeHoras,
  pesoDaMateria,
  QUESTOES_INVALIDAS,
  questoesDaProvaValidas,
  questoesDeTexto,
  sugerirEtapas,
  type MateriaParaSugerir,
} from "@/dominio";
import { ciclo, etapa, materia, volta } from "@/db/schema";
import { bancoDeTeste, cadastrar, limparBanco } from "./apoio";

const db = bancoDeTeste();
beforeEach(() => limparBanco(db));
afterAll(() => db.$client.end());

const M = (nome: string, questoesDaProva: number, dificuldade: MateriaParaSugerir["dificuldade"]): MateriaParaSugerir => ({ nome, questoesDaProva, dificuldade });

/** A lista do print do app Aprovado, na ordem em que foi digitada. */
const DO_PRINT = [
  M("Tecnologia da Informação - TI", 50, "dificil"),
  M("Estatística", 7, "dificil"),
  M("Língua Portuguesa", 15, "media"),
  M("Matemática", 5, "dificil"),
  M("Atualidades Mercado Financeiro", 5, "facil"),
  M("Conhecimentos Bancários", 7, "dificil"),
  M("Inglês", 5, "facil"),
];

const contar = (materias: MateriaParaSugerir[]) => {
  const etapas = sugerirEtapas(materias).map((e) => e.nome);
  return materias.map((m) => etapas.filter((n) => n === m.nome).length);
};

describe("pesos e Etapas (domínio)", () => {
  it("pesa a Matéria por questões vezes o fator da dificuldade", () => {
    expect(pesoDaMateria(M("A", 10, "facil"))).toBe(10);
    expect(pesoDaMateria(M("A", 10, "media"))).toBe(15);
    expect(pesoDaMateria(M("A", 10, "dificil"))).toBe(20);
  });

  it("dá peso dividido pelo menor peso em Etapas, arredondando meio para cima, entre 1 e 8", () => {
    // peso 2 (menor) e peso 3: 3 ÷ 2 = 1,5 → 2
    expect(contar([M("A", 2, "facil"), M("B", 2, "media")])).toEqual([1, 2]);
    // peso 2 e peso 5: 2,5 → 3
    expect(contar([M("A", 2, "facil"), M("B", 5, "facil")])).toEqual([1, 3]);
    // peso 100 contra 5: 20 → teto de 8
    expect(contar([M("A", 50, "dificil"), M("B", 5, "facil")])).toEqual([8, 1]);
    // uma só Matéria → 1; pesos iguais → o mesmo número
    expect(contar([M("A", 40, "dificil")])).toEqual([1]);
    expect(contar([M("A", 10, "media"), M("B", 15, "facil"), M("C", 10, "media")])).toEqual([1, 1, 1]);
    // bordas do arredondamento e do teto: 7 → 7; 7,5 → 8; 8,5 → 9 → teto 8
    expect(contar([M("A", 2, "facil"), M("B", 14, "facil"), M("C", 10, "media"), M("D", 17, "facil")])).toEqual([1, 7, 8, 8]);
    expect(sugerirEtapas([])).toEqual([]);
  });

  it("ordena as Etapas em rodadas do maior peso para o menor, empate pela ordem digitada", () => {
    const ti = "Tecnologia da Informação - TI";
    const lp = "Língua Portuguesa";
    const est = "Estatística";
    const banc = "Conhecimentos Bancários";
    const mat = "Matemática";
    const atu = "Atualidades Mercado Financeiro";
    const ing = "Inglês";
    expect(contar(DO_PRINT)).toEqual([8, 3, 5, 2, 1, 3, 1]);
    expect(sugerirEtapas(DO_PRINT).map((e) => e.nome)).toEqual([
      ...[ti, lp, est, banc, mat, atu, ing],
      ...[ti, lp, est, banc, mat],
      ...[ti, lp, est, banc],
      ...[ti, lp],
      ...[ti, lp],
      ...[ti, ti, ti],
    ]);
  });
});

describe("regras da lista (domínio)", () => {
  it("converte as horas digitadas em minutos, aceitando vírgula e ponto", () => {
    expect([minutosDeHoras("1"), minutosDeHoras("0,5"), minutosDeHoras("1.5"), minutosDeHoras(" 2 "), minutosDeHoras("10000"), minutosDeHoras("10001")]).toEqual([60, 30, 90, 120, 600_000, 600_060]);
    expect(minutosDeHoras("0")).toBe(0);
    expect([minutosDeHoras(""), minutosDeHoras("abc")].map((m) => (Number.isNaN(m) ? "NaN" : m))).toEqual([0, "NaN"]);
  });

  it("recusa nome de Matéria vazio, repetido ou lista cheia", () => {
    expect(erroDaNovaMateria([], "Língua Portuguesa")).toBeNull();
    expect(erroDaNovaMateria([], "   ")).toBe("Informe o nome da matéria.");
    expect(erroDaNovaMateria(["Estatística"], "estatística")).toBe("A matéria “estatística” já está na lista.");
    const cheia = Array.from({ length: 50 }, (_, i) => `Matéria ${i}`);
    expect(erroDaNovaMateria(cheia.slice(0, 49), "Nova")).toBeNull();
    expect(erroDaNovaMateria(cheia, "Nova")).toBe("A sugestão aceita até 50 matérias.");
  });

  it("aceita Questões da prova de 1 a 10.000 e recusa o resto", () => {
    expect([1, 10_000].map(questoesDaProvaValidas)).toEqual([true, true]);
    expect([0, -3, 7.5, 10_001, Number.NaN, "7", null, undefined].map(questoesDaProvaValidas)).toEqual(Array(8).fill(false));
    // o texto digitado na tela: só dígitos valem; vírgula, ponto de milhar, vazio e letras não
    const texto = (t: string) => questoesDaProvaValidas(questoesDeTexto(t));
    expect(["1", "50", " 7 ", "10000"].map(texto)).toEqual([true, true, true, true]);
    expect(["", "0", "7,5", "7.5", "-3", "10.000", "10001", "abc"].map(texto)).toEqual(Array(8).fill(false));
    expect(QUESTOES_INVALIDAS).toBe("Informe as questões da prova (inteiro de 1 a 10.000).");
  });
});

const quantos = async () => ({
  ciclos: (await db.select().from(ciclo)).length,
  voltas: (await db.select().from(volta)).length,
  materias: (await db.select().from(materia)).length,
  etapas: (await db.select().from(etapa)).length,
});
const NADA = { ciclos: 0, voltas: 0, materias: 0, etapas: 0 };

describe("criarCiclo com Matérias", () => {
  it("sem Matérias cria o Ciclo vazio com a Volta 1 aberta", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await criarCiclo(db, ana, { nome: "TRF" });
    const detalhe = await obterCiclo(db, ana, id);
    expect(detalhe.etapas).toEqual([]);
    expect(detalhe.materias).toEqual([]);
    expect(detalhe.volta.numero).toBe(1);
    expect(await quantos()).toEqual({ ciclos: 1, voltas: 1, materias: 0, etapas: 0 });
  });

  it("cria Ciclo, Volta 1, Matérias e Etapas sugeridas numa só operação", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await criarCiclo(db, ana, { nome: "Banco", duracaoEtapaMinutos: 60, materias: DO_PRINT });
    const [criado] = await db.select().from(ciclo).where(eq(ciclo.id, id));
    expect(criado.usuarioId).toBe(ana.id);
    const detalhe = await obterCiclo(db, ana, id);
    expect(detalhe.volta.numero).toBe(1);
    expect(detalhe.etapas.map((e) => e.nome)).toEqual(sugerirEtapas(DO_PRINT).map((e) => e.nome));
    expect(detalhe.etapas).toHaveLength(23);
    expect(detalhe.etapas.map((e) => e.posicao)).toEqual(Array.from({ length: 23 }, (_, i) => i));
    expect(new Set(detalhe.etapas.map((e) => e.cargaMinutos))).toEqual(new Set([60]));
    expect(detalhe.cargaMinutos).toBe(23 * 60);
    const gravadas = await db.select().from(materia).where(eq(materia.cicloId, id)).orderBy(asc(materia.nome));
    const porNome = (a: unknown[], b: unknown[]) => (a[0] === b[0] ? 0 : String(a[0]) < String(b[0]) ? -1 : 1);
    expect(gravadas.map((m) => [m.nome, m.dificuldade, m.questoesDaProva]).sort(porNome)).toEqual(
      DO_PRINT.map((m) => [m.nome, m.dificuldade, m.questoesDaProva]).sort(porNome),
    );
  });

  it("não deixa nada criado quando uma gravação falha", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    await expect(criarCiclo(db, ana, { nome: "Banco", materias: [M("Estatística", 7, "dificil"), M("estatística", 5, "facil")] })).rejects.toThrow(
      new ValidacaoError("A matéria “estatística” já está na lista."),
    );
    expect(await quantos()).toEqual(NADA);
    // Falha de verdade no meio da transação: o Postgres recusa o byte nulo no nome, depois de o Ciclo e a Volta entrarem.
    await expect(criarCiclo(db, ana, { nome: "Banco", materias: [M("Inglês", 5, "facil"), M("Ruim\u0000", 5, "facil")] })).rejects.toThrow();
    expect(await quantos()).toEqual(NADA);
  });

  it("ignora Etapas enviadas pelo cliente", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const dados = { nome: "Banco", materias: DO_PRINT, etapas: [{ nome: "Inventada", cargaMinutos: 1 }] };
    const { id } = await criarCiclo(db, ana, dados as never);
    const nomes = (await obterCiclo(db, ana, id)).etapas.map((e) => e.nome);
    expect(nomes).toEqual(sugerirEtapas(DO_PRINT).map((e) => e.nome));
    expect(nomes).not.toContain("Inventada");
  });

  it("recusa o nome do Ciclo vazio mesmo com Matérias", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    await expect(criarCiclo(db, ana, { nome: "  ", materias: DO_PRINT })).rejects.toThrow(new ValidacaoError("Informe o nome do ciclo."));
    expect(await quantos()).toEqual(NADA);
  });

  it("recusa Questões da prova inválidas no caso de uso sem gravar nada", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    for (const questoes of [0, -1, 7.5, 10_001, undefined as never]) {
      await expect(criarCiclo(db, ana, { nome: "Banco", materias: [M("Inglês", questoes, "facil")] })).rejects.toThrow(new ValidacaoError(QUESTOES_INVALIDAS));
    }
    await expect(criarCiclo(db, ana, { nome: "Banco", materias: [M("Inglês", 10_000, "facil")] })).resolves.toBeTruthy();
    expect(await quantos()).toMatchObject({ ciclos: 1, materias: 1 });
  });

  it("recusa mais de 50 Matérias e aceita 50", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const lista = (n: number) => Array.from({ length: n }, (_, i) => M(`Matéria ${i}`, 5, "media"));
    await expect(criarCiclo(db, ana, { nome: "Banco", materias: lista(51) })).rejects.toThrow(new ValidacaoError(LISTA_CHEIA));
    expect(await quantos()).toEqual(NADA);
    const { id } = await criarCiclo(db, ana, { nome: "Banco", materias: lista(50) });
    expect((await obterCiclo(db, ana, id)).etapas).toHaveLength(50);
  });

  it("aceita duração da Etapa de 30 minutos a 10.000 horas e recusa o resto", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const com = (duracaoEtapaMinutos: number) => criarCiclo(db, ana, { nome: "Banco", duracaoEtapaMinutos, materias: [M("Inglês", 5, "facil")] });
    const { id } = await com(30);
    expect((await obterCiclo(db, ana, id)).etapas.map((e) => e.cargaMinutos)).toEqual([30]);
    await expect(com(10_000 * 60)).resolves.toBeTruthy();
    const antes = await quantos();
    const mensagem = new ValidacaoError("A carga horária precisa ser maior que zero e no máximo 10.000 horas.");
    await expect(com(0)).rejects.toThrow(mensagem);
    await expect(com(10_001 * 60)).rejects.toThrow(mensagem);
    // a duração é conferida mesmo sem Matérias
    await expect(criarCiclo(db, ana, { nome: "Vazio", duracaoEtapaMinutos: 0 })).rejects.toThrow(mensagem);
    expect(await quantos()).toEqual(antes);
  });
});

const INVALIDO = "O arquivo não é um backup válido do Estudo Livre.";
const AGORA = new Date("2026-11-22T12:00:00Z");

/** Ana tem o Ciclo "Banco" (duas Matérias da sugestão) e o "Manual" (uma Matéria de Etapa manual). */
async function cenarioDoBackup() {
  const ana = await cadastrar(db, "ana@exemplo.com");
  await criarCiclo(db, ana, { nome: "Banco", materias: [M("Inglês", 5, "facil"), M("Estatística", 7, "dificil")] });
  const { id } = await criarCiclo(db, ana, { nome: "Manual" });
  await adicionarEtapa(db, ana, id, { nome: "Direito", cargaMinutos: 60 });
  return ana;
}
const exportar = async (usuario: { id: string }) => JSON.parse(JSON.stringify(await exportarBackup(db, usuario, AGORA)));
const materiasDoBackup = (backup: { ciclos: { nome: string; materias: { nome: string; dificuldade: unknown; questoesDaProva: unknown }[] }[] }) =>
  backup.ciclos.flatMap((c) => c.materias.map((m) => [c.nome, m.nome, m.dificuldade, m.questoesDaProva])).sort();

describe("backup e cópia", () => {
  it("exporta dificuldade e questoesDaProva de cada Matéria", async () => {
    const ana = await cenarioDoBackup();
    expect(materiasDoBackup(await exportar(ana))).toEqual(
      [["Banco", "Estatística", "dificil", 7], ["Banco", "Inglês", "facil", 5], ["Manual", "Direito", null, null]].sort(),
    );
  });

  it("importa de volta Dificuldade e Questões da prova iguais", async () => {
    const ana = await cenarioDoBackup();
    const arquivo = await exportar(ana);
    const bia = await cadastrar(db, "bia@exemplo.com");
    await importarBackup(db, bia, JSON.stringify(arquivo));
    expect(materiasDoBackup(await exportar(bia))).toEqual(materiasDoBackup(arquivo));
  });

  it("importa backup antigo sem os campos com os dois nulos", async () => {
    const ana = await cenarioDoBackup();
    const arquivo = await exportar(ana);
    for (const c of arquivo.ciclos) for (const m of c.materias) (delete m.dificuldade, delete m.questoesDaProva);
    const bia = await cadastrar(db, "bia@exemplo.com");
    await importarBackup(db, bia, JSON.stringify(arquivo));
    const reexportado = await exportar(bia);
    expect(materiasDoBackup(reexportado).every(([, , dificuldade, questoes]) => dificuldade === null && questoes === null)).toBe(true);
    expect(materiasDoBackup(reexportado)).toHaveLength(3);
  });

  it("recusa arquivo com Dificuldade ou Questões da prova inválidas sem substituir nada", async () => {
    const ana = await cenarioDoBackup();
    const bia = await cadastrar(db, "bia@exemplo.com");
    await criarCiclo(db, bia, { nome: "Do arquivo da Bia" });
    const nomesDeBia = async () => (await exportar(bia)).ciclos.map((c: { nome: string }) => c.nome);
    const com = async (campo: "dificuldade" | "questoesDaProva", valor: unknown) => {
      const arquivo = await exportar(ana);
      arquivo.ciclos[0].materias[0][campo] = valor;
      return JSON.stringify(arquivo);
    };
    for (const [campo, valor] of [["dificuldade", "dificil2"], ["questoesDaProva", 0], ["questoesDaProva", 2.5], ["questoesDaProva", "7"], ["questoesDaProva", 10_001]] as const) {
      await expect(importarBackup(db, bia, await com(campo, valor))).rejects.toThrow(new ValidacaoError(INVALIDO));
      expect(await nomesDeBia()).toEqual(["Do arquivo da Bia"]);
    }
    await expect(importarBackup(db, bia, await com("questoesDaProva", null))).resolves.toEqual({ ciclos: 2 });
  });

  it("copiar Matéria leva a Dificuldade e não as Questões da prova", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id: origem } = await criarCiclo(db, ana, { nome: "Origem", materias: [M("Estatística", 7, "dificil")] });
    const [{ id: origemId }] = await db.select({ id: materia.id }).from(materia).where(eq(materia.cicloId, origem));
    const { id: destino } = await criarCiclo(db, ana, { nome: "Destino" });
    const { materiaId } = await copiarMateria(db, ana, destino, { origemId, nome: "Estatística", cargaMinutos: 60 });
    const [copia] = await db.select().from(materia).where(eq(materia.id, materiaId));
    expect([copia.dificuldade, copia.questoesDaProva]).toEqual(["dificil", null]);
    const [intacta] = await db.select().from(materia).where(eq(materia.id, origemId));
    expect([intacta.dificuldade, intacta.questoesDaProva]).toEqual(["dificil", 7]);
  });

  it("Matéria criada por Etapa manual nasce sem Dificuldade nem Questões da prova", async () => {
    const ana = await cadastrar(db, "ana@exemplo.com");
    const { id } = await criarCiclo(db, ana, { nome: "Manual" });
    const { materiaId } = await adicionarEtapa(db, ana, id, { nome: "Direito", cargaMinutos: 60 });
    const [m] = await db.select().from(materia).where(eq(materia.id, materiaId));
    expect([m.dificuldade, m.questoesDaProva]).toEqual([null, null]);
  });
});
