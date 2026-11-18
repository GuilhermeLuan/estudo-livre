"use server";

import { revalidatePath } from "next/cache";
import { criarTopico, excluirTopico, importarTopicos, marcarTopico, NaoEncontradoError, renomearTopico, ValidacaoError } from "@/casos-de-uso";
import { obterDb } from "@/db";
import { exigirUsuario } from "@/sessao";

export type EstadoTopico = { erro?: string; aviso?: string };

const texto = (dados: FormData, campo: string) => String(dados.get(campo) ?? "");

async function executar(operacao: () => Promise<EstadoTopico | void>): Promise<EstadoTopico> {
  let estado: EstadoTopico = {};
  try {
    estado = (await operacao()) ?? {};
  } catch (erro) {
    if (erro instanceof ValidacaoError) return { erro: erro.message };
    if (erro instanceof NaoEncontradoError) return { erro: "Não encontramos este item. Atualize a página." };
    throw erro;
  }
  revalidatePath("/", "layout");
  return estado;
}

export async function novoTopico(materiaId: string, _: EstadoTopico, dados: FormData) {
  const usuario = await exigirUsuario();
  return executar(async () => void (await criarTopico(obterDb(), usuario, materiaId, { nome: texto(dados, "nome") })));
}

export async function renomearTopicoDaMateria(topicoId: string, _: EstadoTopico, dados: FormData) {
  const usuario = await exigirUsuario();
  return executar(() => renomearTopico(obterDb(), usuario, topicoId, { nome: texto(dados, "nome") }));
}

export async function excluirTopicoDaMateria(topicoId: string) {
  const usuario = await exigirUsuario();
  return executar(() => excluirTopico(obterDb(), usuario, topicoId));
}

export async function marcarTopicoEstudado(topicoId: string, estudado: boolean) {
  const usuario = await exigirUsuario();
  return executar(() => marcarTopico(obterDb(), usuario, topicoId, estudado));
}

export async function importarTopicosDaMateria(materiaId: string, _: EstadoTopico, dados: FormData) {
  const usuario = await exigirUsuario();
  return executar(async () => {
    const { importados, ignorados } = await importarTopicos(obterDb(), usuario, materiaId, { texto: texto(dados, "texto") });
    return { aviso: `${importados} ${importados === 1 ? "importado" : "importados"}, ${ignorados} ${ignorados === 1 ? "ignorado" : "ignorados"}.` };
  });
}
