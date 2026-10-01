export class NaoEncontradoError extends Error {
  constructor(o: string) {
    super(`${o} não encontrado.`);
  }
}

export class ValidacaoError extends Error {}
