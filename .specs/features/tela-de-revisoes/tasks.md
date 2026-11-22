# Tela de revisões Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, the walk, check_proofs, the Verifier and the screens sub-agent).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: inline (below, "Design inline"); sem `design.md`: nenhuma decisão de arquitetura nova, só uma coluna no Cronômetro
**Status**: Done
**Approved**: 2026-11-22 - user: "Aprovado, implemente"
**Build**: `npm run typecheck; npm run build`
**Run unit**: `npx vitest run --reporter=verbose`

## Design inline

- `src/casos-de-uso/lista-de-revisoes.ts`: `listarRevisoes(db, usuario, { cicloId?, limiteVencidas? })` devolve `{ filtro: string | null, ciclos: { id, nome }[], vencidas: RevisaoDaLista[], proximas: RevisaoDaLista[], totalVencidas, totalProximas, totalVencidasGeral }` e `contarRevisoesVencidas(db, usuario)` (o Counter da Sidebar e o indicador). `RevisaoDaLista = { topicoId, topico, materiaId, materia, cicloId, ciclo, dia: "AAAA-MM-DD", diasDeAtraso: number (>0 atrasada, 0 hoje, <0 futura), ultimaNota: Nota | null, acerto: number | null }`. O filtro de Ciclo e a classificação por dia de Brasília rodam no servidor, onde os testes alcançam. Só Ciclos ativos (`arquivadoEm` nulo) e Cartões com `proximaRevisao` não nula entram.
- Última nota e acerto: o Registro mais recente do Tópico com `nota` (`dataHora`, `criadoEm`, `id` em ordem decrescente); acerto = `round(acertos*100/questoes)` com acertos nulo valendo 0 (como `revisao.ts`).
- `cronometro.topico_id text null` com `ON DELETE SET NULL` (migração 0008). `iniciarCronometro(..., topicoId?)` exige que o Tópico seja da Matéria; `obterCronometro` e `CronometroParado` passam a trazer `topicoId`.
- Telas: o filtro vem de `?ciclo=<id>` (SegmentedControl com links); `abrirRegistro(materiaId, topicoId?)` do provedor do Cronômetro abre o modal com o Tópico no modo "topico". O cartão da Hoje e a tabela da página usam o mesmo `listarRevisoes`.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines and spec. Guidelines found: `AGENTS.md` (UI follows `docs/design-system.md`, BoardUI tokens, `/frontend-design`), `vitest.config.ts` (tests in `tests/`, real Postgres), `docs/agents/*`. Existing `tests/*.test.ts` are the floor.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Casos de uso (`src/casos-de-uso/*.ts`) | integration (Postgres real) | 1:1 to spec ACs, edge cases, other-user isolation | `tests/*.test.ts` | `npx vitest run tests/lista-de-revisoes.test.ts tests/cronometro.test.ts` |
| Server actions e telas (`src/app/**`) | none | Provadas pela captura e pela visita (walk) | - | build gate |
| Schema e migração (`src/db/schema.ts`, `drizzle/*.sql`) | none | Coberta pelos testes dos casos de uso, que rodam a migração | - | build gate |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with one test file | `npx vitest run tests/lista-de-revisoes.test.ts` |
| Full | After tasks that touch existing use cases | `npx vitest run` |
| Build | After phase completion or tasks with no test layer | `npm run typecheck; npm run build; npx vitest run` |

---

## Execution Plan

### Phase 1: Domínio

```
T1 → T2 → T3
```

### Phase 2: Interface

```
T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10 → T11 → T12 → T13 → T14
```

---

## Task Breakdown

### T1: `listarRevisoes` e `contarRevisoesVencidas`

**What**: As listas de Vencidas e Próximos 7 dias, o filtro por Ciclo e o total de vencidas.
**Where**: `src/casos-de-uso/lista-de-revisoes.ts`
**Depends on**: None
**Reuses**: `src/casos-de-uso/home.ts` (Ciclos ativos), `src/dia.ts` (`hojeEmBrasilia`, `somarDias`), `tests/cartoes.test.ts` (cenário)
**Requirement**: REV-01, REV-03, REV-04, REV-05

