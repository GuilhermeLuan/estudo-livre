"use server";

import { revalidatePath } from "next/cache";
import { NaoEncontradoError, registrarEstudo, ValidacaoError, type MateriaComProgresso } from "@/casos-de-uso";
import type { TipoDeEstudo } from "@/db/schema";
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

export async function registrar(
  materias: Pick<MateriaComProgresso, "id" | "nome">[],
  estado: EstadoRegistro,
  dados: FormData,
): Promise<EstadoRegistro> {
  const usuario = await exigirUsuario();
  const materiaId = texto(dados, "materiaId");
  const duracaoMinutos = Number(texto(dados, "horas") || 0) * 60 + Number(texto(dados, "minutos") || 0);
  try {
    const { voltaFechada } = await registrarEstudo(obterDb(), usuario, materiaId, {
      tipo: texto(dados, "tipo") as TipoDeEstudo,
      duracaoMinutos,
      dia: texto(dados, "data"),
      questoes: inteiroOpcional(dados, "questoes"),
      acertos: inteiroOpcional(dados, "acertos"),
      anotacao: texto(dados, "anotacao"),
      conteudoLivre: texto(dados, "conteudoLivre"),
    });
    revalidatePath("/", "layout");
    const nome = materias.find((m) => m.id === materiaId)?.nome ?? "matéria";
    return {
      aviso: voltaFechada
        ? `Volta ${voltaFechada} fechada. Volta ${voltaFechada + 1} começou.`
        : `Estudo registrado em ${nome}.`,
      enviado: (estado.enviado ?? 0) + 1,
    };
  } catch (erro) {
    if (erro instanceof ValidacaoError) return { erro: erro.message, enviado: estado.enviado };
    if (erro instanceof NaoEncontradoError) return { erro: "Não encontramos esta matéria. Atualize a página.", enviado: estado.enviado };
    throw erro;
  }
}
