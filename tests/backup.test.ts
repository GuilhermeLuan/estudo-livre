import { asc, eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  adicionarEtapa,
  importarBackup,
  obterCartao,
  obterCiclo,
  obterEstatisticas,
  obterMateria,
  ValidacaoError,
  arquivarCiclo,
  criarCiclo,
  criarTopico,
  exportarBackup,
  iniciarCronometro,
  marcarTopico,
  nomeDoArquivoDeBackup,
  registrarEstudo,
  reiniciarVolta,
  salvarFaixas,
} from "@/casos-de-uso";
import { ciclo, materia, topico } from "@/db/schema";
import { bancoDeTeste, cadastrar, limparBanco } from "./apoio";

const db = bancoDeTeste();
beforeEach(() => limparBanco(db));
afterAll(() => db.$client.end());

/** Ana tem o Ciclo TRF (duas Matérias, três Etapas, Volta 2 aberta, Tópicos com Registros e Cartão) e o INSS arquivado. */
async function cenario(email = "ana@exemplo.com") {
  const usuario = await cadastrar(db, email);
  const { id: trf } = await criarCiclo(db, usuario, { nome: "TRF" });
  await salvarFaixas(db, usuario, trf, { erreiAte: 50, dificilAte: 70, bomAte: 85, minimo: 3 });
  const { materiaId: portugues } = await adicionarEtapa(db, usuario, trf, { nome: "Português", cargaMinutos: 120 });
  const { materiaId: ti } = await adicionarEtapa(db, usuario, trf, { nome: "TI", cargaMinutos: 60 });
  await adicionarEtapa(db, usuario, trf, { nome: "Português", cargaMinutos: 90 });
  const { id: crase } = await criarTopico(db, usuario, portugues, { nome: "Crase" });
  const { id: virgula } = await criarTopico(db, usuario, portugues, { nome: "Vírgula" });
  await marcarTopico(db, usuario, virgula, true);
  await registrarEstudo(db, usuario, portugues, { dia: "2026-11-10", duracaoMinutos: 60, tipo: "Exercícios", questoes: 10, acertos: 8, topicoId: crase, anotacao: "boa" });
  await reiniciarVolta(db, usuario, trf, 1);
  await registrarEstudo(db, usuario, portugues, { dia: "2026-11-15", duracaoMinutos: 30, tipo: "Revisão", questoes: 10, acertos: 4, topicoId: crase });
  await registrarEstudo(db, usuario, ti, { dia: "2026-11-16", duracaoMinutos: 90, tipo: "Teoria", conteudoLivre: "Redes" });
  const { id: inss } = await criarCiclo(db, usuario, { nome: "INSS" });
  const { materiaId: direito } = await adicionarEtapa(db, usuario, inss, { nome: "Direito", cargaMinutos: 300 });
  await registrarEstudo(db, usuario, direito, { dia: "2026-11-12", duracaoMinutos: 45, tipo: "Leitura de lei" });
  await arquivarCiclo(db, usuario, inss);
  return { usuario, trf, inss, portugues, ti, crase, virgula, direito };
}

