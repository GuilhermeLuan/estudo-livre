import { and, eq } from "drizzle-orm";
import type { Db } from "@/db";
import { ciclo } from "@/db/schema";
import { validarFaixas, type Faixas } from "@/revisao";
import { ESCRITA_EM_ARQUIVADO, NaoEncontradoError, ValidacaoError } from "./erros";
import type { Usuario } from "./usuario";

export type FaixasDoCiclo = Faixas & { minimo: number };

const colunas = { erreiAte: ciclo.faixaErreiAte, dificilAte: ciclo.faixaDificilAte, bomAte: ciclo.faixaBomAte, minimo: ciclo.minimoDeQuestoes };

export async function obterFaixas(db: Db, usuario: Usuario, cicloId: string): Promise<FaixasDoCiclo> {
  const [linha] = await db.select(colunas).from(ciclo).where(and(eq(ciclo.id, cicloId), eq(ciclo.usuarioId, usuario.id)));
  if (!linha) throw new NaoEncontradoError("Ciclo");
  return linha;
}

/** Só vale para os Registros seguintes: as notas já gravadas não mudam. */
export async function salvarFaixas(db: Db, usuario: Usuario, cicloId: string, dados: FaixasDoCiclo): Promise<void> {
  const erro = validarFaixas(dados);
  if (erro) throw new ValidacaoError(erro.mensagem);
  const [atual] = await db.select({ arquivadoEm: ciclo.arquivadoEm }).from(ciclo).where(and(eq(ciclo.id, cicloId), eq(ciclo.usuarioId, usuario.id)));
  if (!atual) throw new NaoEncontradoError("Ciclo");
  if (atual.arquivadoEm) throw new ValidacaoError(ESCRITA_EM_ARQUIVADO);
  const salvos = await db
    .update(ciclo)
    .set({ faixaErreiAte: dados.erreiAte, faixaDificilAte: dados.dificilAte, faixaBomAte: dados.bomAte, minimoDeQuestoes: dados.minimo })
    .where(and(eq(ciclo.id, cicloId), eq(ciclo.usuarioId, usuario.id)))
    .returning({ id: ciclo.id });
  if (salvos.length === 0) throw new NaoEncontradoError("Ciclo");
}

/** As Faixas de cada Ciclo do Usuário, por id do Ciclo. */
export async function listarFaixasDosCiclos(db: Db, usuario: Usuario): Promise<Map<string, FaixasDoCiclo>> {
  const linhas = await db.select({ id: ciclo.id, ...colunas }).from(ciclo).where(eq(ciclo.usuarioId, usuario.id));
  return new Map(linhas.map(({ id, ...faixas }) => [id, faixas]));
}