**Done when**:

- [x] Implementa o desenho em "Design inline" e exporta em `src/casos-de-uso/index.ts`
- [x] Os testes de `tests/lista-de-revisoes.test.ts` cobrem cada critério de REV-01 (2, 3, 6, 7, 8), REV-03 (5, 6, 7, 9, 11), REV-05 (1 a 4), REV-02 (7, 8) e os Edge Cases, com os nomes dos checks C2 a C48
- [x] Gate check passes: `npx vitest run tests/lista-de-revisoes.test.ts`
- [x] Test count: o arquivo novo roda todos os testes dos checks, sem remoções

**Tests**: integration
**Gate**: quick

**Commit**: `feat(revisoes): listar Revisões vencidas e próximas`

---

### T2: Coluna `topico_id` no Cronômetro

**What**: `cronometro.topicoId` opcional, em cascata `SET NULL` com o Tópico, e a migração 0008.
**Where**: `src/db/schema.ts`
**Depends on**: T1
**Reuses**: migração `drizzle/0007_regular_wallflower.sql` (padrão)
**Requirement**: REV-02

**Done when**:

- [x] A migração gerada por `npm run db:generate` cria `topico_id` nulo com `ON DELETE SET NULL`
- [x] Gate check passes: `npm run typecheck; npx vitest run`

**Tests**: none
**Gate**: build

**Commit**: `feat(cronometro): guardar o Tópico do Cronômetro`

---

### T3: Cronômetro com Tópico

**What**: `iniciarCronometro` aceita `topicoId`, `obterCronometro` e `pararCronometro` o devolvem.
**Where**: `src/casos-de-uso/cronometro.ts`
**Depends on**: T2
**Reuses**: `tests/cronometro.test.ts`
**Requirement**: REV-02

**Done when**:

- [x] Um Tópico de outra Matéria é recusado como `NaoEncontradoError`
- [x] Os testes novos de `tests/cronometro.test.ts` cobrem REV-02 (2 a 6), com os nomes dos checks C15 a C20
- [x] Gate check passes: `npx vitest run tests/cronometro.test.ts`
- [x] Test count: os testes antigos do Cronômetro seguem passando

**Tests**: integration
**Gate**: quick

**Commit**: `feat(cronometro): iniciar e parar com Tópico`

---

### T4: Modal de registro com Tópico inicial

**What**: O formulário aceita um Tópico inicial: abre no modo "topico" com ele selecionado.
**Where**: `src/app/formulario-de-registro.tsx`
**Depends on**: T3
**Reuses**: `edicao.topicoId` do próprio formulário
**Requirement**: REV-02

**Done when**:

- [x] Com Matéria e Tópico iniciais, o modal mostra os dois selecionados e a data de hoje
- [x] Sem Tópico inicial, o modal abre como hoje
- [x] Gate check passes: `npm run typecheck`

**Tests**: none
**Gate**: build

**Commit**: `feat(registro): abrir o modal com Tópico inicial`

---

### T5: Provedor e ações do Cronômetro com Tópico

**What**: `abrirRegistro(materiaId, topicoId?)`, a ação de iniciar com Tópico e o modal aberto ao parar com o Tópico guardado.
**Where**: `src/app/cronometro.tsx`
**Depends on**: T4
**Reuses**: `src/app/acoes-cronometro.ts`
**Requirement**: REV-02

**Done when**:

- [x] `abrirRegistro` e `iniciarComTopico` ficam no contexto; `acoes-cronometro.ts` repassa `topicoId`
- [x] Ao parar, a sessão leva o `topicoId` ao modal
- [x] Gate check passes: `npm run typecheck`

**Tests**: none
**Gate**: build

**Commit**: `feat(cronometro): abrir registro e cronometrar com Tópico`

---

### T6: Filtro, chip e aviso das Revisões

**What**: Os blocos comuns: SegmentedControl do filtro por `?ciclo=`, o chip de vencimento e o aviso.
**Where**: `src/app/revisoes-comuns.tsx`
**Depends on**: T5
**Reuses**: `src/app/filtro-de-ciclo.tsx`, `src/components/base/badges/chip.tsx`, `src/components/base/segmented-control/segmented-control.tsx`
**Requirement**: REV-01, REV-03

