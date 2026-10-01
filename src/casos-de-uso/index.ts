// Módulo de casos de uso: única porta de entrada do domínio, chamada pelas
// server actions e pelos testes. Toda operação recebe o Usuário.
export { prepararCadastro, CadastroFechadoError } from "./conta";
export { obterHome, type CicloDaHome, type Home } from "./home";
export type { MateriaComProgresso } from "./progresso";
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
export {
  descartarCronometro,
  iniciarCronometro,
  obterCronometro,
  pararCronometro,
  pausarCronometro,
  retomarCronometro,
  type CronometroAtivo,
  type CronometroParado,
  type SugestaoDeRegistro,
} from "./cronometro";
export { instanteDoDia, registrarEstudo, type DadosDoEstudo, type OpcoesDoRegistro } from "./estudo";
export { NaoEncontradoError, ValidacaoError } from "./erros";
