"use server";

import { revalidatePath } from "next/cache";
import { importarBackup, ValidacaoError } from "@/casos-de-uso";
import { obterDb } from "@/db";
import { exigirUsuario } from "@/sessao";

export type EstadoBackup = { erro?: string; aviso?: string };

/** "Importar backup": o arquivo vem no campo `arquivo`; troca todos os Ciclos do Usuário pelos dele (AD-032). */
export async function importar(dados: FormData): Promise<EstadoBackup> {
  const usuario = await exigirUsuario();
  const arquivo = dados.get("arquivo");
  // Um arquivo escolhido e vazio segue para o caso de uso, que o recusa como inválido.
  if (!(arquivo instanceof File) || arquivo.name === "") return { erro: "Escolha um arquivo." };
  try {
    const { ciclos } = await importarBackup(obterDb(), usuario, await arquivo.text());
    revalidatePath("/", "layout");
    return { aviso: `Backup importado: ${ciclos} ${ciclos === 1 ? "ciclo" : "ciclos"}.` };
  } catch (erro) {
    if (erro instanceof ValidacaoError) return { erro: erro.message };
    throw erro;
  }
}
