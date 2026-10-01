"use server";

import { revalidatePath } from "next/cache";
import { NaoEncontradoError, registrarEstudo, ValidacaoError } from "@/casos-de-uso";
import type { TipoDeEstudo } from "@/dominio";
import { obterDb } from "@/db";
import { exigirUsuario } from "@/sessao";

export type EstadoRegistro = { erro?: string; aviso?: string; enviado?: number };

function texto(dados: FormData, campo: string) {
  return String(dados.get(campo) ?? "").trim();
}

function inteiroOpcional(dados: FormData, campo: string) {
  const bruto = texto(dados, campo);
  return bruto === "" ? null : Number(bruto);
}

export async function registrar(estado: EstadoRegistro, dados: FormData): Promise<EstadoRegistro> {
  const usuario = await exigirUsuario();
  const materiaId = texto(dados, "materiaId");
  const duracaoMinutos = Number(texto(dados, "horas") || 0) * 60 + Number(texto(dados, "minutos") || 0);
  try {
    const { materia, ciclo, voltaFechada } = await registrarEstudo(obterDb(), usuario, materiaId, {
      tipo: texto(dados, "tipo") as TipoDeEstudo, // o caso de uso rejeita o que não for um tipo válido
      duracaoMinutos,
      dia: texto(dados, "data"),
      questoes: inteiroOpcional(dados, "questoes"),
      acertos: inteiroOpcional(dados, "acertos"),
      anotacao: texto(dados, "anotacao"),
      conteudoLivre: texto(dados, "conteudoLivre"),
    }, { cronometro: dados.get("cronometro") === "1" });
    revalidatePath("/", "layout");
    return {
      aviso: voltaFechada
        ? `Volta ${voltaFechada} fechada. Volta ${voltaFechada + 1} começou em ${ciclo}.`
        : `Estudo registrado em ${materia}.`,
      enviado: (estado.enviado ?? 0) + 1,
    };
  } catch (erro) {
    if (erro instanceof ValidacaoError) return { erro: erro.message, enviado: estado.enviado };
    if (erro instanceof NaoEncontradoError) return { erro: "Não encontramos esta matéria. Atualize a página.", enviado: estado.enviado };
    throw erro;
  }
}
