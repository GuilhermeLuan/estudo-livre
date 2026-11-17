# Interface no BoardUI checks

Build: `npm run typecheck`; `npm run build`
Run unit: `npx vitest run --reporter=verbose`
Plan: `.specs/features/interface-boardui/plan.md`

54 checks in 8 slices · 4 one-way doors · 0 open

## Checks


### S1 - Fundação BoardUI

**C1** - The app SHALL render all text in Inter, and no file under `src/` SHALL reference the tokens or classes listed in Landing door 2 (AC 1)
Proof: `! grep -rEn "(bg|text|border|ring)-(paper|surface-2|surface|ink-2|ink|line|accent-ink|accent-soft|on-accent)([^a-z-]|$)|var\(--(paper|surface|ink|line|geist)" src --include="*.ts" --include="*.tsx" && grep -q "Inter(" src/app/layout.tsx && ! grep -rEn "Geist" src`

**C2** - WHILE no `tema` is stored and the OS prefers light THEN the system SHALL render `background/full` as `#ebebe8` and `text/primary` as `#1c1c1b` (Claro suave, AD-002) (AC 2)
Proof: walk - with no `tema` stored and the OS in light, open `/` and read `background/full` and `text/primary` computed on `body`

**C3** - WHILE no `tema` is stored and the OS prefers dark THEN the system SHALL render the BoardUI Dark values, with the `dark` class present in the server-sent HTML before the first paint (no light flash) (AC 3)
Proof: walk - with no `tema` and the OS in dark, view source of `/entrar` and see the inline theme script in `<head>`; reload and see no light flash

**C4** - WHEN the Usuário picks "Claro" or "Escuro" in the theme toggle THEN the system SHALL apply it at once and SHALL keep it on reload in that browser, whatever the OS prefers (AC 4)
Proof: walk - pick Claro then Escuro in the theme toggle, reload, and see it kept whatever the OS prefers

**C5** - WHEN the Usuário picks "Sistema" in the theme toggle THEN the system SHALL remove `tema` and follow `prefers-color-scheme` again, including a live OS change (AC 5)
Proof: walk - pick Sistema, see `tema` removed from localStorage, flip the OS theme with the page open

**C6** - The PWA `theme-color` meta SHALL match `background/full` of the active theme (AC 6)
Proof: walk - read `meta[name=theme-color]` in both themes


### S2 - Sidebar e barra de abas

