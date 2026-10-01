"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  adicionarMateria,
  criarCiclo,
  editarMateria,
  NaoEncontradoError,
  removerMateria,
  renomearCiclo,
  reordenarMaterias,
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

export async function novaMateria(cicloId: string, _: EstadoCiclo, dados: FormData): Promise<EstadoCiclo> {
  const usuario = await exigirUsuario();
  const estado = await executar(async () => {
    await adicionarMateria(obterDb(), usuario, cicloId, { nome: texto(dados, "nome"), cargaMinutos: minutos(dados) });
  });
  revalidatePath("/", "layout");
  return estado;
}

export async function salvarMateria(materiaId: string, _: EstadoCiclo, dados: FormData): Promise<EstadoCiclo> {
  const usuario = await exigirUsuario();
  const estado = await executar(() =>
    editarMateria(obterDb(), usuario, materiaId, { nome: texto(dados, "nome"), cargaMinutos: minutos(dados) }),
  );
  revalidatePath("/", "layout");
  return estado;
}

export async function excluirMateria(materiaId: string): Promise<EstadoCiclo> {
  const usuario = await exigirUsuario();
  const estado = await executar(() => removerMateria(obterDb(), usuario, materiaId));
  revalidatePath("/", "layout");
  return estado;
}

/** `ids` é a nova ordem completa das Matérias do Ciclo. */
export async function moverMateria(cicloId: string, ids: string[]): Promise<EstadoCiclo> {
  const usuario = await exigirUsuario();
  const estado = await executar(() => reordenarMaterias(obterDb(), usuario, cicloId, ids));
  revalidatePath("/", "layout");
  return estado;
}
