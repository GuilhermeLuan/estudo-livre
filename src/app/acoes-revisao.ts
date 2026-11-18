"use server";

import { revalidatePath } from "next/cache";
import { estimarProximaRevisao, NaoEncontradoError, salvarFaixas, ValidacaoError } from "@/casos-de-uso";
import { obterDb } from "@/db";
import { validarFaixas } from "@/revisao";
import { exigirUsuario } from "@/sessao";
import { lerFormularioDeRegistro } from "./campos-do-registro";

export type EstadoFaixas = { erro?: string; campo?: string; enviado?: number };

/** A data (AAAA-MM-DD) que o Tópico teria ao salvar o formulário como está; nula se não há estimativa. Não grava nada. */
export async function estimarRevisao(dados: FormData): Promise<string | null> {
  const usuario = await exigirUsuario();
  const lido = lerFormularioDeRegistro(dados);
  if ("erro" in lido || !lido.estudo.topicoId) return null;
  const { dia, questoes, acertos, nota, topicoId } = lido.estudo;
  try {
    return await estimarProximaRevisao(obterDb(), usuario, { materiaId: lido.materiaId, registroId: String(dados.get("registroId") ?? "") || undefined, dia, questoes, acertos, nota, topicoId });
  } catch (erro) {
    if (erro instanceof NaoEncontradoError || erro instanceof ValidacaoError) return null;
    throw erro;
  }
}

const inteiro = (dados: FormData, campo: string) => Number(String(dados.get(campo) ?? "").trim() || Number.NaN);

/** "Salvar" do modal "Editar faixas de acerto". */
export async function salvarFaixasDoCiclo(cicloId: string, estado: EstadoFaixas, dados: FormData): Promise<EstadoFaixas> {
  const usuario = await exigirUsuario();
  const faixas = { erreiAte: inteiro(dados, "erreiAte"), dificilAte: inteiro(dados, "dificilAte"), bomAte: inteiro(dados, "bomAte"), minimo: inteiro(dados, "minimo") };
  const invalida = validarFaixas(faixas); // só para saber sob qual campo mostrar o erro; quem recusa é o caso de uso
  try {
    await salvarFaixas(obterDb(), usuario, cicloId, faixas);
  } catch (erro) {
    if (erro instanceof ValidacaoError) return { erro: erro.message, campo: invalida?.campo, enviado: estado.enviado };
    if (erro instanceof NaoEncontradoError) return { erro: "Não encontramos este ciclo. Atualize a página.", enviado: estado.enviado };
    throw erro;
  }
  revalidatePath(`/ciclos/${cicloId}`);
  return { enviado: (estado.enviado ?? 0) + 1 };
}
