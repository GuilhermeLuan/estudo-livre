# backup-json proofs

**HEAD**: a7457cb
**Tree**: clean
**Shell**: /bin/sh
**Result**: 29 pass, 0 fail

| Check | Proof | Result |
| --- | --- | --- |
| C1 | `run unit / ✓ tests/backup.test.ts > exportar > traz formato, versão e data da exportação` | pass |
| C2 | `run unit / ✓ tests/backup.test.ts > exportar > nomeia o arquivo com o dia de Brasília` | pass |
| C3 | `run unit / ✓ tests/backup.test.ts > exportar > inclui ciclos ativos e arquivados com tudo o que pende deles` | pass |
| C4 | `run unit / ✓ tests/backup.test.ts > exportar > omite cronômetro, sessões e dados da conta` | pass |
| C5 | `run unit / ✓ tests/backup.test.ts > exportar > não inclui ciclos de outro usuário` | pass |
| C6 | `walk - sem sessão, /api/backup redireciona para /entrar` | pass (Walked) |
| C7 | `walk - Sidebar a 1440px e menu da conta a 390px levam a /backup` | pass (Walked) |
| C8 | `walk - /backup mostra os dois cartões com os textos da spec` | pass (Walked) |
| C9 | `walk - Importar backup sem arquivo mostra Escolha um arquivo.` | pass (Walked) |
| C10 | `walk - conta vazia importa direto; conta com 2 Ciclos mostra o AlertDialog com "Os 2 ciclos desta conta"` | pass (Walked) |
| C11 | `walk - Cancelar fecha o diálogo e os Ciclos continuam na Sidebar` | pass (Walked) |
| C12 | `run unit / ✓ tests/backup.test.ts > importar > substitui os ciclos da conta pelos do arquivo` | pass |
| C13 | `walk - aviso Backup importado: 2 ciclos. e a Sidebar com os Ciclos do arquivo` | pass (Walked) |
| C14 | `run unit / ✓ tests/backup.test.ts > importar > recalcula os cartões ignorando os do arquivo` | pass |
| C15 | `run unit / ✓ tests/backup.test.ts > importar > mantém ciclos arquivados com a mesma data` | pass |
| C16 | `run unit / ✓ tests/backup.test.ts > importar > não toca os ciclos de outro usuário` | pass |
| C17 | `run unit / ✓ tests/backup.test.ts > recusar > recusa arquivo inválido sem alterar a conta` | pass |
| C18 | `run unit / ✓ tests/backup.test.ts > recusar > recusa versão desconhecida` | pass |
| C19 | `run unit / ✓ tests/backup.test.ts > recusar > recusa arquivo acima de 50 MB` | pass |
| C20 | `run unit / ✓ tests/backup.test.ts > recusar > recusa com cronômetro ativo` | pass |
| C21 | `run unit / ✓ tests/backup.test.ts > recusar > desfaz tudo quando a gravação falha no meio` | pass |
| C22 | `walk - POST da action sem cookie é redirecionado para /entrar pelo proxy` | pass (Walked) |
| C23 | `run unit / ✓ tests/backup.test.ts > ida e volta > reexportar dá o mesmo arquivo` | pass |
| C24 | `run unit / ✓ tests/backup.test.ts > ida e volta > reproduz voltas, progresso, estatísticas e revisões` | pass |
| C25 | `run unit / ✓ tests/backup.test.ts > importar > lista vazia esvazia a conta` | pass |
| C26 | `run unit / ✓ tests/backup.test.ts > importar > importar duas vezes não duplica` | pass |
| C27 | `run unit / ✓ tests/backup.test.ts > importar > aceita registro sem tópico nem conteúdo livre` | pass |
| Build | `npm run typecheck` | pass |
| Build | `npm run build` | pass |

## Output

`Run unit` - exit 0

```

stderr | tests/backup.test.ts > ida e volta > aceita nomes no limite de caracteres do app
2026-11-22T16:02:17.973Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/backup.test.ts > ida e volta > reexportar dá o mesmo arquivo
2026-11-22T16:02:18.187Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/backup.test.ts > ida e volta > reexportar dá o mesmo arquivo
2026-11-22T16:02:18.495Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/backup.test.ts > ida e volta > reproduz voltas, progresso, estatísticas e revisões
2026-11-22T16:02:18.688Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/backup.test.ts > ida e volta > reproduz voltas, progresso, estatísticas e revisões
2026-11-22T16:02:18.925Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.
```
