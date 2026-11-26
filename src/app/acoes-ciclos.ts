"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  adicionarEtapa,
  arquivarCiclo,
  copiarMateria,
  criarCiclo,
  importarCiclo,
  editarEtapa,
  gerarEtapas,
  NaoEncontradoError,
  reativarCiclo,
  removerEtapa,
  renomearCiclo,
  reiniciarVolta,
  reordenarEtapas,
  ValidacaoError,
} from "@/casos-de-uso";
import { obterDb } from "@/db";
import { minutosDeHoras, type MateriaParaSugerir } from "@/dominio";
import { avisoDaVoltaConcluida } from "./formato";
import { exigirUsuario } from "@/sessao";

export type EstadoCiclo = { erro?: string; aviso?: string };

function texto(dados: FormData, campo: string) {
  return String(dados.get(campo) ?? "").trim();
}

/** Carga horária digitada em horas (aceita vírgula ou ponto), guardada em minutos. */
function minutos(dados: FormData) {
  return minutosDeHoras(texto(dados, "horas"));
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

/** As Matérias da Sugestão de ciclo, vindas do formulário como JSON; o caso de uso confere cada valor. */
function materiasDoFormulario(dados: FormData): MateriaParaSugerir[] {
  const ilegivel = new ValidacaoError("Não foi possível ler as matérias. Atualize a página e tente de novo.");
  let bruto: unknown;
  try {
    bruto = JSON.parse(texto(dados, "materias") || "[]");
  } catch {
    throw ilegivel;
  }
  if (!Array.isArray(bruto)) throw ilegivel;
  return bruto.map((m: Record<string, unknown> | null) => ({
    nome: String(m?.nome ?? ""),
    questoesDaProva: typeof m?.questoesDaProva === "number" ? m.questoesDaProva : Number.NaN,
    dificuldade: m?.dificuldade as MateriaParaSugerir["dificuldade"],
  }));
}

export async function novoCiclo(_: EstadoCiclo, dados: FormData): Promise<EstadoCiclo> {
  const usuario = await exigirUsuario();
  let id = "";
  const estado = await executar(async () => {
    const materias = materiasDoFormulario(dados);
    id = (await criarCiclo(obterDb(), usuario, { nome: texto(dados, "nome"), duracaoEtapaMinutos: minutos(dados), materias })).id;
  });
  if (estado.erro) return estado;
  redirect(`/ciclos/${id}`);
}

/**
 * "Importar ciclo": o JSON vem colado no campo `texto` ou como arquivo em `arquivo` (AD-050); cria um Ciclo novo
 * (AD-046) e abre a página dele (AD-049).
 */
export async function importarCicloDoJson(dados: FormData): Promise<EstadoCiclo> {
  const usuario = await exigirUsuario();
  const texto = dados.get("texto");
  const arquivo = dados.get("arquivo");
  let conteudo: string;
  if (typeof texto === "string") {
    if (!texto.trim()) return { erro: "Cole o JSON do ciclo." };
    conteudo = texto;
  } else if (arquivo instanceof File && arquivo.name !== "") {
    // Um arquivo escolhido e vazio segue para o caso de uso, que o recusa como JSON inválido.
    conteudo = await arquivo.text();
  } else return { erro: "Escolha um arquivo." };
  let id = "";
  const estado = await executar(async () => {
    id = (await importarCiclo(obterDb(), usuario, conteudo)).id;
  });
  if (estado.erro) return estado;
  revalidatePath("/", "layout");
  redirect(`/ciclos/${id}`);
}

/** "Gerar ciclo" na edição: refaz as Etapas do Ciclo e volta à página dele; a Volta que fechar vira aviso (AD-018). */
export async function gerarCiclo(cicloId: string, _: EstadoCiclo, dados: FormData): Promise<EstadoCiclo> {
  const usuario = await exigirUsuario();
  let fechada: number | null = null;
  const estado = await executar(async () => {
    const materias = materiasDoFormulario(dados);
    fechada = (await gerarEtapas(obterDb(), usuario, cicloId, { nome: texto(dados, "nome"), duracaoEtapaMinutos: minutos(dados), materias })).voltaFechada;
  });
  if (estado.erro) return estado;
  revalidatePath("/", "layout");
  redirect(fechada ? `/ciclos/${cicloId}?volta-concluida=${fechada}` : `/ciclos/${cicloId}`);
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
    const etapa = { nome: texto(dados, "nome"), cargaMinutos: minutos(dados) };
    const origemId = texto(dados, "origemId");
    return origemId ? copiarMateria(obterDb(), usuario, cicloId, { origemId, ...etapa }) : adicionarEtapa(obterDb(), usuario, cicloId, etapa);
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

/** Arquiva o Ciclo e leva à Hoje; se o caso de uso recusa (Cronômetro rodando), devolve o erro e fica na tela. */
export async function arquivar(cicloId: string): Promise<EstadoCiclo> {
  const usuario = await exigirUsuario();
  const estado = await executar(() => arquivarCiclo(obterDb(), usuario, cicloId));
  if (estado.erro) return estado;
  revalidatePath("/", "layout");
  redirect("/");
}

export async function reativar(cicloId: string): Promise<EstadoCiclo> {
  const usuario = await exigirUsuario();
  const estado = await executar(() => reativarCiclo(obterDb(), usuario, cicloId));
  revalidatePath("/", "layout");
  return estado;
}
