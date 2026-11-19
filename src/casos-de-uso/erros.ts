export class NaoEncontradoError extends Error {
  constructor(o: string) {
    super(`${o} não encontrado.`);
  }
}

export class ValidacaoError extends Error {}

/** Mensagem de toda escrita recusada por o Ciclo estar arquivado (AD-024). */
export const ESCRITA_EM_ARQUIVADO = "Ciclo arquivado. Reative para alterar.";
