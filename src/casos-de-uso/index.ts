// Módulo de casos de uso: única porta de entrada do domínio, chamada pelas
// server actions e pelos testes. Toda operação recebe o Usuário.
export { prepararCadastro, CadastroFechadoError } from "./conta";
export { obterHome, type CicloDaHome, type Home } from "./home";
export type { EtapaComProgresso, MateriaComProgresso } from "./progresso";
export type { Usuario } from "./usuario";
export { listarUsuarios, redefinirSenha, NaoAutorizadoError, SenhaInvalidaError, UsuarioNaoEncontradoError, type UsuarioListado } from "./admin";
export {
  adicionarEtapa,
  criarCiclo,
  editarEtapa,
  obterCiclo,
  removerEtapa,
  renomearCiclo,
  reordenarEtapas,
  type CicloDetalhe,
  type EtapaDoCiclo,
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
export { obterEstatisticas, type Estatisticas, type MateriaNasEstatisticas } from "./estatisticas";
export { instanteDoDia, registrarEstudo, type DadosDoEstudo, type OpcoesDoRegistro } from "./estudo";
export { NaoEncontradoError, ValidacaoError } from "./erros";
