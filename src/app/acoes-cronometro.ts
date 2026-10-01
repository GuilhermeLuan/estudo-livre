"use server";

import { revalidatePath } from "next/cache";
import {
  type CronometroParado,
  descartarCronometro,
  iniciarCronometro,
  NaoEncontradoError,
  pararCronometro,
  pausarCronometro,
  retomarCronometro,
  type Usuario,
  ValidacaoError,
} from "@/casos-de-uso";
import { obterDb } from "@/db";
import { exigirUsuario } from "@/sessao";

export type ResultadoDoCronometro =
  | { erro: string; parado?: undefined }
  | { erro?: undefined; aviso?: string; /** Só em `parar`: a duração para preencher o registro. */ parado?: Omit<CronometroParado, "materiaId"> };

/** Executa a operação e traduz os erros esperados em mensagem; a tela se atualiza com o estado do servidor. */
async function executar(operacao: (usuario: Usuario) => Promise<ResultadoDoCronometro | void>): Promise<ResultadoDoCronometro> {
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
  return executar(async (u) => {
    const { duracaoMinutos, passouDoLimite } = await pararCronometro(obterDb(), u);
    return { parado: { duracaoMinutos, passouDoLimite } };
  });
}
