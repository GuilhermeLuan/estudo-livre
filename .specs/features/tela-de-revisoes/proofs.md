# tela-de-revisoes proofs

**HEAD**: b668950
**Tree**: clean
**Shell**: /bin/sh
**Result**: 51 pass, 0 fail

| Check | Proof | Result |
| --- | --- | --- |
| C1 | `browser captures/hoje.running.png` | pass |
| C2 | `run unit / ✓ tests/lista-de-revisoes.test.ts > revisões vencidas > conta como vencida a Revisão com próxima da` | pass |
| C3 | `walk - na Hoje, o indicador "Revisões de hoje" mostra o total de vencidas dos dois Ciclos e nenhum chip` | pass (Walked) |
| C4 | `walk - ao escolher um Ciclo no cartão, o Counter passa ao número de vencidas dele` | pass (Walked) |
| C5 | `walk - no cartão, uma Revisão atrasada mostra o chip rosa "Atrasada 2d" e uma de hoje o chip amarelo "Hoje", a` | pass (Walked) |
| C6 | `run unit / ✓ tests/lista-de-revisoes.test.ts > revisões vencidas > ordena do vencimento mais antigo ao mais no` | pass |
| C7 | `run unit / ✓ tests/lista-de-revisoes.test.ts > revisões vencidas > o limite devolve só as mais atrasadas e man` | pass |
| C8 | `run unit / ✓ tests/lista-de-revisoes.test.ts > revisões vencidas > o filtro por Ciclo lista e conta só as Revi` | pass |
| C9 | `run unit / ✓ tests/lista-de-revisoes.test.ts > revisões vencidas > sem filtro lista as de todos os Ciclos ativ` | pass |
| C10 | `walk - com um Ciclo escolhido no cartão, "Ver todas as revisões" abre /revisoes?ciclo=<id> com o mesmo Ciclo m` | pass (Walked) |
| C11 | `walk - o cartão da Hoje mostra o aviso com esse texto` | pass (Walked) |
| C12 | `walk - com um Ciclo sem vencidas escolhido, o cartão mostra "Nenhuma revisão vencida." e não mostra o link` | pass (Walked) |
| C13 | `browser captures/pwa-hoje.running.png` | pass |
| C14 | `walk - "Registrar" numa Revisão abre o modal "Registrar estudo" com a Matéria, o Tópico e a data de hoje` | pass (Walked) |
| C15 | `run unit / ✓ tests/cronometro.test.ts > Tópico do Cronômetro > inicia guardando o Tópico` | pass |
| C16 | `run unit / ✓ tests/cronometro.test.ts > Tópico do Cronômetro > parar devolve o Tópico para o registro` | pass |
| C17 | `walk - o ▶ de uma Revisão inicia o Cronômetro e "Parar e registrar" abre o modal com a Matéria, o Tópico e a d` | pass (Walked) |
| C18 | `run unit / ✓ tests/cronometro.test.ts > Tópico do Cronômetro > recusa o início com Cronômetro existente, com a` | pass |
| C19 | `run unit / ✓ tests/cronometro.test.ts > Tópico do Cronômetro > descartar apaga sem criar Registro` | pass |
| C20 | `run unit / ✓ tests/cronometro.test.ts > Tópico do Cronômetro > excluir o Tópico mantém o Cronômetro sem Tópico` | pass |
| C21 | `run unit / ✓ tests/lista-de-revisoes.test.ts > cumprir a Revisão > um Registro com questões tira a Revisão de ` | pass |
| C22 | `run unit / ✓ tests/lista-de-revisoes.test.ts > cumprir a Revisão > um Registro sem questões mantém a Revisão e` | pass |
| C23 | `browser captures/revisoes.running.png` | pass |
| C24 | `walk - em /revisoes o subtítulo mostra os totais e muda ao escolher um Ciclo` | pass (Walked) |
| C25 | `walk - uma linha de Vencidas mostra as oito informações` | pass (Walked) |
| C26 | `walk - uma linha de Próximos 7 dias tem o chip cinza e nenhum ▶` | pass (Walked) |
| C27 | `run unit / ✓ tests/lista-de-revisoes.test.ts > revisões vencidas > traz última nota e acerto do Registro mais ` | pass |
| C28 | `run unit / ✓ tests/lista-de-revisoes.test.ts > revisões vencidas > traz nulos sem Registro com nota` | pass |
| C29 | `run unit / ✓ tests/lista-de-revisoes.test.ts > revisões vencidas > ordena do vencimento mais antigo ao mais no` | pass |
| C30 | `run unit / ✓ tests/lista-de-revisoes.test.ts > revisões vencidas > o filtro vale nas duas seções e nos totais` | pass |
| C31 | `walk - /revisoes mostra o aviso com o texto da Hoje` | pass (Walked) |
| C32 | `run unit / ✓ tests/lista-de-revisoes.test.ts > revisões vencidas > um Ciclo desconhecido, de outro Usuário ou ` | pass |
| C33 | `walk - com um Ciclo sem Revisões escolhido, a página mostra "Nenhuma revisão vencida." e não mostra "Próximos ` | pass (Walked) |
| C34 | `run unit / ✓ tests/lista-de-revisoes.test.ts > revisões vencidas > sem Ciclo ativo não há Revisão` | pass |
| C35 | `walk - em 390px /revisoes mostra cada Revisão em linha, sem rolagem horizontal` | pass (Walked) |
| C36 | `browser captures/revisoes.running.png` | pass |
| C37 | `walk - com Revisões vencidas, o item "Revisões" da Sidebar mostra o Counter com o total` | pass (Walked) |
| C38 | `walk - sem Revisões vencidas, o item "Revisões" da Sidebar não mostra Counter` | pass (Walked) |
| C39 | `browser captures/pwa-hoje.running.png` | pass |
| C40 | `walk - em /revisoes o item da Sidebar e a aba têm aria-current="page"` | pass (Walked) |
| C41 | `run unit / ✓ tests/lista-de-revisoes.test.ts > Ciclo arquivado > as Revisões do Ciclo arquivado somem da lista` | pass |
| C42 | `run unit / ✓ tests/lista-de-revisoes.test.ts > Ciclo arquivado > reativar devolve as Revisões com as mesmas da` | pass |
| C43 | `run unit / ✓ tests/lista-de-revisoes.test.ts > Ciclo arquivado > arquivar e reativar não alteram os Cartões` | pass |
| C44 | `run unit / ✓ tests/lista-de-revisoes.test.ts > Ciclo arquivado > reativado depois da data, a Revisão volta ven` | pass |
| C45 | `run unit / ✓ tests/lista-de-revisoes.test.ts > revisões vencidas > Cartão sem data não aparece nem conta` | pass |
| C46 | `run unit / ✓ tests/lista-de-revisoes.test.ts > revisões vencidas > excluir o Tópico tira a Revisão` | pass |
| C47 | `run unit / ✓ tests/lista-de-revisoes.test.ts > revisões vencidas > classifica pelo dia de Brasília, não pelo d` | pass |
| C48 | `run unit / ✓ tests/lista-de-revisoes.test.ts > revisões vencidas > Revisões de outro Usuário não aparecem` | pass |
| C49 | `run unit / ✓ tests/lista-de-revisoes.test.ts > revisões vencidas > os próximos 7 dias vão de amanhã a hoje mai` | pass |
| Build | `npm run typecheck` | pass |
| Build | `npm run build` | pass |

## Output

`Run unit` - exit 0

```

stderr | tests/conta.test.ts > conta e instância > com o cadastro desligado, não é possível criar conta
2026-11-22T15:25:07.121Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/conta.test.ts > conta e instância > com o cadastro desligado, não é possível criar conta
2026-11-22T15:25:07.207Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/conta.test.ts > conta e instância > com o cadastro desligado, o primeiro Usuário ainda pode se cadastrar
2026-11-22T15:25:07.323Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/volta-do-ciclo.test.ts > progresso na tela do Ciclo > cada Etapa traz o feito, e o Ciclo traz a Volta, os totais e as Matérias com progresso
2026-11-22T15:25:08.277Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/volta-do-ciclo.test.ts > progresso na tela do Ciclo > depois de fechar a Volta, mostra a Volta 2 com o instante em que abriu e soma as horas extras
2026-11-22T15:25:08.481Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.
```
