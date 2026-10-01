import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type Db = NodePgDatabase<typeof schema> & { $client: Pool };
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export function criarDb(url: string): Db {
  return drizzle(new Pool({ connectionString: url }), { schema });
}

let db: Db | undefined;

export function obterDb(): Db {
  if (!db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL não definida");
    db = criarDb(url);
  }
  return db;
}