describe("exportar", () => {
  it("traz formato, versão e data da exportação", async () => {
    const { usuario } = await cenario();
    const agora = new Date("2026-11-22T15:30:00.000Z");
    const backup = await exportarBackup(db, usuario, agora);
    expect(backup.formato).toBe("estudo-livre");
    expect(backup.versao).toBe(1);
    expect(backup.exportadoEm).toBe("2026-11-22T15:30:00.000Z");
  });

  it("nomeia o arquivo com o dia de Brasília", () => {
    // 01:30 UTC do dia 23 ainda é dia 22 em Brasília.
    expect(nomeDoArquivoDeBackup(new Date("2026-11-23T01:30:00Z"))).toBe("estudo-livre-backup-2026-11-22.json");
    expect(nomeDoArquivoDeBackup(new Date("2026-11-23T03:30:00Z"))).toBe("estudo-livre-backup-2026-11-23.json");
  });

  it("inclui ciclos ativos e arquivados com tudo o que pende deles", async () => {
    const { usuario } = await cenario();
    const { ciclos } = JSON.parse(JSON.stringify(await exportarBackup(db, usuario)));
    expect(ciclos.map((c: { nome: string }) => c.nome)).toEqual(["TRF", "INSS"]);
    const [trf, inss] = ciclos;

    expect(trf.arquivadoEm).toBeNull();
    expect(Date.parse(inss.arquivadoEm)).not.toBeNaN();
    expect(Date.parse(trf.criadoEm)).not.toBeNaN();
    expect(trf.faixas).toEqual({ erreiAte: 50, dificilAte: 70, bomAte: 85 });
    expect(trf.minimoDeQuestoes).toBe(3);

    expect(trf.materias.map((m: { nome: string }) => m.nome)).toEqual(["Português", "TI"]);
    const [portugues, ti] = trf.materias;
    expect(portugues.topicos).toEqual([
      { id: expect.any(String), nome: "Crase", estudado: true, posicao: expect.any(Number) },
      { id: expect.any(String), nome: "Vírgula", estudado: true, posicao: expect.any(Number) },
    ]);
    expect(portugues.topicos[0].posicao).toBeLessThan(portugues.topicos[1].posicao);
    expect(ti.topicos).toEqual([]);

    expect(trf.etapas).toEqual([
      { materiaId: portugues.id, cargaMinutos: 120, posicao: expect.any(Number) },
      { materiaId: ti.id, cargaMinutos: 60, posicao: expect.any(Number) },
      { materiaId: portugues.id, cargaMinutos: 90, posicao: expect.any(Number) },
    ]);

    expect(trf.voltas).toHaveLength(2);
    expect(trf.voltas[0]).toMatchObject({ numero: 1, inicio: null });
    expect(Date.parse(trf.voltas[0].fim)).not.toBeNaN();
    expect(trf.voltas[1]).toEqual({ numero: 2, inicio: trf.voltas[0].fim, fim: null });

    const crase = portugues.topicos[0].id;
    expect(trf.registros).toEqual([
      {
        id: expect.any(String),
        materiaId: portugues.id,
        topicoId: crase,
        dataHora: "2026-11-10T15:00:00.000Z",
        duracaoMinutos: 60,
        tipo: "Exercícios",
        questoes: 10,
        acertos: 8,
        anotacao: "boa",
        nota: "Bom",
        conteudoLivre: null,
        criadoEm: expect.any(String),
      },
      expect.objectContaining({ materiaId: portugues.id, topicoId: crase, dataHora: "2026-11-15T15:00:00.000Z", duracaoMinutos: 30, tipo: "Revisão", questoes: 10, acertos: 4, nota: "Errei", anotacao: null }),
      expect.objectContaining({ materiaId: ti.id, topicoId: null, conteudoLivre: "Redes", duracaoMinutos: 90, tipo: "Teoria", questoes: null, acertos: null, nota: null }),
    ]);

    expect(trf.cartoes).toEqual([{ topicoId: crase, proximaRevisao: expect.any(String), estado: expect.any(Object) }]);
    expect(trf.logDeRevisao.map((l: { registroId: string; nota: string; topicoId: string }) => [l.topicoId, l.registroId, l.nota])).toEqual([
      [crase, trf.registros[0].id, "Bom"],
      [crase, trf.registros[1].id, "Errei"],
    ]);
    expect(trf.logDeRevisao[0]).toEqual({ topicoId: crase, registroId: trf.registros[0].id, nota: "Bom", revisadoEm: "2026-11-10T15:00:00.000Z", antes: expect.any(Object), depois: expect.any(Object) });

    expect(inss.materias.map((m: { nome: string }) => m.nome)).toEqual(["Direito"]);
    expect(inss.registros).toEqual([expect.objectContaining({ tipo: "Leitura de lei", duracaoMinutos: 45 })]);
  });

  it("omite cronômetro, sessões e dados da conta", async () => {
    const { usuario, ti } = await cenario();
    await iniciarCronometro(db, usuario, ti);
    const texto = JSON.stringify(await exportarBackup(db, usuario));
    expect(texto).not.toContain("ana@exemplo.com");
    expect(texto).not.toContain(usuario.id);
    for (const chave of ["cronometro", "acumuladoSegundos", "rodandoDesde", "session", "token", "senha", "password", "email", "admin", "usuarioId"])
      expect(texto.toLowerCase()).not.toContain(`"${chave.toLowerCase()}"`);
  });

  it("não inclui ciclos de outro usuário", async () => {
    await cenario("bia@exemplo.com");
    const ana = await cadastrar(db, "ana@exemplo.com");
    await criarCiclo(db, ana, { nome: "Só da Ana" });
    const { ciclos } = await exportarBackup(db, ana);
    expect(ciclos.map((c) => c.nome)).toEqual(["Só da Ana"]);
  });
});

