# sugestao-de-ciclo proofs

**HEAD**: 16a6b94
**Tree**: clean
**Shell**: /bin/sh
**Result**: 37 pass, 0 fail

| Check | Proof | Result |
| --- | --- | --- |
| C1 | `walk - abrir /ciclos/novo logado` | pass (Walked) |
| C2 | `walk - adicionar "Língua Portuguesa", depois tentar com o campo vazio` | pass (Walked) |
| C2 | `run vitest / ✓ recusa nome de Matéria vazio, repetido ou lista cheia` | pass |
| C3 | `walk - adicionar "Estatística" e depois "estatística"` | pass (Walked) |
| C3 | `run vitest / ✓ recusa nome de Matéria vazio, repetido ou lista cheia` | pass |
| C4 | `walk - usar a lixeira de uma linha e conferir que a lista de Ciclos não ganhou nada` | pass (Walked) |
| C5 | `run vitest / ✓ recusa nome de Matéria vazio, repetido ou lista cheia` | pass |
| C5 | `run vitest / ✓ recusa mais de 50 Matérias e aceita 50` | pass |
| C5 | `walk - adicionar 50 linhas e tentar a 51ª` | pass (Walked) |
| C6 | `run vitest / ✓ sem Matérias cria o Ciclo vazio com a Volta 1 aberta` | pass |
| C6 | `walk - criar com a tabela vazia` | pass (Walked) |
| C7 | `run vitest / ✓ aceita Questões da prova de 1 a 10.000 e recusa o resto` | pass |
| C7 | `run vitest / ✓ recusa Questões da prova inválidas no caso de uso sem gravar nada` | pass |
| C7 | `walk - digitar "7,5" em Questões e usar Visualizar ciclo` | pass (Walked) |
| C8 | `run vitest / ✓ aceita duração da Etapa de 30 minutos a 10.000 horas e recusa o resto` | pass |
| C8 | `run vitest / ✓ converte as horas digitadas em minutos, aceitando vírgula e ponto` | pass |
| C8 | `walk - digitar "0" e depois "0,5" em Duração da etapa com uma linha na tabela` | pass (Walked) |
| C9 | `run vitest / ✓ pesa a Matéria por questões vezes o fator da dificuldade` | pass |
| C10 | `run vitest / ✓ dá peso dividido pelo menor peso em Etapas, arredondando meio para cima, entre 1 e 8` | pass |
| C11 | `run vitest / ✓ ordena as Etapas em rodadas do maior peso para o menor, empate pela ordem digitada` | pass |
| C12 | `walk - preencher as sete matérias do print e usar "Visualizar ciclo"; conferir 23 Etapas, "23h" e nenhum Ciclo` | pass (Walked) |
| C13 | `walk - usar "Voltar" depois de "Visualizar ciclo"` | pass (Walked) |
| C14 | `run vitest / ✓ cria Ciclo, Volta 1, Matérias e Etapas sugeridas numa só operação` | pass |
| C14 | `walk - criar o ciclo das sete matérias e conferir a página do Ciclo` | pass (Walked) |
| C15 | `run vitest / ✓ não deixa nada criado quando uma gravação falha` | pass |
| C16 | `run vitest / ✓ ignora Etapas enviadas pelo cliente` | pass |
| C17 | `run vitest / ✓ recusa o nome do Ciclo vazio mesmo com Matérias` | pass |
| C18 | `walk - criar o ciclo e ver o botão desabilitado durante o envio` | pass (Walked) |
| C19 | `walk - tabela com 50 linhas a 1440px e a 390px` | pass (Walked) |
| C20 | `walk - abrir /ciclos/novo sem sessão` | pass (Walked) |
| C21 | `run vitest / ✓ exporta dificuldade e questoesDaProva de cada Matéria` | pass |
| C22 | `run vitest / ✓ importa de volta Dificuldade e Questões da prova iguais` | pass |
| C23 | `run vitest / ✓ importa backup antigo sem os campos com os dois nulos` | pass |
| C24 | `run vitest / ✓ recusa arquivo com Dificuldade ou Questões da prova inválidas sem substituir nada` | pass |
| C25 | `run vitest / ✓ copiar Matéria leva a Dificuldade e não as Questões da prova` | pass |
| C26 | `run vitest / ✓ Matéria criada por Etapa manual nasce sem Dificuldade nem Questões da prova` | pass |
| Build | `npx tsc --noEmit` | pass |

## Output

`Run vitest` - exit 0

```

stderr | tests/sugestao-de-ciclo.test.ts > backup e cópia > importa backup antigo sem os campos com os dois nulos
2026-11-22T22:02:06.311Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/sugestao-de-ciclo.test.ts > backup e cópia > recusa arquivo com Dificuldade ou Questões da prova inválidas sem substituir nada
2026-11-22T22:02:06.433Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/sugestao-de-ciclo.test.ts > backup e cópia > recusa arquivo com Dificuldade ou Questões da prova inválidas sem substituir nada
2026-11-22T22:02:06.533Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/sugestao-de-ciclo.test.ts > backup e cópia > copiar Matéria leva a Dificuldade e não as Questões da prova
2026-11-22T22:02:06.742Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/sugestao-de-ciclo.test.ts > backup e cópia > Matéria criada por Etapa manual nasce sem Dificuldade nem Questões da prova
2026-11-22T22:02:06.875Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.
```
