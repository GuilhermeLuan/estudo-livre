# gestao-de-voltas proofs

**HEAD**: d7e3694
**Tree**: clean
**Shell**: /bin/sh
**Result**: 31 pass, 0 fail

| Check | Proof | Result |
| --- | --- | --- |
| C1 | `browser captures/ciclo.running.png` | pass |
| C2 | `run unit / ✓ tests/voltas.test.ts > Voltas > lista a Volta aberta primeiro e as fechadas da mais recente à mai` | pass |
| C2 | `walk - abrir a aba "Voltas" e ver as colunas Volta, Início, Fim e Duração na ordem` | pass (Walked) |
| C3 | `run unit / ✓ tests/formato.test.ts > Histórico de Voltas > datas em dd/mm/aaaa e duração em dias de calendário` | pass |
| C4 | `walk - abrir a aba "Voltas" e ver "Em andamento" na primeira linha` | pass (Walked) |
| C5 | `run unit / ✓ tests/voltas.test.ts > Voltas > a Volta 1 começa na criação do Ciclo` | pass |
| C6 | `run unit / ✓ tests/voltas.test.ts > Voltas > um Ciclo sem Volta fechada lista só a Volta 1 aberta` | pass |
| C7 | `run unit / ✓ tests/voltas.test.ts > Voltas > listar as Voltas de outro Usuário responde não encontrado` | pass |
| C8 | `walk - usar "Reiniciar volta" e ler o diálogo; abrir a aba "Voltas" e ver que nada mudou` | pass (Walked) |
| C9 | `run unit / ✓ tests/voltas.test.ts > Voltas > reiniciar fecha a Volta aberta e abre a seguinte no mesmo instant` | pass |
| C9 | `walk - confirmar o diálogo e ver "Volta 2" com 0%` | pass (Walked) |
| C10 | `walk - cancelar o diálogo e ver "Volta 1" e o progresso iguais` | pass (Walked) |
| C11 | `run unit / ✓ tests/voltas.test.ts > Voltas > reiniciar sem Registro de estudo é permitido` | pass |
| C12 | `run unit / ✓ tests/voltas.test.ts > Voltas > reiniciar mantém os Registros na Volta fechada e zera o progresso` | pass |
| C13 | `run unit / ✓ tests/voltas.test.ts > Voltas > reiniciar com o número de uma Volta que já não é a aberta é recus` | pass |
| C14 | `run unit / ✓ tests/voltas.test.ts > Voltas > reiniciar o Ciclo de outro Usuário responde não encontrado` | pass |
| C15 | `walk - reiniciar estando na aba "Voltas" e ver a Volta 1 com fim hoje e a Volta 2 em andamento` | pass (Walked) |
| C16 | `run unit / ✓ tests/voltas.test.ts > Voltas e carga horária > mudar a carga recalcula o progresso da Volta aber` | pass |
| C17 | `run unit / ✓ tests/voltas.test.ts > Voltas e carga horária > editar a carga até completar todas as Etapas fech` | pass |
| C17 | `run unit / ✓ tests/voltas.test.ts > Voltas e carga horária > remover a Etapa que falta fecha a Volta` | pass |
| C17 | `run unit / ✓ tests/voltas.test.ts > Voltas e carga horária > adicionar uma Etapa já cumprida pelas horas extra` | pass |
| C18 | `run unit / ✓ tests/voltas.test.ts > Voltas e carga horária > mudança que deixa uma Etapa abaixo de 100% mantém` | pass |
| C19 | `run unit / ✓ tests/voltas.test.ts > Voltas e carga horária > editar a Etapa devolve o número da Volta fechada` | pass |
| C19 | `run unit / ✓ tests/formato.test.ts > Histórico de Voltas > aviso de Volta concluída` | pass |
| C19 | `walk - baixar a carga da última Etapa incompleta e ver o aviso no topo` | pass (Walked) |
| C20 | `run unit / ✓ tests/voltas.test.ts > Voltas e carga horária > remover a última Etapa mantém a Volta aberta` | pass |
| C21 | `run unit / ✓ tests/voltas.test.ts > Voltas e carga horária > mudar a carga não reabre nem altera a Volta fecha` | pass |
| C22 | `run unit / ✓ tests/voltas.test.ts > Voltas e carga horária > reordenar as Etapas não muda as Voltas` | pass |
| C23 | `run unit / ✓ tests/voltas.test.ts > Voltas e carga horária > registro e mudança de Etapa simultâneos fecham a ` | pass |
| Build | `npm run typecheck` | pass |
| Build | `npm run build` | pass |

## Output

`Run unit` - exit 0

```

stderr | tests/voltas.test.ts > Voltas e carga horária > editar a Etapa devolve o número da Volta fechada
2026-11-18T01:31:25.884Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/voltas.test.ts > Voltas e carga horária > remover a última Etapa mantém a Volta aberta
2026-11-18T01:31:25.951Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/voltas.test.ts > Voltas e carga horária > mudar a carga não reabre nem altera a Volta fechada
2026-11-18T01:31:26.011Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/voltas.test.ts > Voltas e carga horária > reordenar as Etapas não muda as Voltas
2026-11-18T01:31:26.071Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/voltas.test.ts > Voltas e carga horária > registro e mudança de Etapa simultâneos fecham a Volta uma vez
2026-11-18T01:31:26.136Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.
```
