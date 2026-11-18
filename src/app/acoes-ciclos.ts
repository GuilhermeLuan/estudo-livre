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
  reiniciarVolta,
  reordenarEtapas,
  ValidacaoError,
} from "@/casos-de-uso";
import { obterDb } from "@/db";
import { avisoDaVoltaConcluida } from "./formato";
import { exigirUsuario } from "@/sessao";

export type EstadoCiclo = { erro?: string; aviso?: string };

function texto(dados: FormData, campo: string) {
  return String(dados.get(campo) ?? "").trim();
}

/** Carga horária digitada em horas (aceita vírgula ou ponto), guardada em minutos. */
function minutos(dados: FormData) {
  return Math.round(Number(texto(dados, "horas").replace(",", ".")) * 60);
}

/** `operacao` devolve o número da Volta que fechou, se fechou: vira o aviso da tela (AD-018). */
async function executar(operacao: () => Promise<unknown>): Promise<EstadoCiclo> {
  let fechada: number | null = null;
  try {
    const resultado = await operacao();
    const numero = resultado && typeof resultado === "object" && "voltaFechada" in resultado ? resultado.voltaFechada : resultado;
    if (typeof numero === "number") fechada = numero;
  } catch (erro) {
    if (erro instanceof ValidacaoError) return { erro: erro.message };
    if (erro instanceof NaoEncontradoError) return { erro: "Não encontramos este item. Atualize a página." };
    throw erro;
  }
  return fechada ? { aviso: avisoDaVoltaConcluida(fechada) } : {};
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
    return adicionarEtapa(obterDb(), usuario, cicloId, { nome: texto(dados, "nome"), cargaMinutos: minutos(dados) });
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

/** `numero` é a Volta que o Usuário viu aberta; se já mudou, o caso de uso recusa (reinício duplicado). */
export async function reiniciar(cicloId: string, numero: number): Promise<EstadoCiclo> {
  const usuario = await exigirUsuario();
  const estado = await executar(async () => void (await reiniciarVolta(obterDb(), usuario, cicloId, numero)));
  revalidatePath("/", "layout");
  return estado;
}