const INVALIDO = "O arquivo não é um backup válido do Estudo Livre.";
const AGORA = new Date("2026-11-22T12:00:00Z");
type Usuario = { id: string };

const exportar = async (usuario: Usuario) => JSON.stringify(await exportarBackup(db, usuario, AGORA));
const nomesDosCiclos = async (usuario: Usuario) =>
  (await db.select({ nome: ciclo.nome }).from(ciclo).where(eq(ciclo.usuarioId, usuario.id)).orderBy(asc(ciclo.criadoEm))).map((c) => c.nome);

/** O arquivo sem nada que dependa dos ids e sem a data da exportação. */
function semIds(x: unknown): unknown {
  if (x instanceof Date) return x.toISOString();
  if (Array.isArray(x)) return x.map(semIds);
  if (x && typeof x === "object")
    return Object.fromEntries(Object.entries(x).filter(([k]) => k !== "id" && !k.endsWith("Id") && k !== "exportadoEm").map(([k, v]) => [k, semIds(v)]));
  return x;
}

async function recusa(usuario: Usuario, conteudo: string, mensagem: string) {
  const antes = await exportar(usuario);
  await expect(importarBackup(db, usuario, conteudo)).rejects.toThrow(new ValidacaoError(mensagem));
  expect(await exportar(usuario)).toBe(antes);
}