**C7** - WHEN the Usuário opens any `(app)` route at a width ≥ 1024px THEN the system SHALL show the Sidebar of `captures/hoje-claro-suave.png` with Hoje, Estatísticas, the section "Ciclos" listing each Ciclo by name plus a "+" that opens `/ciclos/n (AC 7)
Proof: browser - reach / at 1440px, light, with the Sidebar, save `.specs/features/interface-boardui/captures/hoje-claro-suave.running.png`

**C8** - WHEN the Usuário is on a route THEN the system SHALL mark its Sidebar item (or tab) as selected with `aria-current="page"`; on `/ciclos/[id]` the item of that Ciclo is the selected one (AC 8)
Proof: walk - visit `/`, `/estatisticas` and `/ciclos/<id>` and read `aria-current="page"` on the matching item

**C9** - WHILE a Cronômetro is running or paused, the Sidebar SHALL show the Cronômetro card with the time, "<Matéria> · <Ciclo>", the chip "Rodando" or "Pausado", and the buttons "Pausar"/"Retomar" and "Parar"; WHILE no Cronômetro exists the card S (AC 9)
Proof: walk - start a Cronômetro, see the Sidebar card with time, Matéria · Ciclo, chip and buttons; descartar and see the card gone

**C10** - WHEN the Usuário opens any `(app)` route at a width < 1024px THEN the system SHALL hide the Sidebar and show the bottom tab bar of `captures/pwa-hoje.png` with Hoje, the central "+" button and Estatísticas (AD-001), and the avatar at the to (AC 10)
Proof: walk - open `/` at 390px and see the tab bar and avatar, Sidebar hidden

**C11** - WHEN the Usuário taps the "+" tab THEN the system SHALL open Registrar estudo (S5) with the Próxima etapa of the first Ciclo selected (AC 11)
Proof: walk - tap the "+" tab and see Registrar estudo with the first Ciclo's Próxima etapa selected

**C12** - WHEN the Usuário taps the avatar on mobile THEN the system SHALL open a menu with the Ciclos, "Novo ciclo", Usuários (Admin only), the theme toggle and Sair (AC 12)
Proof: walk - tap the avatar at 390px and see Ciclos, Novo ciclo, Usuários (Admin), the theme toggle and Sair

**C13** - WHILE a Cronômetro runs at a width < 1024px on a route other than `/`, the system SHALL show a compact bar above the tab bar with the time, the Matéria and "Parar" (AC 13)
Proof: walk - with a Cronômetro running at 390px open `/estatisticas` and see the compact bar with Parar above the tab bar

**C14** - WHEN the Usuário uses "Sair" THEN the system SHALL end the session and show `/entrar`, as today (AC 14)
Proof: walk - use Sair and land on `/entrar`


### S3 - Hoje

**C15** - WHEN the Usuário opens `/` at 1440px THEN the system SHALL show the screen in `captures/hoje-claro-suave.png` (and `captures/hoje-escuro.png` in the dark theme), minus the "Revisões de hoje" card and indicator (AD-003); the Ciclos ativos co (AC 15)
Proof: browser - reach / at 1440px, save `.specs/features/interface-boardui/captures/hoje-claro-suave.running.png`

**C16** - WHEN the Usuário opens `/` at 390px THEN the system SHALL show the screen in `captures/pwa-hoje.png`, with the indicators Hoje, Questões and Semana in place of Hoje, Revisões and Acerto (AD-003), and the large Cronômetro card on top while o (AC 16)
Proof: browser - reach / at 390px, save `.specs/features/interface-boardui/captures/pwa-hoje.running.png`

**C17** - The indicator "Estudado hoje" SHALL sum the duration of every Registro de estudo dated today in Brasília, across all Ciclos, and show the difference from yesterday as a chip (AC 17)
Proof: run unit | ✓ tests/indicadores.test.ts > indicadores da Hoje > Estudado hoje soma o dia em Brasília
Proof: run unit | ✓ tests/indicadores.test.ts > indicadores da Hoje > um registro das 23h50 de ontem

**C18** - The indicator "Questões hoje" SHALL show today's total questões and the chip "<n>% de acerto" with acertos/questões rounded; with 0 questões today it SHALL show "0" and no chip (AC 18)
Proof: run unit | ✓ tests/indicadores.test.ts > indicadores da Hoje > Questões hoje soma as questões

**C19** - The indicator "Nesta semana" SHALL sum the current week (Monday to Sunday, Brasília) and show the change against the previous full week as "+N%"/"−N%"; with 0 last week it SHALL show no chip (AC 19)
Proof: run unit | ✓ tests/indicadores.test.ts > indicadores da Hoje > Nesta semana compara com a semana anterior inteira
Proof: run unit | ✓ tests/indicadores.test.ts > indicadores da Hoje > Nesta semana cai 50%

**C20** - The Ciclo card SHALL show name, "Volta N", the bar and "<p>% · <feito> de <carga>", and the Próxima etapa block with its own bar, "Registrar" and "Iniciar"; an Etapa whose Matéria has horas extras SHALL show the chip "+<tempo> extra" (AC 20)
Proof: walk - open `/` with a Ciclo whose Matéria has horas extras and read the card: name, Volta N, bar, Próxima etapa block with its own bar, Registrar, Iniciar and the chip

**C21** - WHEN the Usuário uses "Iniciar" on a Próxima etapa THEN the system SHALL start the Cronômetro on that Matéria and show it in the Sidebar; IF a Cronômetro already exists THEN the system SHALL show "Já existe um cronômetro rodando. Pare ou de (AC 21)
Proof: walk - Iniciar on a Próxima etapa starts the Cronômetro; Iniciar again shows the existing-timer message

**C22** - WHEN the Usuário uses "Registrar" on a Próxima etapa THEN the system SHALL open Registrar estudo with that Matéria selected (AC 22)
Proof: walk - Registrar on a Próxima etapa opens the modal with that Matéria selected

**C23** - WHEN the Usuário uses the arrow on a Ciclo card THEN the system SHALL open `/ciclos/<id>` (AC 23)
Proof: walk - the arrow on a Ciclo card opens `/ciclos/<id>`

**C24** - IF the Usuário has no Ciclo THEN `/` SHALL show an empty state with "Criar ciclo" linking to `/ciclos/novo` and no indicators (AC 24)
Proof: walk - with no Ciclo `/` shows the empty state with "Criar ciclo" and no indicators


### S4 - Ciclo

**C25** - WHEN the Usuário opens `/ciclos/<id>` at 1440px THEN the system SHALL show the screen in `captures/ciclo.png` minus the tabs, "Reiniciar volta", "Arquivar", the "Faixas de acerto" card and the "Tópicos estudados" column (AD-001) (AC 25)
Proof: browser - reach /ciclos/<id> at 1440px, save `.specs/features/interface-boardui/captures/ciclo.running.png`

**C26** - The header SHALL read "<n> etapas · <m> matérias · <carga total> por volta"; the Volta card SHALL show "Volta N", the start line of AD-005, "<p>% · <feito> de <carga>", "Faltam <tempo>" and "Horas extras <tempo>" (AC 26)
Proof: run unit | ✓ tests/volta-do-ciclo.test.ts > progresso na tela do Ciclo > cada Etapa traz o feito
Proof: run unit | ✓ tests/formato.test.ts > Volta e Situação da Etapa > Volta 3 aberta em 2/11

**C27** - The EtapaRow SHALL show the drag handle, position, Matéria, carga, the bar with percent and one Situação chip: "Concluída" (100%), "Próxima etapa" (the Próxima etapa, row highlighted), "Em andamento" (> 0%), "Não iniciada" (0%), or "+<tempo (AC 27)
Proof: run unit | ✓ tests/formato.test.ts > Volta e Situação da Etapa > uma Situação por Etapa
Proof: run unit | ✓ tests/volta-do-ciclo.test.ts > progresso na tela do Ciclo > cada Etapa traz o feito

**C28** - WHEN the Usuário drags an EtapaRow to a new position THEN the system SHALL save the new order and keep it on reload, as today (AC 28)
Proof: walk - drag an EtapaRow, reload and see the order kept

**C29** - WHEN the Usuário uses "Adicionar etapa" THEN the system SHALL open a modal with "Nome da matéria" and "Carga horária (h)" and, on save, show the new EtapaRow at the end (AC 29)
Proof: walk - Adicionar etapa opens the modal and the new row appears at the end

**C30** - WHEN the Usuário uses the row menu (⋮) of an Etapa THEN the system SHALL offer "Editar" (modal with the same fields, saved in place) and "Remover etapa", which asks to confirm before removing (AC 30)
Proof: walk - the ⋮ menu offers Editar (modal) and Remover etapa (confirm first)

**C31** - WHEN the Usuário uses "Renomear" next to the Ciclo name THEN the system SHALL let them edit and save the name, as today (AD-001) (AC 31)
Proof: walk - Renomear next to the Ciclo name saves the new name

**C32** - The side card "Matérias" SHALL list each Matéria with "<n> etapa(s) · <carga>" and a bar of its progress in the Volta; at < 1024px it SHALL move below the Etapas list (AC 32)
Proof: run unit | ✓ tests/volta-do-ciclo.test.ts > progresso na tela do Ciclo > cada Etapa traz o feito

**C33** - IF the Ciclo has no Etapa THEN the list SHALL show an empty state with "Adicionar etapa" (AC 33)
Proof: walk - a Ciclo with no Etapa shows the empty state with Adicionar etapa

**C34** - IF the Ciclo is not the Usuário's THEN the system SHALL answer 404, as today (AC 34)
Proof: run unit | ✓ tests/ciclos.test.ts > isolamento entre Usuários > um Usuário não vê nem altera Ciclos e Etapas de outro

**C35** - WHEN the Usuário opens `/ciclos/novo` THEN the system SHALL show the form in a card with the BoardUI Input and Button, and the same validation messages as today (AC 35)
Proof: walk - `/ciclos/novo` shows the form in a card and the validation message for an empty name


### S5 - Registrar estudo

**C36** - WHEN the Usuário uses "Registrar estudo" THEN the system SHALL show the modal in `captures/registrar-estudo.png` with Matéria, Conteúdo, Data, Duração, Tipo de estudo, Questões, Acertos, Acerto and Anotação, minus "Tópico", "Nota da revisão (AC 36)
Proof: browser - reach Registrar estudo open at 1440px, save `.specs/features/interface-boardui/captures/registrar-estudo.running.png`

**C37** - WHEN the Usuário uses "Parar" on the Cronômetro THEN the system SHALL open the modal with the duration filled in and the note "Duração preenchida pelo cronômetro" (AC 37)
Proof: walk - Parar on the Cronômetro opens the modal with the duration and the note

**C38** - WHEN the Usuário types Questões and Acertos THEN the field "Acerto" SHALL show acertos/questões rounded, as "80%" for 16 of 20, and "—" while Questões is empty or 0 (AC 38)
Proof: run unit | ✓ tests/formato.test.ts > variação e acerto > acerto arredondado
Proof: walk - type Questões 20 and Acertos 16 and see "80%"; clear Questões and see "—"

**C39** - IF the Usuário saves with Acertos greater than Questões THEN the system SHALL keep the modal open and show the server's message under the field, in the Input error style (AC 39)
Proof: walk - save with Acertos greater than Questões and see the message under the field with the modal open

**C40** - WHEN the Usuário uses "Salvar registro" with valid data THEN the system SHALL close the modal and the Hoje SHALL show the new totals; "Cancelar", the "×" and Esc SHALL close it without saving (AC 40)
Proof: walk - Salvar registro closes the modal and Hoje shows the new totals; Cancelar, × and Esc close without saving

**C41** - WHILE the width is < 1024px the modal SHALL open as a sheet from the bottom, full width (AC 41)
Proof: walk - open Registrar estudo at 390px and see the sheet from the bottom


### S6 - Estatísticas

**C42** - WHEN the Usuário opens `/estatisticas` THEN the system SHALL show the screen in `captures/estatisticas.png`, with the change chip only on "Nesta semana" and in "Horas por semana" (AD-004) (AC 42)
Proof: browser - reach /estatisticas at 1440px, save `.specs/features/interface-boardui/captures/estatisticas.running.png`

**C43** - WHEN the Usuário picks a Ciclo in the segmented control ("Todos os ciclos" plus one segment per Ciclo) THEN every card and chart SHALL show only that Ciclo, as the current filter does (AC 43)
Proof: walk - pick a Ciclo in the segmented control and see every card filtered

**C44** - The weekly change SHALL be (current − previous) / previous, rounded, from the last two weeks of the existing "horas por semana" (AC 44)
Proof: run unit | ✓ tests/estatisticas.test.ts > variação semanal > compara a semana atual com a anterior
Proof: run unit | ✓ tests/formato.test.ts > variação e acerto > variação arredondada

**C45** - IF there is no Registro de estudo in the filter THEN the system SHALL show an empty state with "Registrar estudo" and no zeroed charts (AC 45)
Proof: walk - with no Registro de estudo `/estatisticas` shows the empty state with Registrar estudo

**C46** - The system SHALL show a Matéria with no questões in "Horas por matéria" and SHALL NOT show it in "Acerto por matéria", as today (AC 46)
Proof: run unit | ✓ tests/estatisticas.test.ts > estatísticas > calcula o % de acerto por Matéria só com os registros que têm questões

**C47** - WHILE the width is < 1024px the cards SHALL stack in one column (AC 47)
Proof: walk - at 390px the cards stack in one column


### S7 - Conta e Usuários

**C48** - WHEN a visitor opens `/entrar` THEN the system SHALL show the screen in `captures/entrar.png` (AC 48)
Proof: browser - reach /entrar at 1440px, save `.specs/features/interface-boardui/captures/entrar.running.png`

**C49** - WHEN a visitor opens `/cadastrar`, `/esqueci-senha` or `/redefinir-senha` THEN the system SHALL show the same AuthCard as `/entrar`, with that page's current fields, messages and links (AC 49)
Proof: walk - open `/cadastrar`, `/esqueci-senha` and `/redefinir-senha` and see the same card as `/entrar`

**C50** - IF SMTP is not configured THEN `/entrar` SHALL NOT show "Esqueci minha senha", as today; IF sign-up is closed THEN `/cadastrar` SHALL show the current notice inside the AuthCard (AC 50)
Proof: walk - without SMTP `/entrar` has no "Esqueci minha senha"; with sign-up closed `/cadastrar` shows the notice in the card

**C51** - WHEN the Admin opens `/usuarios` THEN the system SHALL list the Usuários in a BoardUI Table with name, e-mail and the "Redefinir senha" action, which opens the current form inline in that row; a non-Admin SHALL be refused as today (AC 51)
Proof: walk - as Admin `/usuarios` lists the Usuários in the Table and "Redefinir senha" opens the form in the row; a non-Admin gets 404


### S8 - Design system

**C52** - The repository SHALL NOT contain `prototype/` (AC 52)
Proof: `test ! -e prototype`

**C53** - The document `docs/design-system.md` SHALL describe the BoardUI semantic tokens with the Claro suave and Escuro values, the type scale, the components of Landing door 1, the product components (Sidebar, StatCard, EtapaRow) and the 1024px br (AC 53)
Proof: `! grep -Ei "geist|disco do ciclo" docs/design-system.md && grep -q "1024px" docs/design-system.md && grep -q "Claro suave" docs/design-system.md && grep -q "Sidebar" docs/design-system.md && grep -q "StatCard" docs/design-system.md && grep -q "EtapaRow" docs/design-system.md && grep -q "text-title-1-medium" docs/design-system.md`

**C54** - The interface rule in `AGENTS.md` SHALL point to the Figma file `ig7Pq2uPxPWjeWuCKmTuBW` and say that, when Figma and the document differ, Figma wins and the document is corrected in the same PR (AC 54)
Proof: `grep -q "ig7Pq2uPxPWjeWuCKmTuBW" AGENTS.md && grep -q "Figma vence" AGENTS.md`
## Coverage

| Set (size) | Member -> proof | Unproven |
| --- | --- | --- |
| Landing doors (4) | 1 deps C1, C53 · 2 tokens C1 · 3 tema C2 C3 C4 C5 C6 · 4 referência C52 C53 C54 | - |
| Surface routes (0) | None - nothing consumed outside | - |
| indicator examples AC17-19 (7) | 1h10/0h45 C17 · 23h50 ontem C17 · nada hoje C17 · 20/16 C18 · 3/2 C18 · +12% C19 · −50% C19 | - |
| weekly change AC44 (3) | +12% C44 · −100% C44 · anterior 0 C44 | - |
| Volta line AC26 (2) | Volta 3 em 2/11 C26 · Volta 1 C26 | - |
| Situação AC27 (5) | Concluída C27 · Próxima etapa C27 · Em andamento C27 · Não iniciada C27 · +tempo extra C27 | - |
| source controls: hoje (7) | Iniciar cronômetro C21 · Registrar estudo C22 · Novo ciclo C23 · Registrar C22 · Iniciar C21 · seta do Ciclo C23 · Pausar/Parar C9 | - |
| source controls: ciclo (5) | alça C28 · ⋮ Editar/Remover C30 · Adicionar etapa C29 · Renomear C31 · NavItem C8 | - |
| source controls: registrar estudo (8) | Matéria C36 · Data C36 · Duração C36 · Tipo C36 · Questões C38 · Acertos C38 · Salvar/Cancelar/×/Esc C40 · Anotação C36 | - |
| source controls: estatísticas (1) | segmented control C43 | - |
| source controls: entrar (4) | E-mail C48 · Senha C48 · Esqueci minha senha C50 · Entrar/Criar conta C48 | - |
| startup config: tema before paint (1 assembly) | root layout `<head>` script C3 | - |

## Swept

- validation: existing - `tests/estudo.test.ts` (acertos > questões, duração, data) and `tests/ciclos.test.ts` (nome, carga); C39 shows the message
- failure modes: existing - server actions return `{ erro }`; C39, C28
- idempotency: n/a - read-only slice; the existing actions are unchanged
- authorization: existing - `tests/admin.test.ts`, `tests/ciclos.test.ts` isolation; C34, C51
- concurrency: existing - `tests/ciclos.test.ts` reordenação and `tests/cronometro.test.ts` simultaneous start
- data lifecycle: n/a - nothing stored; `tema` lives in localStorage (C4, C5)
- dependency failure: n/a - no new external call; localStorage access is wrapped in try/catch
- state transitions: C4, C5 (Sistema/Manual), C9 (Cronômetro card)
- observability: n/a - no logging requirement in this slice

## Handoff

- **Settled mid-build:** "Aprovado!" (the plan, 2026-11-17); the three unconfirmed assumptions stand as written.
- **Dispatched:** Verifier and screens round 1, both at HEAD 30a75ec (before send)
- **Boundary:** all code and docs committed; tests 88/88 green; build green.
- **Abandoned:** a first Docker outage blocked tests and the app for one turn; it passed on its own. Found and fixed in the walk: the Registrar estudo modal overflowed at 390px, `<form action>` cleared the fields after a refused save, and a server error left the field invalid so the browser would not resubmit.
- **Walked:** production build (`next start`) on a throwaway Postgres, seeded with 2 Ciclos, 9 Etapas and 7 Registros, logged in as Marina (Admin), Chrome for Testing at 1440x960 and 390x844, pt-BR, America/Sao_Paulo. Pictures saved: `entrar`, `hoje-claro-suave`, `hoje-escuro`, `pwa-hoje`, `ciclo`, `estatisticas`, `registrar-estudo` (`*.running.png`). Visited: Iniciar (C21), Parar opening the modal with the note (C37), Registrar with Acertos greater than Questões showing the message under the field, then fixing and saving, Hoje totals updated and the toast (C39 C40), the Acerto field (C38: 150% then 80%), Escuro from the user card applied at once (C4), Adicionar etapa modal (C29), the avatar menu with Ciclos, Novo ciclo, Usuários, tema and Sair (C12), the "+" sheet at 390px (C11 C41), the tab bar and big Cronômetro card (C10).
- **Not walked:** C3 C5 C6 (OS change, theme-color), C8, C13, C14, C22, C23, C24, C28 (drag), C30, C31, C33, C35, C43, C45, C47, C49, C50, C51.
