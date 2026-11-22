import { exportarBackup, nomeDoArquivoDeBackup } from "@/casos-de-uso";
import { obterDb } from "@/db";
import { exigirUsuario } from "@/sessao";

/** Baixa o backup do Usuário da sessão; sem sessão, `exigirUsuario` leva a /entrar. */
export async function GET() {
  const usuario = await exigirUsuario();
  const agora = new Date();
  return Response.json(await exportarBackup(obterDb(), usuario, agora), {
    headers: { "Content-Disposition": `attachment; filename="${nomeDoArquivoDeBackup(agora)}"`, "Cache-Control": "no-store" },
  });
}
