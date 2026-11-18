import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { reconstruirCartoes } from "./cartoes.mjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
await reconstruirCartoes(pool);
await pool.end();
console.log("Migrations aplicadas.");