**Done when**:

- [x] Chip "Atrasada Nd" (rosa), "Hoje" (amarelo), "Amanhã" e "dd/mm" (cinza) como em `captures/revisoes.png`
- [x] O aviso mostra o texto "Uma revisão é cumprida por um registro de estudo do tópico com questões." como em `captures/hoje.png`
- [x] Usa só tokens BoardUI; Gate check passes: `npm run typecheck`

**Tests**: none
**Gate**: build

**Commit**: `feat(revisoes): filtro, chip e aviso`

---

### T7: Cartão "Revisões de hoje"

**What**: O cartão da Hoje com Counter, filtro, até 6 linhas com "Registrar", "Ver todas as revisões", o aviso e o estado vazio.
**Where**: `src/app/cartao-de-revisoes.tsx`
**Depends on**: T6
**Reuses**: `src/app/revisoes-comuns.tsx`, `src/components/base/buttons/link-button.tsx`
**Requirement**: REV-01, REV-02

**Done when**:

- [x] O cartão segue o que `captures/hoje.png` desenha na coluna direita
- [x] "Registrar" chama `abrirRegistro(materiaId, topicoId)`
- [x] Gate check passes: `npm run typecheck`

**Tests**: none
**Gate**: build

**Commit**: `feat(revisoes): cartão Revisões de hoje`

---

### T8: Tabela da página Revisões

**What**: A tabela com as seções Vencidas e Próximos 7 dias, colunas, chips, "Registrar" e ▶.
**Where**: `src/app/tabela-de-revisoes.tsx`
**Depends on**: T7
**Reuses**: `src/components/base/table/table.tsx`, `src/app/revisoes-comuns.tsx`
**Requirement**: REV-02, REV-03

**Done when**:

- [x] A tabela segue `captures/revisoes.png` em 1440px; abaixo de 1024px cada Revisão vira uma linha sem rolagem horizontal da página
- [x] O ▶ chama o início do Cronômetro com Tópico e mostra o aviso devolvido; "Registrar" abre o modal
- [x] Gate check passes: `npm run typecheck`

**Tests**: none
**Gate**: build

**Commit**: `feat(revisoes): tabela de Revisões`

---

### T9: Página `/revisoes`

**What**: A rota com título, subtítulo, filtro, aviso, estados vazios e a tabela.
**Where**: `src/app/(app)/revisoes/page.tsx`
**Depends on**: T8
**Reuses**: `src/app/(app)/registros/page.tsx` (padrão de página com filtro)
**Requirement**: REV-03

**Done when**:

- [x] A página lê `?ciclo=` e chama `listarRevisoes`
- [x] Gate check passes: `npm run typecheck; npm run build`

**Tests**: none
**Gate**: build

**Commit**: `feat(revisoes): página Revisões`

---

### T10: Hoje com indicador e cartão de Revisões

**What**: O indicador "Revisões de hoje" (4 no computador, Hoje, Revisões e Questões no celular) e o cartão ao lado de "Ciclos ativos".
**Where**: `src/app/(app)/page.tsx`
**Depends on**: T9
**Reuses**: `src/app/cartao-de-indicador.tsx`, `src/app/cartao-de-revisoes.tsx`
**Requirement**: REV-01

**Done when**:

- [x] A Hoje em 1440px segue `captures/hoje.png` e em 390px `captures/pwa-hoje.png`
- [x] Gate check passes: `npm run typecheck; npm run build`

**Tests**: none
**Gate**: build

**Commit**: `feat(hoje): indicador e cartão de Revisões`

---

### T11: Item e aba "Revisões"

**What**: O item da Sidebar com Counter e a aba da barra de abas.
**Where**: `src/app/navegacao.tsx`
**Depends on**: T10
**Reuses**: itens e `Aba` do próprio arquivo
**Requirement**: REV-04

**Done when**:

- [x] Sidebar: "Revisões" entre Hoje e Registros, Counter só com vencidas; abas: "Revisões" entre Hoje e o "+"
- [x] Gate check passes: `npm run typecheck`

