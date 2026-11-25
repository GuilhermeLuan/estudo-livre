# editar-ciclo proofs

**HEAD**: 25b1074
**Tree**: clean
**Shell**: /bin/sh
**Result**: 28 pass, 1 fail

| Check | Proof | Result |
| --- | --- | --- |
| C1 | `walk - Ciclo ativo mostra o botão e o clique abre a edição; Ciclo arquivado não mostra o botão` | pass (Walked) |
| C2 | `browser captures/editar-ciclo.running.png` | **not judged** (screens.md) |
| C3 | `run unit / ✓ tests/editar-ciclo.test.ts > obterSugestaoDoCiclo > lista as Matérias com Etapa na ordem da prime` | pass |
| C4 | `run unit / ✓ tests/editar-ciclo.test.ts > obterSugestaoDoCiclo > Matéria criada à mão vem sem Questões nem Dif` | pass |
| C5 | `run unit / ✓ tests/editar-ciclo.test.ts > duracaoDaEdicao > usa a gravada, senão a carga mais comum (empate a ` | pass |
| C6 | `walk - acrescentar "português" com "Português" na lista recusa com "A matéria “português” já está na lista."; ` | pass (Walked) |
| C7 | `walk - o diálogo mostra "Gerar ciclo?", "As etapas atuais serão substituídas pelas da sugestão. Registros, tóp` | pass (Walked) |
| C8 | `walk - depois de "Cancelar" o formulário segue como estava e a página do Ciclo mostra as mesmas Etapas` | pass (Walked) |
| C9 | `run unit / ✓ tests/editar-ciclo.test.ts > gerarEtapas > substitui as Etapas pelas sugeridas e grava nome, dura` | pass |
| C10 | `run unit / ✓ tests/editar-ciclo.test.ts > gerarEtapas > reaproveita a Matéria de mesmo nome com Registros e Tó` | pass |
| C11 | `run unit / ✓ tests/editar-ciclo.test.ts > gerarEtapas > cria a Matéria nova com Questões e Dificuldade` | pass |
| C12 | `run unit / ✓ tests/editar-ciclo.test.ts > gerarEtapas > Matéria fora da lista perde as Etapas e só fica com Re` | pass |
| C13 | `run unit / ✓ tests/editar-ciclo.test.ts > gerarEtapas > mantém a Volta aberta e recalcula o progresso com as h` | pass |
| C14 | `run unit / ✓ tests/editar-ciclo.test.ts > gerarEtapas > fecha a Volta quando todas as novas Etapas ficam compl` | pass |
| C15 | `run unit / ✓ tests/editar-ciclo.test.ts > gerarEtapas > recusa a lista vazia sem mudar nada` | pass |
| C16 | `run unit / ✓ tests/editar-ciclo.test.ts > gerarEtapas > recusa Matéria repetida sem mudar as Etapas` | pass |
| C17 | `run unit / ✓ tests/editar-ciclo.test.ts > gerarEtapas > recusa Ciclo arquivado sem mudar nada` | pass |
| C18 | `run unit / ✓ tests/editar-ciclo.test.ts > gerarEtapas > não lê nem gera Ciclo de outro Usuário` | pass |
| C19 | `run unit / ✓ tests/editar-ciclo.test.ts > gerarEtapas > ignora Etapas enviadas pelo cliente` | pass |
| C20 | `run unit / ✓ tests/editar-ciclo.test.ts > gerarEtapas > recusa o nome do Ciclo vazio` | pass |
| C21 | `walk - depois de confirmar, o botão "Gerar ciclo" fica desabilitado até a página do Ciclo abrir` | pass (Walked) |
| C22 | `walk - a edição mostra "Informe as questões da prova e a sua dificuldade em cada matéria para receber a sugest` | pass (Walked) |
| C23 | `run unit / ✓ tests/editar-ciclo.test.ts > criarCiclo > grava a duração da Etapa no Ciclo` | pass |
| C24 | `walk - a 390px a tabela é usável, sem rolagem horizontal da página, e "Visualizar ciclo" e "Gerar ciclo" alcan` | pass (Walked) |
| C25 | `run unit / ✓ tests/editar-ciclo.test.ts > backup > exporta duracaoEtapaMinutos` | pass |
| C26 | `run unit / ✓ tests/editar-ciclo.test.ts > backup > importa duracaoEtapaMinutos ou nulo quando ausente` | pass |
| C27 | `run unit / ✓ tests/editar-ciclo.test.ts > backup > recusa duracaoEtapaMinutos inválida sem substituir nada` | pass |
| Build | `npm run typecheck` | pass |
| Build | `npm run build` | pass |

## Output

`Run unit` - exit 0

```

stderr | tests/editar-ciclo.test.ts > backup > exporta duracaoEtapaMinutos
2026-11-25T23:29:15.798Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/editar-ciclo.test.ts > backup > importa duracaoEtapaMinutos ou nulo quando ausente
2026-11-25T23:29:15.923Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/editar-ciclo.test.ts > backup > importa duracaoEtapaMinutos ou nulo quando ausente
2026-11-25T23:29:16.009Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/editar-ciclo.test.ts > backup > recusa duracaoEtapaMinutos inválida sem substituir nada
2026-11-25T23:29:16.146Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/editar-ciclo.test.ts > backup > recusa duracaoEtapaMinutos inválida sem substituir nada
2026-11-25T23:29:16.231Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.
```