describe("importar", () => {
  it("substitui os ciclos da conta pelos do arquivo", async () => {
    const { usuario: ana } = await cenario("ana@exemplo.com");
    const bia = await cadastrar(db, "bia@exemplo.com");
    await criarCiclo(db, bia, { nome: "Antigo da Bia" });
    expect(await importarBackup(db, bia, await exportar(ana))).toEqual({ ciclos: 2 });
    expect(await nomesDosCiclos(bia)).toEqual(["TRF", "INSS"]);
  });

  it("recalcula os cartões ignorando os do arquivo", async () => {
    const { usuario: ana, crase } = await cenario();
    const original = await obterCartao(db, ana, crase);
    const arquivo = JSON.parse(await exportar(ana));
    arquivo.ciclos[0].cartoes[0].proximaRevisao = "2099-01-01T00:00:00.000Z";
    arquivo.ciclos[0].cartoes[0].estado = { adulterado: true };
    arquivo.ciclos[0].logDeRevisao = [];
    const bia = await cadastrar(db, "bia@exemplo.com");
    await importarBackup(db, bia, JSON.stringify(arquivo));
    const [novo] = await db.select({ id: topico.id }).from(topico).innerJoin(materia, eq(materia.id, topico.materiaId)).innerJoin(ciclo, eq(ciclo.id, materia.cicloId)).where(eq(ciclo.usuarioId, bia.id)).orderBy(asc(topico.posicao));
    expect(await obterCartao(db, bia, novo.id)).toEqual(original);
    const reexportado = JSON.parse(await exportar(bia));
    expect(semIds(reexportado.ciclos[0].logDeRevisao)).toEqual(semIds(JSON.parse(await exportar(ana)).ciclos[0].logDeRevisao));
    expect(reexportado.ciclos[0].logDeRevisao).toHaveLength(2);
  });

  it("mantém ciclos arquivados com a mesma data", async () => {
    const { usuario: ana } = await cenario();
    const arquivo = JSON.parse(await exportar(ana));
    const bia = await cadastrar(db, "bia@exemplo.com");
    await importarBackup(db, bia, JSON.stringify(arquivo));
    const linhas = await db.select({ nome: ciclo.nome, arquivadoEm: ciclo.arquivadoEm }).from(ciclo).where(eq(ciclo.usuarioId, bia.id)).orderBy(asc(ciclo.criadoEm));
    expect(linhas.map((l) => [l.nome, l.arquivadoEm?.toISOString() ?? null])).toEqual([
      ["TRF", null],
      ["INSS", arquivo.ciclos[1].arquivadoEm],
    ]);
    expect(arquivo.ciclos[1].arquivadoEm).not.toBeNull();
  });

  it("não toca os ciclos de outro usuário", async () => {
    const { usuario: ana } = await cenario("ana@exemplo.com");
    const antesDaAna = await exportar(ana);
    const bia = await cadastrar(db, "bia@exemplo.com");
    await importarBackup(db, bia, antesDaAna);
    await importarBackup(db, bia, JSON.stringify({ formato: "estudo-livre", versao: 1, exportadoEm: AGORA.toISOString(), ciclos: [] }));
    expect(await exportar(ana)).toBe(antesDaAna);
    expect(await nomesDosCiclos(bia)).toEqual([]);
  });

  it("lista vazia esvazia a conta", async () => {
    const { usuario } = await cenario();
    expect(await importarBackup(db, usuario, JSON.stringify({ formato: "estudo-livre", versao: 1, exportadoEm: AGORA.toISOString(), ciclos: [] }))).toEqual({ ciclos: 0 });
    expect(await nomesDosCiclos(usuario)).toEqual([]);
  });

  it("importar duas vezes não duplica", async () => {
    const { usuario } = await cenario();
    const arquivo = await exportar(usuario);
    await importarBackup(db, usuario, arquivo);
    await importarBackup(db, usuario, arquivo);
    expect(await nomesDosCiclos(usuario)).toEqual(["TRF", "INSS"]);
    expect(semIds(JSON.parse(await exportar(usuario)))).toEqual(semIds(JSON.parse(arquivo)));
  });

  it("aceita registro sem tópico nem conteúdo livre", async () => {
    const { usuario } = await cenario();
    const arquivo = JSON.parse(await exportar(usuario));
    const semConteudo = arquivo.ciclos[1].registros[0];
    expect(semConteudo).toMatchObject({ topicoId: null, conteudoLivre: null });
    const bia = await cadastrar(db, "bia@exemplo.com");
    await importarBackup(db, bia, JSON.stringify(arquivo));
    expect(JSON.parse(await exportar(bia)).ciclos[1].registros).toEqual([expect.objectContaining({ topicoId: null, conteudoLivre: null, duracaoMinutos: 45, tipo: "Leitura de lei" })]);
  });
});