**Tests**: none
**Gate**: build

**Commit**: `feat(navegacao): item Revisões`

---

### T12: O layout entrega o total de vencidas

**What**: O layout `(app)` chama `contarRevisoesVencidas` e passa o total à navegação.
**Where**: `src/app/(app)/layout.tsx`
**Depends on**: T11
**Reuses**: `obterHome` já usado no layout
**Requirement**: REV-04

**Done when**:

- [x] O Counter da Sidebar mostra o total de todos os Ciclos ativos
- [x] Gate check passes: `npm run typecheck; npm run build; npx vitest run`

**Tests**: none
**Gate**: build

**Commit**: `feat(navegacao): Counter de Revisões vencidas`

### T13: Tipo de estudo inicial no modal de registro

**What**: O formulário aceita um Tipo de estudo inicial; sem ele, abre em "Teoria" como hoje.
**Where**: `src/app/formulario-de-registro.tsx`
**Depends on**: T12
**Reuses**: o estado `tipo` do próprio formulário
**Requirement**: REV-06

**Done when**:

- [x] Com `tipoInicial="Revisão"` o modal abre com "Revisão" selecionado e o campo `tipo` envia "Revisão"
- [x] Sem `tipoInicial`, e na edição de um Registro, o tipo é o de hoje
- [x] Gate check passes: `npm run typecheck`

**Tests**: none
**Gate**: build

**Commit**: `feat(registro): abrir o modal com o tipo de estudo inicial`

---

### T14: Registros de Revisão abrem com o tipo "Revisão"

**What**: O provedor do Cronômetro passa `tipoInicial="Revisão"` ao modal quando o registro vem de uma Revisão (Tópico inicial), por "Registrar" ou ao parar o Cronômetro de uma Revisão.
**Where**: `src/app/cronometro.tsx`
**Depends on**: T13
**Reuses**: `registro.topicoId` do provedor
**Requirement**: REV-06

**Done when**:

- [x] "Registrar" de uma Revisão (Hoje e página) e "Parar" do Cronômetro com Tópico abrem o modal com "Revisão"
- [x] O modal aberto por "Registrar estudo", pelo "+" e pelo Cronômetro sem Tópico abre com "Teoria"
- [x] Gate check passes: `npm run typecheck; npm run build`

**Tests**: none
**Gate**: build

**Commit**: `feat(registro): registrar revisão com o tipo Revisão`

---

## Checks

**C1** - A Hoje em 1440px segue `captures/hoje.png`, com o indicador na segunda posição e o cartão ao lado de "Ciclos ativos" (REV-01, AC 1)
Proof: browser captures/hoje.running.png

**C2** - Só entra como vencida a Revisão de Tópico de Ciclo ativo cujo dia de Brasília é hoje ou anterior (REV-01, AC 2)
Proof: run unit | ✓ tests/lista-de-revisoes.test.ts > revisões vencidas > conta como vencida a Revisão com próxima data hoje ou antes

**C3** - O indicador "Revisões de hoje" mostra o total de vencidas de todos os Ciclos ativos, sem chip (REV-01, AC 3)
Proof: walk - na Hoje, o indicador "Revisões de hoje" mostra o total de vencidas dos dois Ciclos e nenhum chip

**C4** - O Counter do cartão mostra a quantidade do filtro escolhido (REV-01, AC 4)
Proof: walk - ao escolher um Ciclo no cartão, o Counter passa ao número de vencidas dele

**C5** - Cada linha do cartão mostra Tópico, "Matéria · Ciclo", o chip "Atrasada Nd" ou "Hoje" e "Registrar" (REV-01, AC 5)
Proof: walk - no cartão, uma Revisão atrasada mostra o chip rosa "Atrasada 2d" e uma de hoje o chip amarelo "Hoje", ambas com "Registrar"

**C6** - As vencidas vêm do vencimento mais antigo ao mais novo, com desempate pelo nome do Tópico (REV-01, AC 6)
Proof: run unit | ✓ tests/lista-de-revisoes.test.ts > revisões vencidas > ordena do vencimento mais antigo ao mais novo, com desempate pelo nome do Tópico

