import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  adicionarEtapa,
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
