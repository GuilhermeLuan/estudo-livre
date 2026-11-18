# Cartão de revisão verification

**Verdict**: FAIL
**Proofs**: `proofs.md` at 0469edd
**Verifier**: independent sub-agent (author != verifier)

## Checks

| Check | Test | Holds |
| --- | --- | --- |
| C1 | cartoes.test.ts `o primeiro registro de um Tópico cria o Cartão` | no - só `toBeInstanceOf(Date)`; qualquer data passa (valor coberto por C8) |
| C2 | cartoes.test.ts `primeiro registro sem questões cria o Cartão sem data` | yes |
| C3 | revisao.test.ts `conversão de nota pelas Faixas padrão` | yes - os 6 valores da spec |
| C4 | cartoes.test.ts `questões no mínimo sugerem a nota das Faixas e aceitam a escolhida` | yes - 5 questões (fronteira), escolhida vence |
| C5 | cartoes.test.ts `abaixo do mínimo vale a nota escolhida` | no - grava Difícil mas o Cartão só é checado como `Date` |
| C6 | cartoes.test.ts `abaixo do mínimo sem nota recusa e não grava nada` | yes - mensagem exata, sem Registro nem Cartão |
| C7 | cartoes.test.ts `registro sem questões não altera o Cartão` | yes |
| C8 | cartoes.test.ts `a nota é aplicada na data do registro` | yes |
| C9 | cartoes.test.ts `criar, editar e excluir dão o Cartão do recálculo do zero` | yes - compara data e estado com a reaplicação |
| C10 | cartoes.test.ts `trocar Matéria ou Tópico recalcula os dois Cartões` | yes |
| C11 | cartoes.test.ts `registro retroativo entra na ordem cronológica` | yes |
| C12 | cartoes.test.ts `excluir o último registro remove o Cartão e o log` | yes |
| C13 | cartoes.test.ts `editar para sem questões apaga a nota` | yes |
| C14 | cartoes.test.ts `um item por registro com nota` | yes |
| C15 | cartoes.test.ts `excluir o Tópico remove Cartão e log e mantém os Registros` | yes |
| C16 | migracao-cartoes.test.ts `cria os Cartões dos Registros que já existem` | no - nenhum Registro com exatamente 5 questões nem com Acertos vazio; `>= 5` virar `> 5` ou sumir o `coalesce` passa |
| C17 | cartoes.test.ts `Cartão e Registros de outro Usuário não mudam` | yes |
| C18 | n/a (browser) | n/a - walk/browser, julgado na visita/telas |
| C19 | revisao.test.ts `a frase da faixa traz a porcentagem e a faixa` | yes |
| C20 | revisao.test.ts `abaixo do Mínimo não há sugestão e a frase pede a nota` | yes |
| C21 | n/a (walk) | n/a - walk/browser, julgado na visita/telas |
| C22 | n/a (walk) | n/a - walk/browser, julgado na visita/telas |
| C23 | cartoes.test.ts `a data estimada é a do Cartão depois de salvar` | yes - novo, hoje, retroativo e edição |
| C24 | cartoes.test.ts `sem Tópico ou sem data não há estimativa` | yes |
| C25 | n/a (walk) | n/a - walk/browser, julgado na visita/telas |
| C26 | cartoes.test.ts `o histórico devolve a nota gravada do Registro` | no - prova só que `listarRegistros` devolve a nota; a nota marcada no modal e a sugestão pelas Faixas atuais (2a metade do AC) não têm teste 09cff11 |
| C27 | n/a (walk) | n/a - walk/browser, julgado na visita/telas |
| C28 | n/a (browser) | n/a - walk/browser, julgado na visita/telas |
| C29 | faixas.test.ts `todo Ciclo tem as Faixas 60, 75 e 90 e o Mínimo 5` | yes |
| C30 | n/a (walk) | n/a - walk/browser, julgado na visita/telas |
| C31 | faixas.test.ts `salvar valores válidos grava` | yes - inclui os extremos 1, 100, 1000 |
| C32 | faixas.test.ts `valores inválidos são recusados e os gravados ficam` | yes - 7 casos; cada limite não tem os dois lados (ex. `dificilAte` 101), validado também em revisao.test.ts |
| C33 | faixas.test.ts `mudar as Faixas só vale para os Registros seguintes` | yes |
| C34 | n/a (walk) | n/a - walk/browser, julgado na visita/telas |
| C35 | faixas.test.ts `o Ciclo de outro Usuário não aparece nem muda` | yes |
| C36 | formato.test.ts `texto com a data` | yes - testa o formatador, não a lista renderizada |
| C37 | formato.test.ts `sem data` | yes - idem |
| C38 | n/a (walk) | n/a - walk/browser, julgado na visita/telas |
| C39 | topicos.test.ts `a Matéria traz a data de cada Tópico` | yes |

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| Migração: fronteira `questoes >= 5` e `coalesce(acertos,0)` sem teste | `tests/migracao-cartoes.test.ts` só tem 20, 3 e 10 questões, todas com acertos; `drizzle/0006_dashing_the_enforcers.sql` (C16) | incluir Registro com 5 questões, outro com 4 e outro com Acertos vazio e questões >= 5 709182b |
| C1 e C5 só provam que a data é um `Date` | `tests/cartoes.test.ts:74` e `:117` - `toBeInstanceOf(Date)` | comparar com `recalcularCartao` da nota esperada (Bom e Difícil) 709182b |
| C26 não cobre o que o AC pede no modal de edição | só `listarRegistros` devolve `nota`; `formulario-de-registro.tsx:81` guarda a nota gravada como escolhida, então editar acertos não refaz a sugestão e a "sugestão pelas Faixas atuais" do AC 9 não tem check nem teste | acrescentar check (walk) para a edição ou decidir na spec se a nota gravada conta como escolhida 09cff11 |

Exemplos próprios rodados e verdes (descartados): 179/200 = 89,5% dá Fácil, 149/200 dá Bom, 119/200 dá Difícil; 4 registros simultâneos com a mesma data/hora no mesmo Tópico dão o Cartão da reaplicação; edição que move Registro para Matéria de Ciclo com outras Faixas: estimativa igual ao Cartão salvo, nota pelas Faixas do Ciclo de destino, Cartão de origem removido; retroativo com o mesmo dia de outro Registro: estimativa igual ao Cartão. Capturas binding: sem contradição com a spec (diferenças listadas em Differences from the source).