**C7** - O cartão pede no máximo as 6 Revisões mais atrasadas e o total segue completo (REV-01, AC 6)
Proof: run unit | ✓ tests/lista-de-revisoes.test.ts > revisões vencidas > o limite devolve só as mais atrasadas e mantém o total completo, no limite do cartão

**C8** - Escolher um Ciclo lista e conta só as vencidas dele (REV-01, AC 7)
Proof: run unit | ✓ tests/lista-de-revisoes.test.ts > revisões vencidas > o filtro por Ciclo lista e conta só as Revisões do Ciclo

**C9** - "Todos" lista as vencidas de todos os Ciclos ativos (REV-01, AC 8)
Proof: run unit | ✓ tests/lista-de-revisoes.test.ts > revisões vencidas > sem filtro lista as de todos os Ciclos ativos

**C10** - "Ver todas as revisões" abre `/revisoes` com o mesmo filtro (REV-01, AC 9)
Proof: walk - com um Ciclo escolhido no cartão, "Ver todas as revisões" abre `/revisoes?ciclo=<id>` com o mesmo Ciclo marcado

**C11** - O cartão mostra o aviso "Uma revisão é cumprida por um registro de estudo do tópico com questões." (REV-01, AC 10)
Proof: walk - o cartão da Hoje mostra o aviso com esse texto

**C12** - Sem vencida no filtro, o cartão mostra "Nenhuma revisão vencida." e oculta "Ver todas as revisões" (REV-01, AC 11)
Proof: walk - com um Ciclo sem vencidas escolhido, o cartão mostra "Nenhuma revisão vencida." e não mostra o link

**C13** - A Hoje em 390px segue `captures/pwa-hoje.png`, com Hoje, Revisões e Questões e sem o cartão (REV-01, AC 12)
Proof: browser captures/pwa-hoje.running.png

**C14** - "Registrar" abre o modal com Matéria e Tópico da Revisão e a data de hoje (REV-02, AC 1)
Proof: walk - "Registrar" numa Revisão abre o modal "Registrar estudo" com a Matéria, o Tópico e a data de hoje

**C15** - Iniciar o Cronômetro com Tópico o guarda na Matéria (REV-02, AC 2)
Proof: run unit | ✓ tests/cronometro.test.ts > Tópico do Cronômetro > inicia guardando o Tópico

**C16** - Parar o Cronômetro devolve a Matéria, o Tópico e a duração (REV-02, AC 3)
Proof: run unit | ✓ tests/cronometro.test.ts > Tópico do Cronômetro > parar devolve o Tópico para o registro

**C17** - Ao parar o Cronômetro de uma Revisão, o modal abre com Matéria, Tópico e duração (REV-02, AC 3)
Proof: walk - o ▶ de uma Revisão inicia o Cronômetro e "Parar e registrar" abre o modal com a Matéria, o Tópico e a duração

**C18** - Com Cronômetro ativo ou pausado, iniciar outro é recusado com "Já existe um cronômetro rodando. Pare ou descarte antes de iniciar outro." (REV-02, AC 4)
Proof: run unit | ✓ tests/cronometro.test.ts > Tópico do Cronômetro > recusa o início com Cronômetro existente, com a mensagem

**C19** - Descartar o Cronômetro com Tópico não cria Registro (REV-02, AC 5)
Proof: run unit | ✓ tests/cronometro.test.ts > Tópico do Cronômetro > descartar apaga sem criar Registro

**C20** - Excluir o Tópico guardado mantém o Cronômetro sem Tópico (REV-02, AC 6)
Proof: run unit | ✓ tests/cronometro.test.ts > Tópico do Cronômetro > excluir o Tópico mantém o Cronômetro sem Tópico

**C21** - Um Registro do Tópico com questões tira a Revisão de Vencidas (REV-02, AC 7)
Proof: run unit | ✓ tests/lista-de-revisoes.test.ts > cumprir a Revisão > um Registro com questões tira a Revisão de Vencidas

