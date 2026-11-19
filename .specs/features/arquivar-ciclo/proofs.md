# arquivar-ciclo proofs

**HEAD**: 36d4361
**Tree**: clean
**Shell**: /bin/sh
**Result**: 34 pass, 1 fail

| Check | Proof | Result |
| --- | --- | --- |
| C1 | `browser captures/ciclo.running.png` | **not judged** (screens.md) |
| C2 | `walk - na tela do Ciclo, "Arquivar" abre o diálogo com o título, o texto com o nome do Ciclo e os dois botões` | pass (Walked) |
| C3 | `walk - "Cancelar" fecha o diálogo e o Ciclo continua na Sidebar` | pass (Walked) |
| C4 | `run unit / ✓ tests/arquivados.test.ts > arquivar e reativar > arquivar marca o Ciclo como arquivado` | pass |
| C5 | `walk - confirmar o diálogo abre a Hoje sem o Ciclo arquivado` | pass (Walked) |
| C6 | `run unit / ✓ tests/arquivados.test.ts > arquivar e reativar > recusa arquivar com o Cronômetro do Ciclo ativo` | pass |
| C7 | `run unit / ✓ tests/arquivados.test.ts > arquivar e reativar > arquivar e reativar não alteram o histórico` | pass |
| C8 | `run unit / ✓ tests/arquivados.test.ts > leituras > o Ciclo arquivado sai da Hoje e da Próxima etapa` | pass |
| C9 | `walk - com um Ciclo arquivado, a lista "Ciclos" da Sidebar e o menu do celular não o mostram, e "Registrar est` | pass (Walked) |
| C10 | `walk - no modal "Registrar estudo", o seletor de Matéria não lista as Matérias do Ciclo arquivado` | pass (Walked) |
| C11 | `run unit / ✓ tests/arquivados.test.ts > arquivar e reativar > arquivar duas vezes é idempotente` | pass |
| C12 | `run unit / ✓ tests/arquivados.test.ts > arquivar e reativar > ciclo de outro Usuário ou inexistente não é enco` | pass |
| C13 | `walk - o item "Arquivados" da Sidebar leva a /ciclos/arquivados e fica selecionado` | pass (Walked) |
| C14 | `walk - com 1 Ciclo arquivado o item mostra o Counter "1"` | pass (Walked) |
| C15 | `walk - sem Ciclo arquivado o item "Arquivados" aparece sem Counter` | pass (Walked) |
| C16 | `walk - numa janela de 390px, o menu do avatar mostra "Arquivados" e leva à lista` | pass (Walked) |
| C17 | `run unit / ✓ tests/arquivados.test.ts > leituras > arquivados do mais recente ao mais antigo` | pass |
| C18 | `walk - /ciclos/arquivados mostra um cartão por Ciclo com nome, "Volta N", etapas e "Reativar", e o nome abre a` | pass (Walked) |
| C19 | `walk - /ciclos/arquivados sem arquivados mostra "Nenhum ciclo arquivado."` | pass (Walked) |
| C20 | `run unit / ✓ tests/arquivados.test.ts > arquivar e reativar > reativar devolve o Ciclo à Hoje com a mesma Volt` | pass |
| C21 | `walk - "Reativar" na lista de arquivados faz o cartão sumir e o Ciclo reaparecer na Hoje, na Sidebar e no moda` | pass (Walked) |
| C22 | `run unit / ✓ tests/arquivados.test.ts > arquivar e reativar > reativar duas vezes é idempotente` | pass |
| C23 | `walk - a tela de um Ciclo arquivado tem as abas e os dados, "Reativar", e nenhuma das ações de alteração` | pass (Walked) |
| C24 | `run unit / ✓ tests/arquivados.test.ts > escritas no Ciclo arquivado > Ciclo, Etapas, Volta e Faixas recusam a ` | pass |
| C25 | `run unit / ✓ tests/arquivados.test.ts > escritas no Ciclo arquivado > Tópicos recusam a escrita` | pass |
| C26 | `run unit / ✓ tests/arquivados.test.ts > escritas no Ciclo arquivado > Registro novo, troca de Matéria e Cronôm` | pass |
| C27 | `run unit / ✓ tests/arquivados.test.ts > escritas no Ciclo arquivado > editar e excluir Registros antigos conti` | pass |
| C28 | `walk - em Registros, "Editar" num Registro de Ciclo arquivado abre o modal com a Matéria e o Ciclo dele, e sal` | pass (Walked) |
| C29 | `run unit / ✓ tests/arquivados.test.ts > leituras > Registros e Estatísticas seguem contando o Ciclo arquivado` | pass |
| C30 | `walk - o filtro de Ciclo de Registros e o de Estatísticas listam o Ciclo arquivado e filtram por ele` | pass (Walked) |
| C31 | `run unit / ✓ tests/arquivados.test.ts > leituras > indicadores da Hoje seguem somando o Ciclo arquivado` | pass |
| C32 | `walk - com um só Ciclo, arquivá-lo deixa a Hoje com "Nenhum ciclo ainda" e o Counter "1"` | pass (Walked) |
| C33 | `run unit / ✓ tests/arquivados.test.ts > arquivar e reativar > arquiva com o Cronômetro de outro Ciclo` | pass |
| Build | `npm run typecheck` | pass |
| Build | `npm run build` | pass |

## Output

`Run unit` - exit 0

```

stderr | tests/conta.test.ts > conta e instância > com o cadastro desligado, não é possível criar conta
2026-11-19T00:55:02.880Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/conta.test.ts > conta e instância > com o cadastro desligado, não é possível criar conta
2026-11-19T00:55:02.932Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/conta.test.ts > conta e instância > com o cadastro desligado, o primeiro Usuário ainda pode se cadastrar
2026-11-19T00:55:02.994Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/volta-do-ciclo.test.ts > progresso na tela do Ciclo > cada Etapa traz o feito, e o Ciclo traz a Volta, os totais e as Matérias com progresso
2026-11-19T00:55:03.383Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/volta-do-ciclo.test.ts > progresso na tela do Ciclo > depois de fechar a Volta, mostra a Volta 2 com o instante em que abriu e soma as horas extras
2026-11-19T00:55:03.511Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.
```
