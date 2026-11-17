# interface-boardui proofs

**HEAD**: d3b5389
**Tree**: dirty - .design/, .hallmark/
**Shell**: /bin/sh
**Result**: 56 pass, 6 fail

| Check | Proof | Result |
| --- | --- | --- |
| C1 | `! grep -rEn "(bg/text/border/ring)-(paper/surface-2/surface/ink-2/ink/line/accent-ink/accent-soft/on-accent)([` | pass |
| C2 | `walk - with no tema stored and the OS in light, open / and read background/full and text/primary computed on b` | pass (Walked) |
| C3 | `walk - with no tema and the OS in dark, view source of /entrar and see the inline theme script in <head>; relo` | pass (Walked) |
| C4 | `walk - pick Claro then Escuro in the theme toggle, reload, and see it kept whatever the OS prefers` | pass (Walked) |
| C5 | `walk - pick Sistema, see tema removed from localStorage, flip the OS theme with the page open` | pass (Walked) |
| C6 | `walk - read meta[name=theme-color] in both themes` | pass (Walked) |
| C7 | `browser - reach / at 1440px, light, with the Sidebar, save .specs/features/interface-boardui/captures/hoje-cla` | **diverges** (screens.md) |
| C8 | `walk - visit /, /estatisticas and /ciclos/<id> and read aria-current="page" on the matching item` | pass (Walked) |
| C9 | `walk - start a Cronômetro, see the Sidebar card with time, Matéria · Ciclo, chip and buttons; descartar and se` | pass (Walked) |
| C10 | `walk - open / at 390px and see the tab bar and avatar, Sidebar hidden` | pass (Walked) |
| C11 | `walk - tap the "+" tab and see Registrar estudo with the first Ciclo's Próxima etapa selected` | pass (Walked) |
| C12 | `walk - tap the avatar at 390px and see Ciclos, Novo ciclo, Usuários (Admin), the theme toggle and Sair` | pass (Walked) |
| C13 | `walk - with a Cronômetro running at 390px open /estatisticas and see the compact bar with Parar above the tab ` | pass (Walked) |
| C14 | `walk - use Sair and land on /entrar` | pass (Walked) |
| C15 | `browser - reach / at 1440px, save .specs/features/interface-boardui/captures/hoje-claro-suave.running.png` | **diverges** (screens.md) |
| C16 | `browser - reach / at 390px, save .specs/features/interface-boardui/captures/pwa-hoje.running.png` | **diverges** (screens.md) |
| C17 | `run unit / ✓ tests/indicadores.test.ts > indicadores da Hoje > Estudado hoje soma o dia em Brasília` | pass |
| C17 | `run unit / ✓ tests/indicadores.test.ts > indicadores da Hoje > um registro das 23h50 de ontem` | pass |
| C18 | `run unit / ✓ tests/indicadores.test.ts > indicadores da Hoje > Questões hoje soma as questões` | pass |
| C19 | `run unit / ✓ tests/indicadores.test.ts > indicadores da Hoje > Nesta semana compara com a semana anterior inte` | pass |
| C19 | `run unit / ✓ tests/indicadores.test.ts > indicadores da Hoje > Nesta semana cai 50%` | pass |
| C20 | `walk - open / with a Ciclo whose Matéria has horas extras and read the card: name, Volta N, bar, Próxima etapa` | pass (Walked) |
| C21 | `walk - Iniciar on a Próxima etapa starts the Cronômetro; Iniciar again shows the existing-timer message` | pass (Walked) |
| C22 | `walk - Registrar on a Próxima etapa opens the modal with that Matéria selected` | pass (Walked) |
| C23 | `walk - the arrow on a Ciclo card opens /ciclos/<id>` | pass (Walked) |
| C24 | `walk - with no Ciclo / shows the empty state with "Criar ciclo" and no indicators` | pass (Walked) |
| C25 | `browser - reach /ciclos/<id> at 1440px, save .specs/features/interface-boardui/captures/ciclo.running.png` | **diverges** (screens.md) |
| C26 | `run unit / ✓ tests/volta-do-ciclo.test.ts > progresso na tela do Ciclo > cada Etapa traz o feito` | pass |
| C26 | `run unit / ✓ tests/formato.test.ts > Volta e Situação da Etapa > Volta 3 aberta em 2/11` | pass |
| C27 | `run unit / ✓ tests/formato.test.ts > Volta e Situação da Etapa > uma Situação por Etapa` | pass |
| C27 | `run unit / ✓ tests/volta-do-ciclo.test.ts > progresso na tela do Ciclo > cada Etapa traz o feito` | pass |
| C28 | `walk - drag an EtapaRow, reload and see the order kept` | pass (Walked) |
| C29 | `walk - Adicionar etapa opens the modal and the new row appears at the end` | pass (Walked) |
| C30 | `walk - the ⋮ menu offers Editar (modal) and Remover etapa (confirm first)` | pass (Walked) |
| C31 | `walk - Renomear next to the Ciclo name saves the new name` | pass (Walked) |
| C32 | `run unit / ✓ tests/volta-do-ciclo.test.ts > progresso na tela do Ciclo > cada Etapa traz o feito` | pass |
| C33 | `walk - a Ciclo with no Etapa shows the empty state with Adicionar etapa` | pass (Walked) |
| C34 | `run unit / ✓ tests/ciclos.test.ts > isolamento entre Usuários > um Usuário não vê nem altera Ciclos e Etapas d` | pass |
| C35 | `walk - /ciclos/novo shows the form in a card and the validation message for an empty name` | pass (Walked) |
| C36 | `browser - reach Registrar estudo open at 1440px, save .specs/features/interface-boardui/captures/registrar-est` | **diverges** (screens.md) |
| C37 | `walk - Parar on the Cronômetro opens the modal with the duration and the note` | pass (Walked) |
| C38 | `run unit / ✓ tests/formato.test.ts > variação e acerto > acerto arredondado` | pass |
| C38 | `walk - type Questões 20 and Acertos 16 and see "80%"; clear Questões and see "—"` | pass (Walked) |
| C39 | `walk - save with Acertos greater than Questões and see the message under the field with the modal open` | pass (Walked) |
| C40 | `walk - Salvar registro closes the modal and Hoje shows the new totals; Cancelar, × and Esc close without savin` | pass (Walked) |
| C41 | `walk - open Registrar estudo at 390px and see the sheet from the bottom` | pass (Walked) |
| C42 | `browser - reach /estatisticas at 1440px, save .specs/features/interface-boardui/captures/estatisticas.running.` | **diverges** (screens.md) |
| C43 | `walk - pick a Ciclo in the segmented control and see every card filtered` | pass (Walked) |
| C44 | `run unit / ✓ tests/estatisticas.test.ts > variação semanal > compara a semana atual com a anterior` | pass |
| C44 | `run unit / ✓ tests/formato.test.ts > variação e acerto > variação arredondada` | pass |
| C45 | `walk - with no Registro de estudo /estatisticas shows the empty state with Registrar estudo` | pass (Walked) |
| C46 | `run unit / ✓ tests/estatisticas.test.ts > estatísticas > calcula o % de acerto por Matéria só com os registros` | pass |
| C47 | `walk - at 390px the cards stack in one column` | pass (Walked) |
| C48 | `browser - reach /entrar at 1440px, save .specs/features/interface-boardui/captures/entrar.running.png` | pass |
| C49 | `walk - open /cadastrar, /esqueci-senha and /redefinir-senha and see the same card as /entrar` | pass (Walked) |
| C50 | `walk - without SMTP /entrar has no "Esqueci minha senha"; with sign-up closed /cadastrar shows the notice in t` | pass (Walked) |
| C51 | `walk - as Admin /usuarios lists the Usuários in the Table and "Redefinir senha" opens the form in the row; a n` | pass (Walked) |
| C52 | `test ! -e prototype` | pass |
| C53 | `! grep -Ei "geist/disco do ciclo" docs/design-system.md && grep -q "1024px" docs/design-system.md && grep -q "` | pass |
| C54 | `grep -q "ig7Pq2uPxPWjeWuCKmTuBW" AGENTS.md && grep -q "Figma vence" AGENTS.md` | pass |
| Build | `npm run typecheck` | pass |
| Build | `npm run build` | pass |

