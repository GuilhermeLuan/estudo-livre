"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { obterAuth } from "@/auth";
import { smtpConfigurado } from "@/email";

export type EstadoFormulario = { erro?: string; ok?: string; nome?: string; email?: string };

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

export async function pedirRecuperacao(_: EstadoFormulario, dados: FormData): Promise<EstadoFormulario> {
  const email = texto(dados, "email");
  if (!smtpConfigurado()) return { erro: "A recuperação por e-mail não está disponível. Peça ao Admin para redefinir sua senha.", email };
  try {
    await obterAuth().api.requestPasswordReset({ body: { email, redirectTo: "/redefinir-senha" } });
  } catch {
    return { erro: "Não foi possível enviar o e-mail agora. Tente de novo mais tarde.", email };
  }
  // Mesma resposta exista ou não a conta, para não revelar quem tem cadastro.
  return { ok: "Se existir uma conta com este e-mail, enviamos o link para redefinir a senha.", email };
}

export async function redefinirComToken(_: EstadoFormulario, dados: FormData): Promise<EstadoFormulario> {
  const senha = String(dados.get("senha") ?? "");
  if (senha.length < 8) return { erro: "A senha precisa ter pelo menos 8 caracteres." };
  try {
    await obterAuth().api.resetPassword({ body: { newPassword: senha, token: texto(dados, "token") } });
  } catch (erro) {
    if (erro instanceof APIError) return { erro: "O link é inválido ou expirou. Peça um novo." };
    throw erro;
  }
  redirect("/entrar");
}