describe("recusar", () => {
  it("recusa arquivo inválido sem alterar a conta", async () => {
    const { usuario } = await cenario();
    const valido = JSON.parse(await exportar(usuario));
    const variante = (mudar: (a: typeof valido) => void) => {
      const copia = structuredClone(valido);
      mudar(copia);
      return JSON.stringify(copia);
    };
    const invalidos = [
      "isto não é json",
      "{\"formato\": \"estudo-livre\", \"versao\": 1, \"ciclos\": [",
      "[]",
      variante((a) => (a.formato = "outro-app")),
      variante((a) => delete a.formato),
      variante((a) => delete a.ciclos),
      variante((a) => delete a.ciclos[0].nome),
      variante((a) => delete a.ciclos[0].registros[0].duracaoMinutos),
      variante((a) => (a.ciclos[0].registros[0].duracaoMinutos = "60")),
      variante((a) => (a.ciclos[0].registros[0].duracaoMinutos = 0)),
      variante((a) => (a.ciclos[0].registros[0].tipo = "Cochilo")),
      variante((a) => (a.ciclos[0].registros[0].nota = "Ótimo")),
      variante((a) => (a.ciclos[0].registros[0].dataHora = "ontem")),
      variante((a) => (a.ciclos[0].registros[0].acertos = 11)),
      variante((a) => (a.ciclos[0].registros[0].materiaId = "nao-existe")),
      variante((a) => (a.ciclos[0].registros[0].topicoId = "nao-existe")),
      variante((a) => (a.ciclos[0].etapas[0].materiaId = "nao-existe")),
      variante((a) => (a.ciclos[0].logDeRevisao[0].registroId = "nao-existe")),
      variante((a) => (a.ciclos[0].faixas.bomAte = 10)),
      variante((a) => (a.ciclos[0].voltas[1].fim = a.ciclos[0].voltas[1].inicio)),
    ];
    for (const conteudo of invalidos) await recusa(usuario, conteudo, INVALIDO);
    expect(await nomesDosCiclos(usuario)).toEqual(["TRF", "INSS"]);
  });

  it("recusa versão desconhecida", async () => {
    const { usuario } = await cenario();
    const arquivo = JSON.parse(await exportar(usuario));
    arquivo.versao = 2;
    await recusa(usuario, JSON.stringify(arquivo), "Versão de backup desconhecida: 2.");
  });

  it("recusa arquivo acima de 50 MB", async () => {
    const { usuario } = await cenario();
    const arquivo = JSON.parse(await exportar(usuario));
    const base = JSON.stringify(arquivo);
    // Exatamente 50 MB passa da checagem de tamanho; um byte a mais é recusado.
    const limite = 50 * 1024 * 1024;
    const noLimite = base.replace(/}$/, `,"x":"${"a".repeat(limite - Buffer.byteLength(base) - 7)}"}`);
    expect(Buffer.byteLength(noLimite)).toBe(limite);
    await importarBackup(db, usuario, noLimite);
    await recusa(usuario, noLimite.replace(/"}$/, 'a"}'), "O arquivo passa de 50 MB.");
  });

  it("recusa com cronômetro ativo", async () => {
    const { usuario, ti } = await cenario();
    await iniciarCronometro(db, usuario, ti);
    await recusa(usuario, await exportar(usuario), "Pare ou descarte o cronômetro antes de importar.");
  });

  it("desfaz tudo quando a gravação falha no meio", async () => {
    const { usuario } = await cenario();
    const arquivo = JSON.parse(await exportar(usuario));
    // O segundo Ciclo repete a Matéria com outra caixa: o banco recusa depois que o primeiro já foi gravado.
    arquivo.ciclos[1].materias.push({ id: "repetida", nome: "direito", topicos: [] });
    await recusa(usuario, JSON.stringify(arquivo), INVALIDO);
  });
});

/** O que o Usuário vê de cada Ciclo, das Estatísticas e das próximas revisões, sem ids. */
async function estadoVisivel(usuario: Usuario) {
  const ciclos = await db.select({ id: ciclo.id }).from(ciclo).where(eq(ciclo.usuarioId, usuario.id)).orderBy(asc(ciclo.criadoEm));
  const detalhes = await Promise.all(ciclos.map((c) => obterCiclo(db, usuario, c.id)));
  const materias = await Promise.all(detalhes.flatMap((d) => d.materias.map((m) => obterMateria(db, usuario, d.id, m.id))));
  return semIds({
    ciclos: detalhes.map((d) => ({ nome: d.nome, volta: d.volta, etapas: d.etapas, materias: d.materias, extraMinutos: d.extraMinutos, feitoMinutos: d.feitoMinutos, percentual: d.percentual })),
    estatisticas: await obterEstatisticas(db, usuario),
    revisoes: materias.map((m) => m.topicos.map((t) => [t.nome, t.proximaRevisao, t.estudado, t.registros])),
  });
}

describe("ida e volta", () => {
  it("reexportar dá o mesmo arquivo", async () => {
    const { usuario: ana } = await cenario("ana@exemplo.com");
    const deA = JSON.parse(await exportar(ana));
    const bia = await cadastrar(db, "bia@exemplo.com");
    await importarBackup(db, bia, JSON.stringify(deA));
    const deB = JSON.parse(await exportar(bia));
    expect(semIds(deB)).toEqual(semIds(deA));
    expect(deB.ciclos[0].registros).toHaveLength(3);
  });

  it("reproduz voltas, progresso, estatísticas e revisões", async () => {
    const { usuario: ana } = await cenario("ana@exemplo.com");
    const bia = await cadastrar(db, "bia@exemplo.com");
    await importarBackup(db, bia, await exportar(ana));
    const deA = await estadoVisivel(ana);
    expect(await estadoVisivel(bia)).toEqual(deA);
    expect((deA as { ciclos: { volta: { numero: number } }[] }).ciclos[0].volta.numero).toBe(2);
  });
});
