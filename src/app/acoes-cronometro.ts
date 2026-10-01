"use server";

import { revalidatePath } from "next/cache";
import {
  descartarCronometro,
  iniciarCronometro,
  NaoEncontradoError,
  pararCronometro,
  pausarCronometro,
  retomarCronometro,
  ValidacaoError,
} from "@/casos-de-uso";
import { obterDb } from "@/db";
import { exigirUsuario } from "@/sessao";

export type ResultadoDoCronometro = { erro?: string; aviso?: string; duracaoMinutos?: number; passouDoLimite?: boolean };

/** Executa a operação e traduz os erros esperados em mensagem; a tela se atualiza com o estado do servidor. */
async function executar(operacao: (usuario: Awaited<ReturnType<typeof exigirUsuario>>) => Promise<ResultadoDoCronometro | void>): Promise<ResultadoDoCronometro> {
  const usuario = await exigirUsuario();
  try {
    const resultado = await operacao(usuario);
    revalidatePath("/", "layout");
    return resultado ?? {};
  } catch (erro) {
    revalidatePath("/", "layout");
    if (erro instanceof ValidacaoError) return { erro: erro.message };
    if (erro instanceof NaoEncontradoError) return { erro: "Este cronômetro não existe mais. Atualizamos a tela." };
    throw erro;
  }
}

export async function iniciar(materiaId: string) {
  return executar((u) => iniciarCronometro(obterDb(), u, materiaId));
}

export async function pausar() {
  return executar((u) => pausarCronometro(obterDb(), u));
}

export async function retomar() {
  return executar((u) => retomarCronometro(obterDb(), u));
}

export async function descartar() {
  return executar(async (u) => {
    await descartarCronometro(obterDb(), u);
    return { aviso: "Cronômetro descartado. Nada foi registrado." };
  });
}

export async function parar() {
  return executar((u) => pararCronometro(obterDb(), u));
}
