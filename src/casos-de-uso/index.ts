// Módulo de casos de uso: única porta de entrada do domínio, chamada pelas
// server actions e pelos testes. Toda operação recebe o Usuário.
export { prepararCadastro, CadastroFechadoError } from "./conta";
export { obterHome, type Home } from "./home";
export type { Usuario } from "./usuario";
export { listarUsuarios, redefinirSenha, NaoAutorizadoError, SenhaInvalidaError, UsuarioNaoEncontradoError, type UsuarioListado } from "./admin";
export {
  adicionarMateria,
  criarCiclo,
  editarMateria,
  obterCiclo,
  removerMateria,
  renomearCiclo,
  reordenarMaterias,
  type CicloDetalhe,
} from "./ciclos";
export { NaoEncontradoError, ValidacaoError } from "./erros";
