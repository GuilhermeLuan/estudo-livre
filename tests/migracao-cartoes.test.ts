import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { criarDb, type Db } from "@/db";
import { reconstruirCartoes } from "../scripts/cartoes.mjs";
import { recalcularCartao } from "../src/revisao";

// A migração dos Cartões roda sobre um banco que ainda tem as 6 migrações anteriores e Registros no formato antigo
// (sem nota): é o caso de uma instância já em uso.
const BANCO = "teste_migracao_cartoes";
const TAG_DA_MIGRACAO = "0006_dashing_the_enforcers";

let admin: Db;
let db: Db;
const q = (texto: string, valores: unknown[] = []) => db.$client.query(texto, valores);

function urlDe(banco: string) {
  const url = new URL(process.env.TEST_DATABASE_URL!);
  url.pathname = `/${banco}`;
  return url.toString();
}

function migracoesAnteriores() {
  const origem = "./drizzle";
  const destino = mkdtempSync(join(tmpdir(), "migracoes-"));
  mkdirSync(join(destino, "meta"));
  const diario = JSON.parse(readFileSync(join(origem, "meta/_journal.json"), "utf8"));
  const indice = diario.entries.findIndex((e: { tag: string }) => e.tag === TAG_DA_MIGRACAO);
  diario.entries = diario.entries.slice(0, indice);
  writeFileSync(join(destino, "meta/_journal.json"), JSON.stringify(diario));
  for (const { tag } of diario.entries) cpSync(join(origem, `${tag}.sql`), join(destino, `${tag}.sql`));
  return destino;
}

beforeAll(async () => {
  admin = criarDb(urlDe("postgres"));
  await admin.$client.query(`drop database if exists ${BANCO}`);
  await admin.$client.query(`create database ${BANCO}`);
  db = criarDb(urlDe(BANCO));
  await migrate(db, { migrationsFolder: migracoesAnteriores() });

  await q(`insert into "user" (id, name, email) values ('u1', 'Ana', 'ana@exemplo.com')`);
  await q(`insert into ciclo (id, usuario_id, nome) values ('c1', 'u1', 'BB')`);
  await q(`insert into materia (id, ciclo_id, nome) values ('m1', 'c1', 'Português')`);
  await q(`insert into topico (id, materia_id, nome, posicao) values
    ('t-com', 'm1', 'Crase', 0), ('t-sem-questoes', 'm1', 'Regência', 1), ('t-vazio', 'm1', 'Concordância', 2)`);
  await q(`insert into registro_de_estudo (id, materia_id, data_hora, duracao_minutos, tipo, questoes, acertos, topico_id) values
    ('r1', 'm1', '2026-11-01T12:00:00Z', 30, 'Exercícios', 20, 16, 't-com'),
    ('r2', 'm1', '2026-11-08T12:00:00Z', 30, 'Exercícios', 3, 3, 't-com'),
    ('r3', 'm1', '2026-11-15T12:00:00Z', 30, 'Exercícios', 10, 10, 't-com'),
    ('r4', 'm1', '2026-11-02T12:00:00Z', 30, 'Teoria', null, null, 't-sem-questoes'),
    ('r5', 'm1', '2026-11-03T12:00:00Z', 30, 'Exercícios', 10, 5, null)`);

  const sql = readFileSync(`./drizzle/${TAG_DA_MIGRACAO}.sql`, "utf8");
  for (const comando of sql.split("--> statement-breakpoint")) await q(comando);
});

afterAll(async () => {
  await db.$client.end();
  await admin.$client.query(`drop database if exists ${BANCO}`);
  await admin.$client.end();
});

const foto = async () => ({
  cartoes: (await q(`select * from cartao_de_revisao order by topico_id`)).rows,
  log: (await q(`select * from log_de_revisao order by registro_id`)).rows,
});

describe("migração para Cartões", () => {
  it("cria os Cartões dos Registros que já existem", async () => {
    const notas = await q(`select id, nota from registro_de_estudo order by id`);
    expect(notas.rows.map((r) => [r.id, r.nota])).toEqual([
      ["r1", "Bom"], ["r2", null], ["r3", "Fácil"], ["r4", null], ["r5", null], // questões >= 5 e Tópico: nota padrão
    ]);

    await reconstruirCartoes(db.$client);

    const { cartoes, log } = await foto();
    expect(cartoes.map((c) => c.topico_id)).toEqual(["t-com", "t-sem-questoes"]); // t-vazio não tem Registros
    const esperado = recalcularCartao([
      { nota: "Bom", revisadoEm: new Date("2026-11-01T12:00:00Z") },
      { nota: "Fácil", revisadoEm: new Date("2026-11-15T12:00:00Z") },
    ]);
    expect(cartoes[0].proxima_revisao).toEqual(esperado.proximaRevisao);
    expect(cartoes[0].proxima_revisao.getTime()).toBeGreaterThan(new Date("2026-11-15T12:00:00Z").getTime());
    expect(cartoes[1].proxima_revisao).toBeNull(); // só Registro sem questões: Cartão sem data
    expect(log.map((l) => [l.topico_id, l.registro_id, l.nota])).toEqual([["t-com", "r1", "Bom"], ["t-com", "r3", "Fácil"]]);
  });

  it("rodar de novo não muda nada", async () => {
    const antes = await foto();
    await reconstruirCartoes(db.$client);
    expect(await foto()).toEqual(antes);
  });
});
