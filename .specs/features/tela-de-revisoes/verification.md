# Tela de revisões verification

**Verdict**: PASS (achados fechados em 99f53e2; a divergência de tela, em ce1e286)
**Proofs**: `proofs.md` at 4d6aa7e
**Verifier**: independent sub-agent (author != verifier)

## Checks

| Check | Test | Holds |
| --- | --- | --- |
| C1 | browser captures/hoje.running.png | yes - judged by screens |
| C2 | `lista-de-revisoes.test.ts` `conta como vencida a Revisão com próxima data hoje ou antes` | yes - -2/0/+1 com atraso exato; Ciclo ativo coberto por C41 |
| C3 | walk - indicador na Hoje com dois Ciclos | yes - a visita registrada (`**Walked:**`, usuária Marina) cobre o estado; o valor vem de `totalVencidasGeral`, provado em C8; não refiz a visita |
| C4 | walk - Counter do cartão ao escolher um Ciclo | yes - mesma ressalva: visita registrada; `totalVencidas` do filtro provado em C8/C30 |
| C5 | walk - chips Atrasada 2d / Hoje no cartão | yes - visita registrada; as cores e textos do chip também estão em `formato.test.ts` `atrasada mostra os dias...` |
| C6 | `lista-de-revisoes.test.ts` `ordena do vencimento mais antigo ao mais novo, com desempate pelo nome do Tópico` | yes - dias distintos, empate Delta/Zebra e hoje por último |
| C7 | `lista-de-revisoes.test.ts` `o limite devolve só as mais atrasadas e mantém o total completo` | no - prova o corte com `limiteVencidas: 2`, não o 6 do cartão; `LIMITE_DO_CARTAO = 6` está em `src/app/(app)/page.tsx` sem teste, só a visita da C5 o toca |
| C8 | `lista-de-revisoes.test.ts` `o filtro por Ciclo lista e conta só as Revisões do Ciclo` | yes - lista, `totalVencidas` e `totalVencidasGeral` com dois Ciclos |
| C9 | `lista-de-revisoes.test.ts` `sem filtro lista as de todos os Ciclos ativos` | yes - dois Ciclos, ordem e `filtro` nulo |
| C10 | walk - Ver todas as revisões com o mesmo filtro | yes - visita registrada; o href `/revisoes?ciclo=${filtro}` é lido em `cartao-de-revisoes.tsx` |
| C11 | walk - aviso no cartão | yes - visita registrada; texto em constante única `AVISO_DA_REVISAO` |
| C12 | walk - Ciclo sem vencidas no cartão | yes - visita registrada (usuária `vazia`); a condição `vencidas.length > 0` está no componente |
| C13 | browser captures/pwa-hoje.running.png | yes - judged by screens |
| C14 | walk - Registrar abre o modal com Matéria, Tópico e data | yes - visita registrada; sem teste automatizado da pré-seleção |
| C15 | `cronometro.test.ts` `inicia guardando o Tópico` | yes - `topicoId` exato e Matéria |
| C16 | `cronometro.test.ts` `parar devolve o Tópico para o registro` | yes - `toEqual` com Matéria, Tópico, duração 25 e `passouDoLimite` |
| C17 | walk - ▶ inicia e Parar e registrar abre o modal | yes - visita registrada; a parte de dados é C16 |
| C18 | `cronometro.test.ts` `recusa o início com Cronômetro existente, com a mensagem` | yes - ativo e pausado, mensagem exata, Cronômetro original intacto (o botão habilitado é de tela, sem check) |
| C19 | `cronometro.test.ts` `descartar apaga sem criar Registro` | yes - Cronômetro nulo e tabela de Registros vazia |
| C20 | `cronometro.test.ts` `excluir o Tópico mantém o Cronômetro sem Tópico` | yes - mantém Matéria e segundos, `topicoId` nulo, e o parar também devolve nulo |
| C21 | `lista-de-revisoes.test.ts` `um Registro com questões tira a Revisão de Vencidas` | yes - verifica antes presente e depois vazia, lista e contagem |
| C22 | `lista-de-revisoes.test.ts` `um Registro sem questões mantém a Revisão em Vencidas` | yes - Teoria sem questões mantém na lista e na contagem |
| C23 | browser captures/revisoes.running.png | yes - judged by screens |
| C24 | walk - subtítulo com totais e filtro | yes - visita registrada; o singular "1 vencida" do código foge de "N vencidas" (ver achado) |
| C25 | walk - linha de Vencidas com as oito informações | yes - visita registrada |
| C26 | walk - linha de Próximos 7 dias com chip cinza e sem ▶ | yes - visita registrada |
| C27 | `lista-de-revisoes.test.ts` `traz última nota e acerto do Registro mais recente com nota` | yes - três Registros, o mais novo sem nota é ignorado, "Errei" e 40 exatos |
| C28 | `lista-de-revisoes.test.ts` `traz nulos sem Registro com nota` | yes - nulos em vencida e em próxima, com Registro sem nota |
| C29 | `lista-de-revisoes.test.ts` `ordena do vencimento mais antigo ao mais novo, com desempate pelo nome do Tópico` | no - a ordem só é afirmada em `vencidas`; `proximas` nunca tem dois itens no mesmo dia nem fora de ordem de inserção |
| C30 | `lista-de-revisoes.test.ts` `o filtro vale nas duas seções e nos totais` | yes - um item por seção do Ciclo escolhido e dois totais exatos |
| C31 | walk - aviso na página | yes - visita registrada; mesmo componente `AvisoDaRevisao` |
| C32 | `lista-de-revisoes.test.ts` `um Ciclo desconhecido, de outro Usuário ou arquivado vale Todos` | yes - cinco entradas (inexistente, outro Usuário, arquivado, vazio, nulo) com `filtro` nulo e lista de Todos |
| C33 | walk - Ciclo sem Revisões na página | yes - visita registrada (usuária `vazia`) |
| C34 | `lista-de-revisoes.test.ts` `sem Ciclo ativo não há Revisão` | yes - `toEqual` do objeto inteiro e contagem zero |
| C35 | walk - 390px sem rolagem horizontal | yes - visita registrada; sem medição automatizada |
| C36 | browser captures/revisoes.running.png | yes - judged by screens |
| C37 | walk - Counter no item da Sidebar | yes - visita registrada; o valor é `contarRevisoesVencidas`, provado em C2/C41 |
| C38 | walk - item sem Counter | yes - visita registrada (usuária `vazia`) |
| C39 | browser captures/pwa-hoje.running.png | yes - judged by screens |
| C40 | walk - aria-current em Sidebar e aba | yes - visita registrada |
| C41 | `lista-de-revisoes.test.ts` `as Revisões do Ciclo arquivado somem da lista e do total` | yes - vencida e próxima sumem, filtro de Ciclos e as duas contagens |
| C42 | `lista-de-revisoes.test.ts` `reativar devolve as Revisões com as mesmas datas` | yes - `toEqual` do resultado antes e depois, mais os dias esperados |
| C43 | `lista-de-revisoes.test.ts` `arquivar e reativar não alteram os Cartões` | yes - `select *` igual após arquivar e após reativar |
| C44 | `lista-de-revisoes.test.ts` `reativado depois da data, a Revisão volta vencida com o atraso até hoje` | yes - atraso exato 7 e `proximas` vazia (relógio avançado, não reativação real) |
| C45 | `lista-de-revisoes.test.ts` `Cartão sem data não aparece nem conta` | yes - lista, `proximas`, total geral e contagem |
| C46 | `lista-de-revisoes.test.ts` `excluir o Tópico tira a Revisão` | yes - sobra só o outro Tópico, lista e contagem |
| C47 | `lista-de-revisoes.test.ts` `classifica pelo dia de Brasília, não pelo de UTC` | yes - 23:00 e 00:30 de Brasília em lados opostos, dia e atraso exatos, e a contagem |
| C48 | `lista-de-revisoes.test.ts` `Revisões de outro Usuário não aparecem` | yes - lista da Ana e contagem da Bia (a lista da Bia não é afirmada) |
| C49 | `lista-de-revisoes.test.ts` `os próximos 7 dias vão de amanhã a hoje mais 7, inclusive` | yes - hoje, +1, +7 e +8 com `diasDeAtraso` exatos |

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| C29 não prova a ordem de "Próximos 7 dias" | `tests/lista-de-revisoes.test.ts` `ordena do vencimento mais antigo...` só afirma `lista.vencidas`; nenhum teste tem duas próximas no mesmo dia ou fora da ordem de inserção, então trocar o `orderBy` das próximas não falha nada | afirmar a ordem e o desempate por nome também em `proximas` (ex.: três Tópicos em +3, +3 e +2) | 99f53e2 - C29 (o teste de ordem agora afirma `proximas` com empate) |
| C7 não prova o limite 6 do cartão | o teste usa `limiteVencidas: 2`; `LIMITE_DO_CARTAO = 6` está em `src/app/(app)/page.tsx` e nada o testa, então mudar para 5 ou 8 passa verde | extrair a constante para o caso de uso ou testar com 7 vencidas e o limite exportado; a visita só mostra 8 vencidas com 6 linhas se o filtro for Todos | 99f53e2 - C7 (novo teste com 8 vencidas e `LIMITE_DO_CARTAO_DE_REVISOES`, que afirma 6) |
| Subtítulo no singular fora do spec | `src/app/(app)/revisoes/page.tsx` `vencidas(n)` devolve "1 vencida"; o AC 2 e a captura fixam "N vencidas" e a seção `Differences from the source` não lista o singular | ou registrar a diferença em `Differences from the source` com Confirmed, ou usar sempre "vencidas" | 99f53e2 - o subtítulo mostra sempre "N vencidas" (C24) |

Sondas descartáveis no HEAD (rodaram verdes, arquivo removido): janela de 7 dias com dia 7 às 23:30 e 00:00 de Brasília e dia 8 às 00:30 cruzando o ano; atraso cruzando o mês; 60 Revisões em dois Ciclos com limite 6 e desempate (Tópicos inseridos em ordem inversa); filtro por Ciclo ativo sem Cartões; filtro por Ciclo de outro Usuário com os totais do Usuário. Nenhuma regra quebrou. Contra as capturas: sem contradição de rótulo nem controle sem critério (as cores das notas e os cabeçalhos da tabela não têm critério, mas não contradizem nada).
