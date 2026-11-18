"use server";

import { revalidatePath } from "next/cache";
import { editarRegistro, excluirRegistro, NaoEncontradoError, ValidacaoError } from "@/casos-de-uso";
import { obterDb } from "@/db";
import { exigirUsuario } from "@/sessao";
import { lerFormularioDeRegistro } from "./campos-do-registro";
import type { EstadoRegistro } from "./acoes-estudo";

const NAO_ENCONTRADO = "Não encontramos este registro. Atualize a página.";

/** "Salvar" do modal de edição: o id do Registro vem no campo `registroId`. */
export async function editar(estado: EstadoRegistro, dados: FormData): Promise<EstadoRegistro> {
  const usuario = await exigirUsuario();
  const lido = lerFormularioDeRegistro(dados);
  if ("erro" in lido) return { erro: lido.erro, enviado: estado.enviado };
  try {
    const { ciclo, voltaFechada } = await editarRegistro(obterDb(), usuario, String(dados.get("registroId") ?? ""), lido.materiaId, lido.estudo);
    revalidatePath("/", "layout");
    return {
      aviso: voltaFechada ? `Volta ${voltaFechada} fechada. Volta ${voltaFechada + 1} começou em ${ciclo}.` : "Registro salvo.",
      enviado: (estado.enviado ?? 0) + 1,
    };
  } catch (erro) {
    if (erro instanceof ValidacaoError) return { erro: erro.message, enviado: estado.enviado };
    if (erro instanceof NaoEncontradoError) return { erro: NAO_ENCONTRADO, enviado: estado.enviado };
    throw erro;
  }
}

export async function excluir(registroId: string): Promise<{ erro?: string }> {
  const usuario = await exigirUsuario();
  try {
    await excluirRegistro(obterDb(), usuario, registroId);
  } catch (erro) {
    if (erro instanceof NaoEncontradoError) return { erro: NAO_ENCONTRADO };
    throw erro;
  }
  revalidatePath("/", "layout");
  return {};
}
