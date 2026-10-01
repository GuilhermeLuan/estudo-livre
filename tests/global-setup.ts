import { execSync } from "node:child_process";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { criarDb } from "../src/db";

// Sobe um Postgres descartável via Docker, a menos que TEST_DATABASE_URL já aponte para um.
const CONTAINER = "estudo-livre-teste-pg";
const PORTA = 54329;

export default async function setup() {
  let url = process.env.TEST_DATABASE_URL;
  let criouContainer = false;
  if (!url) {
    execSync(`docker rm -f ${CONTAINER}`, { stdio: "ignore" });
    execSync(
      `docker run -d --name ${CONTAINER} -e POSTGRES_PASSWORD=teste -e POSTGRES_DB=teste -p ${PORTA}:5432 postgres:17-alpine`,
      { stdio: "ignore" },
    );
    criouContainer = true;
    url = `postgres://postgres:teste@localhost:${PORTA}/teste`;
    process.env.TEST_DATABASE_URL = url;
  }

  const db = criarDb(url);
  for (let tentativa = 0; ; tentativa++) {
    try {
      await db.execute("select 1");
      break;
    } catch (erro) {
      if (tentativa > 60) throw erro;
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  await migrate(db, { migrationsFolder: "./drizzle" });
  await db.$client.end();

  return () => {
    if (criouContainer) execSync(`docker rm -f ${CONTAINER}`, { stdio: "ignore" });
  };
}