## Output

`Run unit` - exit 0

```

stderr | tests/conta.test.ts > conta e instância > com o cadastro desligado, não é possível criar conta
2026-11-17T23:23:04.814Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/conta.test.ts > conta e instância > com o cadastro desligado, não é possível criar conta
2026-11-17T23:23:04.869Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/conta.test.ts > conta e instância > com o cadastro desligado, o primeiro Usuário ainda pode se cadastrar
2026-11-17T23:23:04.927Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/volta-do-ciclo.test.ts > progresso na tela do Ciclo > cada Etapa traz o feito, e o Ciclo traz a Volta, os totais e as Matérias com progresso
2026-11-17T23:23:05.332Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/volta-do-ciclo.test.ts > progresso na tela do Ciclo > depois de fechar a Volta, mostra a Volta 2 com o instante em que abriu e soma as horas extras
2026-11-17T23:23:05.443Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.
```

`! grep -rEn "(bg/text/border/ring)-(paper/surface-2/surface/ink-2/ink/line/accent-ink/accent-soft/on-accent)([` - exit 0

```
(no output)
```

`test ! -e prototype` - exit 0

```
(no output)
```

`! grep -Ei "geist/disco do ciclo" docs/design-system.md && grep -q "1024px" docs/design-system.md && grep -q "` - exit 0

```
(no output)
```

`grep -q "ig7Pq2uPxPWjeWuCKmTuBW" AGENTS.md && grep -q "Figma vence" AGENTS.md` - exit 0

```
(no output)
```
