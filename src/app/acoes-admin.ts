"use server";

import { revalidatePath } from "next/cache";
import { NaoAutorizadoError, redefinirSenha, SenhaInvalidaError, UsuarioNaoEncontradoError } from "@/casos-de-uso";
import { obterDb } from "@/db";
import { exigirUsuario } from "@/sessao";

export type EstadoRedefinicao = { erro?: string; ok?: string };

export async function redefinirSenhaDeUsuario(_: EstadoRedefinicao, dados: FormData): Promise<EstadoRedefinicao> {
  const admin = await exigirUsuario();
  try {
    await redefinirSenha(obterDb(), admin, String(dados.get("usuarioId") ?? ""), String(dados.get("senha") ?? ""));
  } catch (erro) {
    if (erro instanceof NaoAutorizadoError || erro instanceof SenhaInvalidaError || erro instanceof UsuarioNaoEncontradoError) return { erro: erro.message };
    throw erro;
  }
  revalidatePath("/usuarios");
  return { ok: "Senha redefinida." };
}
