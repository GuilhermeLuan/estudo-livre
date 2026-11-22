// Módulo de casos de uso: única porta de entrada do domínio, chamada pelas
// server actions e pelos testes. Toda operação recebe o Usuário.
export { prepararCadastro, CadastroFechadoError } from "./conta";
export { obterHome, type CicloArquivado, type CicloDaHome, type Home, type Indicadores } from "./home";
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
export { editarRegistro, excluirRegistro, listarRegistros, LIMITE_DA_LISTA, type RegistroDoHistorico, type FiltroDeRegistros, type ListaDeRegistros } from "./registros";
export { listarFaixasDosCiclos, obterFaixas, salvarFaixas, type FaixasDoCiclo } from "./faixas";
export { estimarProximaRevisao, obterCartao, recalcularTopico, type RascunhoDeRegistro } from "./revisao";
export { listarVoltas, reiniciarVolta, type VoltaDoHistorico } from "./voltas";
export { copiarMateria, listarMateriasCopiaveis, type MateriaCopiavel } from "./copiar-materia";
export { arquivarCiclo, reativarCiclo } from "./arquivados";
export { NaoEncontradoError, ValidacaoError } from "./erros";
export {
  criarTopico,
  excluirTopico,
  importarTopicos,
  listarTopicosDasMaterias,
  marcarTopico,
  obterMateria,
  renomearTopico,
  type MateriaComTopicos,
  type TopicoDaMateria,
} from "./topicos";
export { exportarBackup, importarBackup, nomeDoArquivoDeBackup, type Backup } from "./backup";
