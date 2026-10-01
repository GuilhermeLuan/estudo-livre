import { and, asc, eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import type { Db } from "@/db";
import { account, session, user } from "@/db/schema";
import type { Usuario } from "./usuario";

export class NaoAutorizadoError extends Error {
  constructor() {
    super("Apenas o Admin pode fazer isso.");
  }
}

export class SenhaInvalidaError extends Error {
  constructor() {
    super("A senha precisa ter pelo menos 8 caracteres.");
  }
}

export class UsuarioNaoEncontradoError extends Error {
  constructor() {
    super("Usuário não encontrado.");
  }
}

export type UsuarioListado = { id: string; nome: string; email: string; admin: boolean };

async function exigirAdmin(db: Db, usuario: Usuario) {
  const [linha] = await db.select({ admin: user.admin }).from(user).where(eq(user.id, usuario.id));
  if (!linha?.admin) throw new NaoAutorizadoError();
}

export async function listarUsuarios(db: Db, admin: Usuario): Promise<UsuarioListado[]> {
  await exigirAdmin(db, admin);
  return db
    .select({ id: user.id, nome: user.name, email: user.email, admin: user.admin })
    .from(user)
    .orderBy(asc(user.createdAt), asc(user.email));
}

/** O Admin define uma nova senha para um Usuário; as sessões abertas dele são encerradas. */
export async function redefinirSenha(db: Db, admin: Usuario, usuarioId: string, novaSenha: string): Promise<void> {
  await exigirAdmin(db, admin);
  if (novaSenha.length < 8) throw new SenhaInvalidaError();
  const hash = await hashPassword(novaSenha);
  await db.transaction(async (tx) => {
    const atualizadas = await tx
      .update(account)
      .set({ password: hash, updatedAt: new Date() })
      .where(and(eq(account.userId, usuarioId), eq(account.providerId, "credential")))
      .returning({ id: account.id });
    if (atualizadas.length === 0) throw new UsuarioNaoEncontradoError();
    await tx.delete(session).where(eq(session.userId, usuarioId));
  });
}
