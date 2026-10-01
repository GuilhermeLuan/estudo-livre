import { sql } from "drizzle-orm";
import { criarAuth } from "@/auth";
import { criarDb, type Db } from "@/db";

export function bancoDeTeste(): Db {
  return criarDb(process.env.TEST_DATABASE_URL!);
}

export async function limparBanco(db: Db) {
  await db.execute(sql`truncate table "user", ciclo, materia, volta, registro_de_estudo, session, account, verification cascade`);
}

export async function cadastrar(db: Db, email: string, opcoes: { cadastroAberto?: boolean } = {}) {
  const auth = criarAuth(db, { cadastroAberto: opcoes.cadastroAberto ?? true, segredo: "segredo-de-teste-com-32-caracteres!!" });
  const { user } = await auth.api.signUpEmail({ body: { email, password: "senha-de-teste-123", name: email } });
  return { id: user.id };
}

export function authDeTeste(db: Db, opcoes: Partial<Parameters<typeof criarAuth>[1]> = {}) {
  return criarAuth(db, { cadastroAberto: true, segredo: "segredo-de-teste-com-32-caracteres!!", ...opcoes });
}