**C22** - Um Registro do Tópico sem questões mantém a Revisão em Vencidas (REV-02, AC 8)
Proof: run unit | ✓ tests/lista-de-revisoes.test.ts > cumprir a Revisão > um Registro sem questões mantém a Revisão em Vencidas

**C23** - A página `/revisoes` em 1440px segue `captures/revisoes.png` (REV-03, AC 1)
Proof: browser captures/revisoes.running.png

**C24** - O subtítulo mostra "N vencidas · M nos próximos 7 dias" do filtro (REV-03, AC 2)
Proof: walk - em `/revisoes` o subtítulo mostra os totais e muda ao escolher um Ciclo

**C25** - Cada linha de Vencidas mostra Tópico, Matéria, Ciclo, chip, última nota, acerto, "Registrar" e ▶ (REV-03, AC 3)
Proof: walk - uma linha de Vencidas mostra as oito informações

**C26** - Cada linha de Próximos 7 dias mostra o chip "Amanhã" ou "dd/mm" e só "Registrar" neutro (REV-03, AC 4)
Proof: walk - uma linha de Próximos 7 dias tem o chip cinza e nenhum ▶

**C27** - Última nota e acerto vêm do Registro mais recente do Tópico com nota (REV-03, AC 5)
Proof: run unit | ✓ tests/lista-de-revisoes.test.ts > revisões vencidas > traz última nota e acerto do Registro mais recente com nota

**C28** - Sem Registro com nota, a última nota e o acerto vêm vazios (REV-03, AC 5)
Proof: run unit | ✓ tests/lista-de-revisoes.test.ts > revisões vencidas > traz nulos sem Registro com nota

**C29** - Cada seção vem do vencimento mais antigo ao mais novo, com desempate pelo nome do Tópico (REV-03, AC 6)
Proof: run unit | ✓ tests/lista-de-revisoes.test.ts > revisões vencidas > ordena do vencimento mais antigo ao mais novo, com desempate pelo nome do Tópico

**C30** - O filtro vale nas duas seções e nos totais (REV-03, AC 7)
Proof: run unit | ✓ tests/lista-de-revisoes.test.ts > revisões vencidas > o filtro vale nas duas seções e nos totais

**C31** - A página mostra o aviso sobre o que cumpre uma Revisão (REV-03, AC 8)
Proof: walk - `/revisoes` mostra o aviso com o texto da Hoje

**C32** - Um Ciclo desconhecido, de outro Usuário ou arquivado no filtro vale "Todos os ciclos" (REV-03, AC 9)
Proof: run unit | ✓ tests/lista-de-revisoes.test.ts > revisões vencidas > um Ciclo desconhecido, de outro Usuário ou arquivado vale Todos

**C33** - Sem vencidas a página mostra "Nenhuma revisão vencida." e sem próximas omite "Próximos 7 dias" (REV-03, AC 10)
Proof: walk - com um Ciclo sem Revisões escolhido, a página mostra "Nenhuma revisão vencida." e não mostra "Próximos 7 dias"

**C34** - Sem Ciclo ativo não há Revisão (REV-03, AC 11)
Proof: run unit | ✓ tests/lista-de-revisoes.test.ts > revisões vencidas > sem Ciclo ativo não há Revisão

**C35** - Abaixo de 1024px cada Revisão é uma linha, sem rolagem horizontal da página (REV-03, AC 12)
Proof: walk - em 390px `/revisoes` mostra cada Revisão em linha, sem rolagem horizontal

**C36** - A Sidebar mostra "Revisões" entre Hoje e Registros como em `captures/revisoes.png` (REV-04, AC 1)
Proof: browser captures/revisoes.running.png

**C37** - O item da Sidebar mostra o Counter com o total de vencidas (REV-04, AC 2)
Proof: walk - com Revisões vencidas, o item "Revisões" da Sidebar mostra o Counter com o total

**C38** - Sem vencida o item não mostra Counter (REV-04, AC 3)
Proof: walk - sem Revisões vencidas, o item "Revisões" da Sidebar não mostra Counter

**C39** - A barra de abas mostra "Revisões" entre Hoje e o "+" como em `captures/pwa-hoje.png` (REV-04, AC 4)
Proof: browser captures/pwa-hoje.running.png

