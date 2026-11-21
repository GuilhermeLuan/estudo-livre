# copiar-materia proofs

**HEAD**: 351e582
**Tree**: clean
**Shell**: /bin/sh
**Result**: 22 pass, 0 fail

| Check | Proof | Result |
| --- | --- | --- |
| C1 | `walk - no Concurso B, o modal lista "Português · Concurso A" e "Direito · Concurso C (arquivado)"` | pass (Walked) |
| C2 | `run unit / ✓ tests/copiar-materia.test.ts > listarMateriasCopiaveis > lista as Matérias de outros Ciclos, ativ` | pass |
| C3 | `walk - escolher "Português · Concurso A" (2 Etapas, 3 h) preenche "Português" e "3", e os campos aceitam ediçã` | pass (Walked) |
| C4 | `run unit / ✓ tests/copiar-materia.test.ts > listarMateriasCopiaveis > a carga é a soma das Etapas e 0 sem Etap` | pass |
| C5 | `walk - escolher uma Matéria sem Etapas deixa a carga vazia` | pass (Walked) |
| C6 | `run unit / ✓ tests/copiar-materia.test.ts > copiarMateria > cria a Matéria, a Etapa no fim e os Tópicos na ord` | pass |
| C7 | `run unit / ✓ tests/copiar-materia.test.ts > copiarMateria > os Tópicos copiados vêm não estudados, sem Registr` | pass |
| C8 | `run unit / ✓ tests/copiar-materia.test.ts > copiarMateria > a origem fica inalterada` | pass |
| C9 | `run unit / ✓ tests/copiar-materia.test.ts > copiarMateria > alterar a cópia não altera a origem` | pass |
| C10 | `walk - escolher "Nova matéria" depois de uma origem mantém os campos e, ao enviar, cria só a Etapa` | pass (Walked) |
| C11 | `walk - no único Ciclo do Usuário, "Adicionar etapa" não mostra "Copiar de outro ciclo"` | pass (Walked) |
| C12 | `walk - enviar "Adicionar etapa" sem origem cria a Etapa e reaproveita a Matéria de mesmo nome` | pass (Walked) |
| C13 | `run unit / ✓ tests/copiar-materia.test.ts > recusas > recusa nome repetido no destino` | pass |
| C14 | `run unit / ✓ tests/copiar-materia.test.ts > recusas > recusa carga inválida` | pass |
| C15 | `run unit / ✓ tests/copiar-materia.test.ts > recusas > recusa nome vazio` | pass |
| C16 | `run unit / ✓ tests/copiar-materia.test.ts > recusas > recusa origem inexistente, de outro Usuário ou do própri` | pass |
| C17 | `run unit / ✓ tests/copiar-materia.test.ts > recusas > recusa destino arquivado` | pass |
| C18 | `run unit / ✓ tests/copiar-materia.test.ts > recusas > uma falha no meio desfaz tudo` | pass |
| C19 | `run unit / ✓ tests/copiar-materia.test.ts > bordas > origem sem Tópicos gera cópia sem Tópicos` | pass |
| C20 | `run unit / ✓ tests/copiar-materia.test.ts > bordas > a mesma cópia duas vezes recusa a segunda` | pass |
| Build | `npm run typecheck` | pass |
| Build | `npm run build` | pass |

## Output

`Run unit` - exit 0

```

stderr | tests/copiar-materia.test.ts > bordas > a mesma cópia duas vezes recusa a segunda
2026-11-21T12:43:45.134Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/copiar-materia.test.ts > listarMateriasCopiaveis > lista as Matérias de outros Ciclos, ativos e arquivados
2026-11-21T12:43:45.283Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/copiar-materia.test.ts > listarMateriasCopiaveis > lista as Matérias de outros Ciclos, ativos e arquivados
2026-11-21T12:43:45.336Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/copiar-materia.test.ts > listarMateriasCopiaveis > a carga é a soma das Etapas e 0 sem Etapas
2026-11-21T12:43:45.457Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/copiar-materia.test.ts > listarMateriasCopiaveis > não lista nada quando não há outros Ciclos com Matérias
2026-11-21T12:43:45.566Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.
```
