# Arquivar e reativar ciclo verification

**Verdict**: FAIL
**Proofs**: `proofs.md` at 36d4361
**Verifier**: independent sub-agent (author != verifier)

## Checks

| Check | Test | Holds |
| --- | --- | --- |
| C1 | `browser captures/ciclo.running.png` vs `captures/ciclo.png` | n/a - walk |
| C2 | walk: "Arquivar" abre o diálogo com título, texto com o nome e os dois botões | n/a - walk |
| C3 | walk: "Cancelar" fecha o diálogo e o Ciclo segue na Sidebar | n/a - walk |
| C4 | `arquivados.test.ts` `arquivar marca o Ciclo como arquivado` | yes - `arquivadoEm` é Date, o outro Ciclo segue null, `obterHome.ciclos` perde o arquivado |
| C5 | walk: confirmar leva à Hoje sem o Ciclo | n/a - walk |
| C6 | `arquivados.test.ts` `recusa arquivar com o Cronômetro do Ciclo ativo` | yes - ValidacaoError, mensagem exata, `arquivadoEm` segue null. Só cobre Cronômetro rodando; sonda com pausado recusa também |
| C7 | `arquivados.test.ts` `arquivar e reativar não alteram o histórico` | yes - compara `select *` de 7 tabelas mais as faixas, antes/arquivado/reativado, com Registro e Cartão existentes |
| C8 | `arquivados.test.ts` `o Ciclo arquivado sai da Hoje e da Próxima etapa` | yes - lista de ids e `proxima.materiaId` do outro Ciclo |
| C9 | walk: Sidebar, menu do celular e Matéria sugerida sem o arquivado | n/a - walk |
| C10 | walk: seletor do modal sem as Matérias do arquivado | n/a - walk |
| C11 | `arquivados.test.ts` `arquivar duas vezes é idempotente` | yes - `arquivadoEm` idêntico após a segunda chamada |
| C12 | `arquivados.test.ts` `ciclo de outro Usuário ou inexistente não é encontrado` | yes - NaoEncontradoError para os dois ids e as duas operações, e o Ciclo não muda |
| C13 | walk: item "Arquivados" leva a `/ciclos/arquivados` | n/a - walk |
| C14 | walk: Counter "1" com 1 arquivado | n/a - walk |
| C15 | walk: sem arquivados, sem Counter | n/a - walk |
| C16 | walk: menu do avatar a 390px mostra "Arquivados" | n/a - walk |
| C17 | `arquivados.test.ts` `arquivados do mais recente ao mais antigo` | yes - datas forçadas fora da ordem de criação e de arquivamento; empate (`asc(ciclo.id)`) não é exercido |
| C18 | walk: cartão com nome (link), "Volta N", etapas e "Reativar" | n/a - walk |
| C19 | walk: "Nenhum ciclo arquivado." | n/a - walk |
| C20 | `arquivados.test.ts` `reativar devolve o Ciclo à Hoje com a mesma Volta e o mesmo progresso` | yes - `obterCiclo` igual antes/depois, volta 1 e feito 60 |
| C21 | walk: "Reativar" faz o Ciclo voltar à Hoje, Sidebar e modal | n/a - walk |
| C22 | `arquivados.test.ts` `reativar duas vezes é idempotente` | yes |
| C23 | walk: tela do arquivado em leitura, com "Reativar" | n/a - walk |
| C24 | `arquivados.test.ts` `Ciclo, Etapas, Volta e Faixas recusam a escrita` | yes - 7 escritas com mensagem exata, histórico, nome e faixas intactos, e depois da reativação as escritas passam |
| C25 | `arquivados.test.ts` `Tópicos recusam a escrita` | yes - 5 escritas com mensagem exata e histórico intacto |
| C26 | `arquivados.test.ts` `Registro novo, troca de Matéria e Cronômetro recusam` | yes - mensagem exata; Registro movido segue na Matéria original. Não confere que nenhuma linha de `cronometro` nasceu |
| C27 | `arquivados.test.ts` `editar e excluir Registros antigos continua permitido` | yes - depois de af2e685 a exclusão afirma `obterCartao` nulo |
| C28 | walk: editar Registro de arquivado abre o modal com a Matéria dele | n/a - walk |
| C29 | `arquivados.test.ts` `Registros e Estatísticas seguem contando o Ciclo arquivado` | yes - total 1 com e sem filtro, ciclo na lista das Estatísticas, minutos e questões |
| C30 | walk: filtros de Registros e Estatísticas listam o arquivado | n/a - walk |
| C31 | `arquivados.test.ts` `indicadores da Hoje seguem somando o Ciclo arquivado` | yes - `toEqual` dos indicadores antes/depois com 60 min e 10 questões |
| C32 | walk: único Ciclo arquivado deixa "Nenhum ciclo ainda" e Counter "1" | n/a - walk |
| C33 | `arquivados.test.ts` `arquiva com o Cronômetro de outro Ciclo` | yes |
| C34 | `arquivados.test.ts` `arquivar junto com iniciar o Cronômetro nunca deixa Cronômetro em Ciclo arquivado` | yes - 15 rodadas em paralelo; o teste falha no código anterior a af2e685 |

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| `iniciarCronometro` concorrente com `arquivarCiclo` deixa um Cronômetro numa Matéria de Ciclo arquivado (viola ARQ-02 e a recusa do AC 3 de ARQ-10) e nenhum teste falha | Sonda descartável: 25 rodadas de `Promise.allSettled([iniciarCronometro, arquivarCiclo])` no mesmo Ciclo, 24 terminaram com Cronômetro existente e Ciclo arquivado. `src/casos-de-uso/cronometro.ts:52-59` lê o Ciclo sem trava e insere depois; `arquivados.ts` trava o Ciclo, mas o início do Cronômetro não pega essa trava. O Registro daí falha com "Ciclo arquivado. Reative para alterar." e o Usuário só consegue descartar | Fazer `iniciarCronometro` ler o Ciclo com `for("update")` numa transação e checar `arquivadoEm` dentro dela (ou o `insert` condicionado a `arquivado_em is null`); teste com as duas chamadas em paralelo afirmando que não sobra Cronômetro em Ciclo arquivado |  af2e685 - `iniciarCronometro` trava o Ciclo numa transação e checa `arquivadoEm`; prova C34 |
| C27 afirma a exclusão sem afirmar o recálculo do Cartão | `arquivados.test.ts` (último bloco do teste): o Registro excluído é inserido à mão e o `expect` só compara os ids restantes; nenhum `obterCartao` depois do `excluirRegistro`. O critério ARQ-11 pede "recalculando o Cartão como hoje". Sonda: excluir o único Registro com acertos de um arquivado deixa `obterCartao` em null, então o código funciona, mas o teste passaria sem isso | Excluir o Registro que dá origem ao Cartão (o do `cenario`) e afirmar `obterCartao` null, ou outro valor esperado |  af2e685 - o teste cria o Cartão, exclui o Registro que o sustenta e afirma `obterCartao` nulo; prova C27 |
