import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { criarDb, type Db } from "@/db";

// A migração das Etapas roda sobre um banco que ainda tem as 4 migrações anteriores e dados no formato antigo
// (carga horária e posição na Matéria): é o caso de uma instância já em uso.
const BANCO = "teste_migracao_etapas";
const TAG_DA_MIGRACAO = "0004_etapas";

let admin: Db;
let db: Db;

function urlDe(banco: string) {
  const url = new URL(process.env.TEST_DATABASE_URL!);
  url.pathname = `/${banco}`;
  return url.toString();
}

/** Pasta de migrações só até a anterior às Etapas. */
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
});

afterAll(async () => {
  await db.$client.end();
  await admin.$client.query(`drop database if exists ${BANCO}`);
  await admin.$client.end();
});

describe("migração para Etapas", () => {
  it("funde Matérias de mesmo nome no Ciclo e leva o histórico para a Matéria que sobra", async () => {
    const q = (texto: string, valores: unknown[] = []) => db.$client.query(texto, valores);
    await q(`insert into "user" (id, name, email) values ('u1', 'Ana', 'ana@exemplo.com')`);
    await q(`insert into ciclo (id, usuario_id, nome) values ('c1', 'u1', 'BB'), ('c2', 'u1', 'INSS')`);
    await q(`insert into materia (id, ciclo_id, nome, carga_minutos, posicao) values
      ('m-ti-1', 'c1', 'Tecnologia da Informação - TI', 60, 0),
      ('m-est', 'c1', 'Estatística', 120, 1),
      ('m-ti-2', 'c1', 'Tecnologia da Informação - TI', 50, 2),
      ('m-ti-inss', 'c2', 'Tecnologia da Informação - TI', 90, 0)`);
    await q(`insert into registro_de_estudo (id, materia_id, data_hora, duracao_minutos, tipo) values
      ('r1', 'm-ti-1', now(), 30, 'Teoria'), ('r2', 'm-ti-2', now(), 20, 'Teoria')`);
    await q(`insert into cronometro (usuario_id, materia_id) values ('u1', 'm-ti-2')`);

    const sql = readFileSync(`./drizzle/${TAG_DA_MIGRACAO}.sql`, "utf8");
    for (const comando of sql.split("--> statement-breakpoint")) await q(comando);

    const etapas = await q(`select m.nome, e.carga_minutos, e.posicao, e.ciclo_id from etapa e join materia m on m.id = e.materia_id order by e.ciclo_id, e.posicao`);
    expect(etapas.rows.map((e) => [e.ciclo_id, e.nome, e.carga_minutos, e.posicao])).toEqual([
      ["c1", "Tecnologia da Informação - TI", 60, 0],
      ["c1", "Estatística", 120, 1],
      ["c1", "Tecnologia da Informação - TI", 50, 2],
      ["c2", "Tecnologia da Informação - TI", 90, 0],
    ]);

    const materias = await q(`select ciclo_id, nome from materia order by ciclo_id, nome`);
    expect(materias.rows).toHaveLength(3);

    const registros = await q(`select distinct materia_id from registro_de_estudo`);
    const cronometro = await q(`select materia_id from cronometro`);
    expect(registros.rows).toHaveLength(1);
    expect(cronometro.rows[0].materia_id).toBe(registros.rows[0].materia_id);
    const [{ nome }] = (await q(`select nome from materia where id = $1`, [registros.rows[0].materia_id])).rows;
    expect(nome).toBe("Tecnologia da Informação - TI");
  });
});