**C40** - Em `/revisoes` o item da Sidebar e a aba ficam selecionados (REV-04, AC 5)
Proof: walk - em `/revisoes` o item da Sidebar e a aba têm `aria-current="page"`

**C41** - Um Ciclo arquivado some das Revisões e do total (REV-05, AC 1)
Proof: run unit | ✓ tests/lista-de-revisoes.test.ts > Ciclo arquivado > as Revisões do Ciclo arquivado somem da lista e do total

**C42** - Reativar devolve as Revisões com as mesmas datas (REV-05, AC 2)
Proof: run unit | ✓ tests/lista-de-revisoes.test.ts > Ciclo arquivado > reativar devolve as Revisões com as mesmas datas

**C43** - Arquivar e reativar não alteram os Cartões (REV-05, AC 3)
Proof: run unit | ✓ tests/lista-de-revisoes.test.ts > Ciclo arquivado > arquivar e reativar não alteram os Cartões

**C44** - Reativado depois da data, a Revisão volta vencida com o atraso até hoje (REV-05, AC 4)
Proof: run unit | ✓ tests/lista-de-revisoes.test.ts > Ciclo arquivado > reativado depois da data, a Revisão volta vencida com o atraso até hoje

**C45** - Cartão sem data de próxima revisão não aparece nem conta (Edge Cases)
Proof: run unit | ✓ tests/lista-de-revisoes.test.ts > revisões vencidas > Cartão sem data não aparece nem conta

**C46** - Excluir o Tópico tira a Revisão (Edge Cases)
Proof: run unit | ✓ tests/lista-de-revisoes.test.ts > revisões vencidas > excluir o Tópico tira a Revisão

**C47** - A Revisão é classificada pelo dia de Brasília, não pelo de UTC (Edge Cases)
Proof: run unit | ✓ tests/lista-de-revisoes.test.ts > revisões vencidas > classifica pelo dia de Brasília, não pelo de UTC

**C48** - Um Usuário só vê as Revisões dos Ciclos dele (Edge Cases)
Proof: run unit | ✓ tests/lista-de-revisoes.test.ts > revisões vencidas > Revisões de outro Usuário não aparecem

**C49** - Os próximos 7 dias vão de amanhã a hoje mais 7, inclusive (REV-03, AC 4)
Proof: run unit | ✓ tests/lista-de-revisoes.test.ts > revisões vencidas > os próximos 7 dias vão de amanhã a hoje mais 7, inclusive

**C50** - "Registrar" numa Revisão, na Hoje ou na página, abre o modal com o Tipo de estudo "Revisão" (REV-06, AC 1)
Proof: walk - "Registrar" numa Revisão do cartão da Hoje e da página Revisões abre o modal com "Revisão" marcado em "Tipo de estudo"

**C51** - Parar o Cronômetro iniciado pelo ▶ de uma Revisão abre o modal com "Revisão" (REV-06, AC 2)
Proof: walk - o ▶ de uma Revisão inicia o Cronômetro e "Parar" abre o modal com "Revisão" marcado

**C52** - O modal aberto fora de uma Revisão mantém "Teoria" (REV-06, AC 3)
Proof: walk - "Registrar estudo" no cabeçalho da Hoje e o "Registrar" do cartão do Ciclo abrem o modal com "Teoria" marcado

**C53** - Trocar o tipo no modal de uma Revisão grava o Registro com o tipo escolhido (REV-06, AC 4)
Proof: walk - no modal aberto por uma Revisão, escolher "Exercícios" e salvar cria o Registro com tipo "Exercícios" no histórico

---

## Handoff

The feature's live state, written as it happens - a compaction gives no warning.

