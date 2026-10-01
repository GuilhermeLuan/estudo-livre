"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { obterAuth } from "@/auth";

export type EstadoFormulario = { erro?: string; nome?: string; email?: string };

function texto(dados: FormData, campo: string) {
  return String(dados.get(campo) ?? "").trim();
}

export async function entrar(_: EstadoFormulario, dados: FormData): Promise<EstadoFormulario> {
  try {
    await obterAuth().api.signInEmail({
      body: { email: texto(dados, "email"), password: String(dados.get("senha") ?? "") },
      headers: await headers(),
    });
  } catch (erro) {
    if (erro instanceof APIError) return { erro: "E-mail ou senha incorretos.", email: texto(dados, "email") };
    throw erro;
  }
  redirect("/");
}

export async function cadastrar(_: EstadoFormulario, dados: FormData): Promise<EstadoFormulario> {
  const preenchido = { nome: texto(dados, "nome"), email: texto(dados, "email") };
  const senha = String(dados.get("senha") ?? "");
  if (senha.length < 8) return { erro: "A senha precisa ter pelo menos 8 caracteres.", ...preenchido };
  try {
    await obterAuth().api.signUpEmail({
      body: { name: preenchido.nome, email: preenchido.email, password: senha },
      headers: await headers(),
    });
  } catch (erro) {
    if (erro instanceof APIError) {
      if (erro.status === "FORBIDDEN") return { erro: "O cadastro está fechado nesta instância. Peça uma conta ao Admin.", ...preenchido };
      if (erro.body?.code === "USER_ALREADY_EXISTS" || erro.body?.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL")
        return { erro: "Já existe uma conta com este e-mail.", ...preenchido };
      return { erro: "Não foi possível criar a conta. Confira os dados.", ...preenchido };
    }
    throw erro;
  }
  redirect("/");
}

export async function sair() {
  await obterAuth().api.signOut({ headers: await headers() });
  redirect("/entrar");
}
