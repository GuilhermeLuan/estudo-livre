# topicos proofs

**HEAD**: 3453f1f
**Tree**: clean
**Shell**: /bin/sh
**Result**: 39 pass, 0 fail

| Check | Proof | Result |
| --- | --- | --- |
| C1 | `run unit / ✓ tests/topicos.test.ts > Tópicos > a Matéria devolve os Tópicos em ordem e o X de Y` | pass |
| C1 | `walk - clicar no nome da Matéria no cartão do Ciclo e ver a página com "X de Y tópicos estudados" e o Progress` | pass (Walked) |
| C2 | `walk - abrir a página de uma Matéria sem Tópicos` | pass (Walked) |
| C3 | `run unit / ✓ tests/topicos.test.ts > Tópicos > cria o Tópico no fim, sem espaços nas pontas` | pass |
| C3 | `walk - usar "Novo tópico" e ver o Tópico no fim da lista` | pass (Walked) |
| C4 | `run unit / ✓ tests/topicos.test.ts > Tópicos > recusa nome vazio ou com mais de 120 caracteres` | pass |
| C5 | `run unit / ✓ tests/topicos.test.ts > Tópicos > recusa nome repetido na Matéria e aceita em outra` | pass |
| C6 | `run unit / ✓ tests/topicos.test.ts > Tópicos > renomeia mantendo posição, marca e Registros` | pass |
| C6 | `walk - usar "Renomear" na lista e ver o nome trocado` | pass (Walked) |
| C7 | `run unit / ✓ tests/topicos.test.ts > Tópicos > excluir o Tópico mantém os Registros sem conteúdo` | pass |
| C7 | `walk - usar "Excluir" num Tópico com Registros e ler a confirmação` | pass (Walked) |
| C8 | `run unit / ✓ tests/topicos.test.ts > Tópicos > importa um Tópico por linha ignorando vazias e duplicadas` | pass |
| C8 | `walk - colar o texto em "Importar tópicos" e ver "2 importados, 3 ignorados."` | pass (Walked) |
| C9 | `run unit / ✓ tests/topicos.test.ts > Tópicos > a importação recusa linha longa, excesso de linhas e lista vazi` | pass |
| C10 | `run unit / ✓ tests/topicos.test.ts > Tópicos > o Usuário marca e desmarca, mesmo com Registros` | pass |
| C10 | `walk - clicar o Checkbox e ver o X de Y mudar na mesma tela` | pass (Walked) |
| C11 | `run unit / ✓ tests/topicos.test.ts > Tópicos > nada é lido nem gravado com ids de outro Usuário` | pass |
| C11 | `walk - abrir /ciclos/<outro ciclo>/materias/<matéria> e ver 404` | pass (Walked) |
| C12 | `run unit / ✓ tests/topicos.test.ts > Tópicos > duas criações simultâneas do mesmo nome gravam um só` | pass |
| C13 | `walk - abrir a página nos três tamanhos` | pass (Walked) |
| C14 | `walk - abrir a página e ver o breadcrumb` | pass (Walked) |
| C15 | `browser - abrir Registrar estudo numa Matéria com Tópicos a 1440px, salvar .specs/features/topicos/captures/re` | pass |
| C16 | `walk - escolher um Tópico, trocar a Matéria e ver o Select limpo com a lista nova` | pass (Walked) |
| C17 | `walk - abrir o modal numa Matéria sem Tópicos` | pass (Walked) |
| C18 | `run unit / ✓ tests/topicos.test.ts > Tópicos > o Registro com Tópico grava o topicoId sem Conteúdo livre` | pass |
| C19 | `run unit / ✓ tests/topicos.test.ts > Tópicos > Conteúdo livre e Sem conteúdo gravam sem Tópico` | pass |
| C19 | `run unit / ✓ tests/formato.test.ts > Tópicos na interface > o segmento do Conteúdo grava só o campo do segment` | pass |
| C19 | `walk - alternar os segmentos e ver que o que estava no outro foi descartado` | pass (Walked) |
| C20 | `run unit / ✓ tests/formato.test.ts > Tópicos na interface > o segmento do Conteúdo grava só o campo do segment` | pass |
| C20 | `walk - salvar com "Tópico" e nada escolhido e ver a mensagem sob o campo` | pass (Walked) |
| C21 | `run unit / ✓ tests/topicos.test.ts > Tópicos > registrarEstudo recusa Tópico de outra Matéria, de outro Usuári` | pass |
| C22 | `run unit / ✓ tests/topicos.test.ts > Tópicos > o Registro com Tópico marca o Tópico como estudado` | pass |
| C22 | `run unit / ✓ tests/topicos.test.ts > Tópicos > registrar com Tópico e excluir o Tópico ao mesmo tempo nunca dá` | pass |
| C23 | `browser - abrir /ciclos/<id> a 1440px, salvar .specs/features/topicos/captures/ciclo.running.png` | pass |
| C24 | `run unit / ✓ tests/topicos.test.ts > Tópicos > o Ciclo traz estudados e total de Tópicos por Matéria` | pass |
| C24 | `walk - ver "—" numa Matéria sem Tópicos no cartão` | pass (Walked) |
| C25 | `run unit / ✓ tests/topicos.test.ts > Tópicos > a Matéria com Tópicos não é descartada ao perder a última Etapa` | pass |
| Build | `npm run typecheck` | pass |
| Build | `npm run build` | pass |

## Output

`Run unit` - exit 0

```

stderr | tests/topicos.test.ts > Tópicos > registrarEstudo recusa Tópico de outra Matéria, de outro Usuário e Tópico com Conteúdo livre
2026-11-18T00:20:45.178Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/topicos.test.ts > Tópicos > o Registro com Tópico marca o Tópico como estudado
2026-11-18T00:20:45.249Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/topicos.test.ts > Tópicos > registrar com Tópico e excluir o Tópico ao mesmo tempo nunca dá erro de banco
2026-11-18T00:20:45.323Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/topicos.test.ts > Tópicos > o Ciclo traz estudados e total de Tópicos por Matéria
2026-11-18T00:20:45.405Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/topicos.test.ts > Tópicos > a Matéria com Tópicos não é descartada ao perder a última Etapa
2026-11-18T00:20:45.466Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.
```
