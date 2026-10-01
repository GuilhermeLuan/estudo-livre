"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  adicionarEtapa,
  criarCiclo,
  editarEtapa,
  NaoEncontradoError,
  removerEtapa,
  renomearCiclo,
  reordenarEtapas,
  ValidacaoError,
} from "@/casos-de-uso";
import { obterDb } from "@/db";
import { exigirUsuario } from "@/sessao";

export type EstadoCiclo = { erro?: string };

function texto(dados: FormData, campo: string) {
  return String(dados.get(campo) ?? "").trim();
}

/** Carga horária digitada em horas (aceita vírgula ou ponto), guardada em minutos. */
function minutos(dados: FormData) {
  return Math.round(Number(texto(dados, "horas").replace(",", ".")) * 60);
}

async function executar(operacao: () => Promise<void>): Promise<EstadoCiclo> {
  try {
    await operacao();
  } catch (erro) {
    if (erro instanceof ValidacaoError) return { erro: erro.message };
    if (erro instanceof NaoEncontradoError) return { erro: "Não encontramos este item. Atualize a página." };
    throw erro;
  }
  return {};
}

export async function novoCiclo(_: EstadoCiclo, dados: FormData): Promise<EstadoCiclo> {
  const usuario = await exigirUsuario();
  let id = "";
  const estado = await executar(async () => {
    id = (await criarCiclo(obterDb(), usuario, { nome: texto(dados, "nome") })).id;
  });
  if (estado.erro) return estado;
  redirect(`/ciclos/${id}`);
}

export async function renomear(cicloId: string, _: EstadoCiclo, dados: FormData): Promise<EstadoCiclo> {
  const usuario = await exigirUsuario();
  const estado = await executar(() => renomearCiclo(obterDb(), usuario, cicloId, { nome: texto(dados, "nome") }));
  revalidatePath("/", "layout");
  return estado;
}

export async function novaEtapa(cicloId: string, _: EstadoCiclo, dados: FormData): Promise<EstadoCiclo> {
  const usuario = await exigirUsuario();
  const estado = await executar(async () => {
    await adicionarEtapa(obterDb(), usuario, cicloId, { nome: texto(dados, "nome"), cargaMinutos: minutos(dados) });
  });
  revalidatePath("/", "layout");
  return estado;
}

export async function salvarEtapa(etapaId: string, _: EstadoCiclo, dados: FormData): Promise<EstadoCiclo> {
  const usuario = await exigirUsuario();
  const estado = await executar(() =>
    editarEtapa(obterDb(), usuario, etapaId, { nome: texto(dados, "nome"), cargaMinutos: minutos(dados) }),
  );
  revalidatePath("/", "layout");
  return estado;
}

export async function excluirEtapa(etapaId: string): Promise<EstadoCiclo> {
  const usuario = await exigirUsuario();
  const estado = await executar(() => removerEtapa(obterDb(), usuario, etapaId));
  revalidatePath("/", "layout");
  return estado;
}

/** `ids` é a nova ordem completa das Etapas do Ciclo. */
export async function moverEtapa(cicloId: string, ids: string[]): Promise<EstadoCiclo> {
  const usuario = await exigirUsuario();
  const estado = await executar(() => reordenarEtapas(obterDb(), usuario, cicloId, ids));
  revalidatePath("/", "layout");
  return estado;
}
