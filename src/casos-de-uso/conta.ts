import { count } from "drizzle-orm";
import type { Db } from "@/db";
import { user } from "@/db/schema";

export class CadastroFechadoError extends Error {
  constructor() {
    super("O cadastro está fechado nesta instância.");
  }
}

/**
 * Decide se um novo Usuário pode ser criado e se ele será Admin.
 * O primeiro Usuário vira Admin e sempre pode se cadastrar, mesmo com o cadastro fechado.
 */
export async function prepararCadastro(db: Db, opcoes: { cadastroAberto: boolean }): Promise<{ admin: boolean }> {
  const [{ total }] = await db.select({ total: count() }).from(user);
  if (total === 0) return { admin: true };
  if (!opcoes.cadastroAberto) throw new CadastroFechadoError();
  return { admin: false };
}
