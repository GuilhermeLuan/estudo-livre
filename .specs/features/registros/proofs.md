# registros proofs

**HEAD**: 4ae7aff
**Tree**: clean
**Shell**: /bin/sh
**Result**: 52 pass, 0 fail

| Check | Proof | Result |
| --- | --- | --- |
| C1 | `walk - abrir Registros pela Sidebar (1440px) e pela barra de abas (375px)` | pass (Walked) |
| C2 | `run unit / ✓ tests/registros.test.ts > histórico de registros > lista do mais recente ao mais antigo, com Maté` | pass |
| C2 | `run unit / ✓ tests/registros.test.ts > histórico de registros > de duas datas iguais mostra primeiro o criado ` | pass |
| C2 | `walk - ver a linha "70 min, 20 questões, 16 acertos, Tópico" como "1h10", "16/20 · 80%" e o nome do Tópico` | pass (Walked) |
| C3 | `run unit / ✓ tests/registros.test.ts > histórico de registros > devolve 25 por vez e avisa quando há mais` | pass |
| C3 | `run unit / ✓ tests/registros.test.ts > histórico de registros > com exatamente 25 registros não há mais` | pass |
| C3 | `run unit / ✓ tests/registros.test.ts > histórico de registros > um limite absurdo, zero, negativo ou fracionár` | pass |
| C3 | `walk - com mais de 25 Registros, usar "Carregar mais" até o botão sumir` | pass (Walked) |
| C4 | `run unit / ✓ tests/registros.test.ts > histórico de registros > filtra por Ciclo e por Matéria, com o total do` | pass |
| C4 | `walk - ver "N registros" mudar ao filtrar` | pass (Walked) |
| C5 | `run unit / ✓ tests/registros.test.ts > histórico de registros > filtra por Ciclo e por Matéria, com o total do` | pass |
| C5 | `walk - escolher Ciclo e Matéria nos Selects e trocar o Ciclo` | pass (Walked) |
| C6 | `walk - filtrar, copiar a URL, abri-la em outra aba` | pass (Walked) |
| C7 | `walk - abrir com conta nova e depois filtrar sem resultado e usar "Limpar filtros"` | pass (Walked) |
| C8 | `run unit / ✓ tests/registros.test.ts > histórico de registros > ids de outro Usuário ou inexistentes não mostr` | pass |
| C8 | `walk - abrir /registros?ciclo=inexistente` | pass (Walked) |
| C9 | `walk - abrir /registros nos três tamanhos` | pass (Walked) |
| C10 | `run unit / ✓ tests/registros.test.ts > histórico de registros > a Volta do Registro é a que contém a data dele` | pass |
| C10 | `run unit / ✓ tests/registros.test.ts > histórico de registros > um Registro exatamente no instante do fechamen` | pass |
| C11 | `browser - reach the state, save captures/registrar-estudo.running.png` | pass |
| C12 | `walk - editar um Registro de cada tipo de conteúdo` | pass (Walked) |
| C13 | `run unit / ✓ tests/registros.test.ts > editar registro > grava os valores novos e a lista mostra a linha atual` | pass |
| C13 | `walk - editar a duração e ver "1h30" na linha` | pass (Walked) |
| C14 | `run unit / ✓ tests/registros.test.ts > editar registro > trocar a Matéria move as horas para o outro Ciclo e s` | pass |
| C15 | `run unit / ✓ tests/registros.test.ts > editar registro > recusa Tópico de outro Usuário e Tópico com Conteúdo ` | pass |
| C16 | `run unit / ✓ tests/registros.test.ts > editar registro > recusa acertos acima das questões e acertos sem quest` | pass |
| C17 | `run unit / ✓ tests/registros.test.ts > editar registro > recusa as mesmas entradas inválidas do registro e não` | pass |
| C18 | `run unit / ✓ tests/registros.test.ts > editar registro > mantém o instante se a data não muda, vira meio-dia n` | pass |
| C19 | `run unit / ✓ tests/registros.test.ts > editar registro > a edição que completa as Etapas da Volta aberta a fec` | pass |
| C20 | `run unit / ✓ tests/registros.test.ts > editar registro > recusa Registro excluído ou de outro Usuário sem grav` | pass |
| C21 | `run unit / ✓ tests/registros.test.ts > editar registro > marca o Tópico novo como estudado e deixa o anterior ` | pass |
| C22 | `walk - usar "Excluir" numa linha e ler o diálogo` | pass (Walked) |
| C23 | `run unit / ✓ tests/registros.test.ts > excluir registro > remove o Registro e tira horas, questões e acertos d` | pass |
| C23 | `walk - confirmar a exclusão e ver a linha sumir` | pass (Walked) |
| C24 | `walk - usar "Cancelar" e ver o Registro na lista` | pass (Walked) |
| C25 | `run unit / ✓ tests/registros.test.ts > excluir registro > remove o Registro e tira horas, questões e acertos d` | pass |
| C26 | `run unit / ✓ tests/registros.test.ts > excluir registro > excluir um Registro de Volta fechada não reabre a Vo` | pass |
| C27 | `run unit / ✓ tests/registros.test.ts > excluir registro > recusa Registro já excluído ou de outro Usuário e nã` | pass |
| C28 | `run unit / ✓ tests/registros.test.ts > registro retroativo e Volta > um dia dentro de Volta fechada fica nela,` | pass |
| C29 | `run unit / ✓ tests/registros.test.ts > registro retroativo e Volta > um dia passado dentro da Volta aberta som` | pass |
| C29 | `run unit / ✓ tests/registros.test.ts > registro retroativo e Volta > um dia passado dentro da Volta aberta som` | pass |
| C30 | `run unit / ✓ tests/registros.test.ts > registro retroativo e Volta > recusa data futura ao registrar e ao edit` | pass |
| C31 | `run unit / ✓ tests/registros.test.ts > registro retroativo e Volta > recusa acertos acima das questões mesmo c` | pass |
| C32 | `run unit / ✓ tests/registros.test.ts > progresso consistente > editar e excluir mudam a Hoje e o Ciclo na próx` | pass |
| C32 | `walk - excluir um Registro de hoje e ver Hoje e o Ciclo` | pass (Walked) |
| C33 | `run unit / ✓ tests/registros.test.ts > progresso consistente > mudanças simultâneas no mesmo Registro e entre ` | pass |
| C34 | `walk - abrir "Editar" em 375px e 1440px` | pass (Walked) |
| C35 | `walk - abrir /registros sem sessão e ver o login` | pass (Walked) |
| C36 | `run unit / ✓ tests/estudo.test.ts > registro de estudo e progresso da volta > soma as durações ao Progresso da` | pass |
| C36 | `walk - abrir "Registrar estudo" na Hoje` | pass (Walked) |
| Build | `npm run typecheck` | pass |
| Build | `npm run build` | pass |

## Output

`Run unit` - exit 0

```

stderr | tests/estudo.test.ts > validação do registro de estudo > um Usuário não registra estudo em Matéria de outro
2026-11-18T00:54:13.440Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/estudo.test.ts > etapas: as horas de uma Matéria preenchem as Etapas dela em ordem > preenche a primeira Etapa da Matéria e transborda para a seguinte
2026-11-18T00:54:13.562Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/estudo.test.ts > etapas: as horas de uma Matéria preenchem as Etapas dela em ordem > estudar fora da ordem do ciclo conta já, e a Próxima etapa é a primeira incompleta
2026-11-18T00:54:13.638Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/estudo.test.ts > etapas: as horas de uma Matéria preenchem as Etapas dela em ordem > horas além da soma das Etapas viram horas extras, sem passar para a Volta seguinte
2026-11-18T00:54:13.719Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/estudo.test.ts > etapas: as horas de uma Matéria preenchem as Etapas dela em ordem > mostra o extra enquanto a Volta ainda não fechou
2026-11-18T00:54:13.799Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.
```
