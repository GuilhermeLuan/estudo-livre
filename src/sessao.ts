import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { obterAuth } from "@/auth";
import type { Usuario } from "@/casos-de-uso";

/** Usuário da sessão atual; sem sessão, redireciona para o login. */
export async function exigirUsuario(): Promise<Usuario> {
  const sessao = await obterAuth().api.getSession({ headers: await headers() });
  if (!sessao) redirect("/entrar");
  return { id: sessao.user.id };
}