**Settled mid-build:** none
**Dispatched:** Verifier e screens sub-agent (round 1) em `HEAD` 4d6aa7e, ambos `returned`; achados fechados em 99f53e2. Screens sub-agent (round 2, só a linha de `hoje.running.png` que diferia) em `HEAD` 99f53e2, `returned`: `hoje.running.png` ainda diverge em 1 linha (o filtro do cartão fica cortado à direita com os nomes longos dos Ciclos); sem terceira rodada, foi ao Usuário, que escolheu abreviar os segmentos do filtro (user: "Abreviar os segmentos (Recommended)", com uma rodada extra de telas). Correção em ce1e286; screens sub-agent (rodada extra, só `hoje.running.png`) em `HEAD` ce1e286; `returned`: `hoje.running.png` passou a `matches`.
**Walked:** Acesso: `http://localhost:3100` (`next start`) com o Postgres de desenvolvimento `estudo-livre-dev-pg` (porta 5432, banco `estudo`, migrado); entrar com `marina@exemplo.com` / `senha-de-teste-123` (dados do Figma: Ciclos "TRT 2ª Região" e "INSS Técnico" com 8 vencidas e 4 próximas, e o "Concurso antigo" arquivado) e `vazia@exemplo.com` / `senha-de-teste-123` (um Ciclo sem Revisões). Os estados das capturas: Hoje 1440px em `/` (`hoje.running.png`), página em `/revisoes` 1440px (`revisoes.running.png`), Hoje 390px em `/` (`pwa-hoje.running.png`), todas com a Marina.
- Hoje, Revisões vencidas: o indicador mostrou "Revisões de hoje 8" sem chip; o cartão mostrou o Counter 8, o filtro Todos / TRT 2ª Região / INSS Técnico, 6 linhas (as mais atrasadas, com "Atrasada 2d", "Atrasada 1d" e "Hoje"), "Ver todas as revisões" e o aviso azul. Ao escolher "TRT 2ª Região" o endereço passou a `/?ciclo=<id>` e o Counter e as linhas passaram a 6; "Ver todas as revisões" abriu `/revisoes?ciclo=<id>` com o mesmo Ciclo marcado e o subtítulo "6 vencidas · 4 nos próximos 7 dias". Com a Vera (sem Revisões) o cartão mostrou "Nenhuma revisão vencida." sem o link e com o aviso.
- Registrar a partir de uma Revisão: "Registrar Crase" no cartão abriu o modal "Registrar estudo" com a Matéria de Português, o conteúdo em modo Tópico com o Tópico "Crase" escolhido e a data de hoje.
- Cronômetro a partir de uma Revisão: o ▶ de "Crase" em `/revisoes` iniciou o Cronômetro (cartão "Rodando"); o ▶ de "Atos administrativos" mostrou o aviso "Já existe um cronômetro rodando. Pare ou descarte antes de iniciar outro." e seguiu habilitado; com o ▶ de "Redes de computadores" e "Parar", o modal abriu com a Matéria, o Tópico "Redes de computadores" e a duração preenchida pelo Cronômetro; "Descartar" removeu o cartão sem criar Registro.
- Página Revisões: subtítulo "8 vencidas · 4 nos próximos 7 dias"; seção Vencidas com 8 linhas (Tópico, Matéria, Ciclo, chip, última nota, acerto, "Registrar" azul e ▶, e "—" nas duas colunas do Tópico sem nota); seção Próximos 7 dias com 4 linhas, chip "Amanhã" ou "dd/mm" e só "Registrar" neutro; aviso no rodapé; um `?ciclo=` inexistente voltou para "Todos os ciclos" (8 vencidas). Com a Vera: "Nenhuma revisão vencida." sob Vencidas e sem a seção Próximos 7 dias.
- Navegação: a Sidebar mostrou "Revisões" entre Hoje e Registros com o Counter 8 e `aria-current="page"` em `/revisoes`; com a Vera o item não mostrou Counter. Em 390px a barra de abas mostrou Hoje, Revisões, "+", Registros e Estatísticas, com a aba "Revisões" marcada em `/revisoes`; a página não rolou na horizontal (`scrollWidth` 390 = `clientWidth` 390) e cada Revisão apareceu como um cartão.

---

## Phase Execution Map

```
Phase 1 → Phase 2

Phase 1:  T1 → T2 → T3
Phase 2:  T4 → T5 → T6 → T7 → T8 → T9 → T10 → T11 → T12 → T13 → T14
```
