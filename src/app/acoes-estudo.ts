"use server";

import { revalidatePath } from "next/cache";
import { NaoEncontradoError, registrarEstudo, ValidacaoError } from "@/casos-de-uso";
import { obterDb } from "@/db";
import { CAMPO_CRONOMETRO, lerFormularioDeRegistro } from "./campos-do-registro";
import { exigirUsuario } from "@/sessao";

export type EstadoRegistro = { erro?: string; aviso?: string; enviado?: number };

export async function registrar(estado: EstadoRegistro, dados: FormData): Promise<EstadoRegistro> {
  const usuario = await exigirUsuario();
  const lido = lerFormularioDeRegistro(dados);
  if ("erro" in lido) return { erro: lido.erro, enviado: estado.enviado };
  try {
    const { materia, ciclo, voltaFechada } = await registrarEstudo(obterDb(), usuario, lido.materiaId, lido.estudo, { cronometro: dados.has(CAMPO_CRONOMETRO) });
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
