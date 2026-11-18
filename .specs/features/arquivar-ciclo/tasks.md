# Arquivar e reativar ciclo Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, the walk, check_proofs, the Verifier and the screens sub-agent).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: inline (below, "Design inline"); sem `design.md`: escopo médio, nenhuma decisão de arquitetura nova
**Status**: In Progress
**Approved**: 2026-11-18 - user: "aprovado, comece"
**Build**: `npm run typecheck; npm run build`
**Run unit**: `npx vitest run --reporter=verbose`

## Design inline

- `ciclo.arquivado_em timestamp null` (migração 0007). Arquivado = não nulo. Nada mais muda de lugar: Registros, Voltas, Cartões ficam onde estão.
- `src/casos-de-uso/arquivados.ts`: `arquivarCiclo` e `reativarCiclo` (idempotentes, dono, trava o Ciclo). `arquivarCiclo` recusa com `ValidacaoError("Pare ou descarte o cronômetro antes de arquivar.")` se o Cronômetro do Usuário é de uma Matéria do Ciclo.
- `obterHome`: `ciclos` passa a ser só os ativos (progresso incluído); novo campo `arquivados: { id, nome, volta, totalEtapas, materias: {id, nome}[] }[]`, do arquivado há menos tempo ao mais antigo. Os indicadores seguem somando todos os Registros. `obterCiclo` devolve `arquivado: boolean`.
- Guarda de escrita `ESCRITA_EM_ARQUIVADO = "Ciclo arquivado. Reative para alterar."` (`ValidacaoError`): em `travarCiclo` (adicionar/editar/remover/reordenar Etapa e reiniciar Volta), `renomearCiclo`, `salvarFaixas`, `travarMateria` (Tópicos), `registrarEstudo`, `iniciarCronometro` e no destino de `editarRegistro` quando a Matéria muda. Editar sem trocar a Matéria e excluir Registro seguem permitidos (`travarCiclos` de `registros.ts` não recebe a guarda).
- Telas: o layout monta `materias` só dos Ciclos ativos e `materiasArquivadas` dos arquivados; a lista de Registros oferece, na edição, as ativas mais a Matéria atual do Registro. A página `/ciclos/arquivados` e o item "Arquivados" (Counter) seguem os padrões de `navegacao.tsx`; "Arquivar" usa `AlertDialog` como `reiniciar-volta.tsx`.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines and spec. Guidelines found: `AGENTS.md` (UI follows `docs/design-system.md`, BoardUI tokens, `/frontend-design`), `vitest.config.ts` (tests in `tests/`, real Postgres), `docs/agents/*`. Existing `tests/*.test.ts` are the floor.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Casos de uso (`src/casos-de-uso/*.ts`) | integration (Postgres real) | 1:1 to spec ACs, failure paths, other-user isolation | `tests/*.test.ts` | `npx vitest run tests/arquivados.test.ts` |
| Server actions e telas (`src/app/**`) | none | Provadas pela captura e pela visita (walk) | - | build gate |
| Schema e migração (`src/db/schema.ts`, `drizzle/*.sql`) | none | Coberta pelos testes dos casos de uso, que rodam a migração | - | build gate |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with one test file | `npx vitest run tests/arquivados.test.ts` |
| Full | After tasks that touch existing use cases | `npx vitest run` |
| Build | After phase completion or tasks with no test layer | `npm run typecheck; npm run build; npx vitest run` |

---

## Execution Plan

### Phase 1: Domínio

```
T1 → T2 → T3 → T4
```

### Phase 2: Interface

```
T4 → T5 → T6 → T7 → T8
```

---

## Task Breakdown

### T1: Arquivar e reativar

**What**: Coluna `arquivado_em`, migração 0007 e `arquivarCiclo`/`reativarCiclo` (idempotentes, só do dono, trava o Ciclo, recusam com Cronômetro ativo do Ciclo).
**Where**: `src/casos-de-uso/arquivados.ts`
**Depends on**: None
**Reuses**: `travarCiclo` de `src/casos-de-uso/ciclos.ts`, `ValidacaoError`, `NaoEncontradoError`
**Requirement**: ARQ-01, ARQ-02, ARQ-03, ARQ-05, ARQ-08

**Done when**:

- [x] `arquivado_em` em `src/db/schema.ts` e `drizzle/0007_*.sql` gerada por `npm run db:generate`; exportados em `src/casos-de-uso/index.ts`
- [x] Testes de `tests/arquivados.test.ts` (grupo `arquivar e reativar`) passam: arquivar marca o Ciclo, recusa com Cronômetro do Ciclo e arquiva com Cronômetro de outro Ciclo, não altera Registros, Voltas, Cartões, Etapas nem Faixas, idempotência dos dois sentidos, Ciclo de outro Usuário e inexistente dão `NaoEncontradoError`, reativar devolve o estado
- [x] Gate quick passes: `npx vitest run tests/arquivados.test.ts`

**Tests**: integration
**Gate**: quick
**Commit**: `feat(arquivados): arquivar e reativar ciclo`

---

### T2: A Hoje e as leituras sem o arquivado

**What**: `obterHome` devolve em `ciclos` só os ativos e em `arquivados` os arquivados (nome, Volta, total de Etapas, Matérias), do mais recente ao mais antigo; `obterCiclo` devolve `arquivado`. Indicadores, Registros e Estatísticas seguem contando tudo.
**Where**: `src/casos-de-uso/home.ts`
**Depends on**: T1
**Reuses**: `progressoDosCiclos`, `obterCiclo` em `src/casos-de-uso/ciclos.ts` (campo `arquivado`)
**Requirement**: ARQ-04, ARQ-07, ARQ-12

**Done when**:

- [x] Testes (grupo `leituras`) passam: `ciclos` e Próxima etapa sem o arquivado, `arquivados` na ordem pedida, `obterCiclo` com `arquivado`, `listarRegistros`, `obterEstatisticas` (inclui o Ciclo nos filtros) e indicadores somam o Ciclo arquivado
- [x] Gate full passes: `npx vitest run`

**Tests**: integration
**Gate**: full
**Commit**: `feat(arquivados): home sem o arquivado e lista de arquivados`

---

### T3: Escritas recusadas no Ciclo arquivado (Etapas, nome, Faixas, Volta)

**What**: Guarda `ESCRITA_EM_ARQUIVADO` em `travarCiclo`, `renomearCiclo` e `salvarFaixas`.
**Where**: `src/casos-de-uso/ciclos.ts`
**Depends on**: T2
**Reuses**: `ValidacaoError`
**Requirement**: ARQ-10

**Done when**:

- [x] `faixas.ts` recebe a mesma guarda no `UPDATE`
- [x] Testes (grupo `escritas no Ciclo arquivado`) passam: renomear, adicionar, editar, remover e reordenar Etapa, reiniciar Volta e salvar Faixas recusam com "Ciclo arquivado. Reative para alterar." e nada muda; depois de reativar, voltam a funcionar
- [x] Gate full passes: `npx vitest run`

**Tests**: integration
**Gate**: full
**Commit**: `feat(arquivados): recusa alterar etapas, nome e faixas de ciclo arquivado`

---

### T4: Escritas recusadas no Ciclo arquivado (Tópicos, Registros, Cronômetro)

**What**: A mesma guarda em `travarMateria`, `registrarEstudo`, `iniciarCronometro` e no destino de `editarRegistro` quando a Matéria muda; editar sem trocar a Matéria e excluir seguem permitidos.
**Where**: `src/casos-de-uso/topicos.ts`
**Depends on**: T3
**Reuses**: guarda de T3 (exportada de `ciclos.ts`)
**Requirement**: ARQ-10, ARQ-11

**Done when**:

- [x] `estudo.ts`, `cronometro.ts` e `registros.ts` recebem a guarda nos pontos do design
- [x] Testes passam: criar, importar, renomear, excluir e marcar Tópico, registro novo, edição que troca para Matéria do arquivado e início do Cronômetro recusam; editar sem trocar a Matéria e excluir Registro funcionam e recalculam o Cartão; mover um Registro de Ciclo arquivado para um ativo funciona
- [x] Gate full passes: `npx vitest run`

**Tests**: integration
**Gate**: full
**Commit**: `feat(arquivados): recusa registrar e alterar topicos em ciclo arquivado`

---

### T5: Sidebar, menu do celular e layout

**What**: Item "Arquivados" (Counter só com arquivados) entre os Ciclos e o Cronômetro, e item "Arquivados" no menu da conta do celular; o layout passa `arquivados` ao menu e as Matérias dos arquivados à lista de Registros.
**Where**: `src/app/navegacao.tsx`
**Depends on**: T4
**Reuses**: `ItemDeNavegacao`, `Counter`, `DadosDoMenu`
**Requirement**: ARQ-06, ARQ-04

**Done when**:

- [x] `src/app/(app)/layout.tsx` monta `materias` só dos ativos e `materiasArquivadas` dos arquivados, e passa `arquivados` ao menu
- [x] Sidebar como em `.specs/features/arquivar-ciclo/captures/ciclo.png`, selecionada em `/ciclos/arquivados`
- [x] Gate build passes: `npm run typecheck; npm run build`

**Tests**: none
**Gate**: build
**Commit**: `feat(arquivados): item Arquivados na sidebar e no menu`

---

### T6: Registros com os Ciclos arquivados

**What**: O filtro de Ciclo e Matéria da página de Registros lista também os arquivados, e o modal de edição oferece as Matérias ativas mais a atual do Registro.
**Where**: `src/app/(app)/registros/page.tsx`
**Depends on**: T5
**Reuses**: `FiltrosDeRegistros`, `lista-de-registros.tsx`, `useCronometro`
**Requirement**: ARQ-12, ARQ-11

**Done when**:

- [x] `src/app/lista-de-registros.tsx` e `src/app/cronometro.tsx` recebem `materiasArquivadas` e a edição usa a Matéria atual do Registro mesmo arquivada
- [x] Gate build passes: `npm run typecheck; npm run build`

**Tests**: none
**Gate**: build
**Commit**: `feat(arquivados): registros mostram ciclos arquivados`

---

### T7: Arquivar na tela do Ciclo e leitura do arquivado

**What**: Botão "Arquivar" com `AlertDialog` e a action `arquivar`; com o Ciclo arquivado, "Reativar" no lugar e sem as ações de alteração.
**Where**: `src/app/arquivar-ciclo.tsx`
**Depends on**: T6
**Reuses**: `reiniciar-volta.tsx`, `acoes-ciclos.ts`, `Aviso`
**Requirement**: ARQ-01, ARQ-03, ARQ-02, ARQ-09

**Done when**:

- [x] `acoes-ciclos.ts` com `arquivar` (vai à Hoje) e `reativar`, devolvendo o erro do caso de uso
- [x] `src/app/(app)/ciclos/[id]/page.tsx` mostra "Arquivar" ou "Reativar" e esconde "Adicionar etapa", "Reiniciar volta", "Renomear", o menu e a ordenação das Etapas, "Editar" das Faixas e as ações de Tópicos quando arquivado
- [x] Tela como `.specs/features/arquivar-ciclo/captures/ciclo.png`
- [x] Gate build passes: `npm run typecheck; npm run build`

**Tests**: none
**Gate**: build
**Commit**: `feat(arquivados): arquivar e reativar na tela do ciclo`

---

### T8: Página dos Ciclos arquivados

**What**: `/ciclos/arquivados` com um cartão por Ciclo (nome com link, "Volta N", etapas, "Reativar") e o texto "Nenhum ciclo arquivado." sem arquivados.
**Where**: `src/app/(app)/ciclos/arquivados/page.tsx`
**Depends on**: T7
**Reuses**: `obterHome`, `quantidade` de `src/app/formato.ts`, `reativar` de T7
**Requirement**: ARQ-07, ARQ-08

**Done when**:

- [x] Reativar tira o Ciclo da lista e ele volta à Hoje e à Sidebar
- [x] Gate build passes: `npm run typecheck; npm run build`

**Tests**: none
**Gate**: build
**Commit**: `feat(arquivados): pagina dos ciclos arquivados`

---

## Checks

**C1** - O botão "Arquivar" e o item "Arquivados" seguem a composição de `captures/ciclo.png` (ARQ-01, AC 1; ARQ-06, AC 1)
Proof: browser captures/ciclo.running.png

**C2** - "Arquivar" abre o AlertDialog "Arquivar ciclo?" com o texto "O histórico de “<nome>” continua guardado e você pode reativar o ciclo quando quiser." e os botões "Cancelar" e "Arquivar" (ARQ-01, AC 1)
Proof: walk - na tela do Ciclo, "Arquivar" abre o diálogo com o título, o texto com o nome do Ciclo e os dois botões

**C3** - "Cancelar" fecha o diálogo e o Ciclo segue ativo na Hoje (ARQ-01, AC 2)
Proof: walk - "Cancelar" fecha o diálogo e o Ciclo continua na Sidebar

**C4** - Arquivar marca o Ciclo como arquivado e `arquivarCiclo` o tira de `ciclos` (ARQ-01, AC 3)
Proof: run unit | ✓ tests/arquivados.test.ts > arquivar e reativar > arquivar marca o Ciclo como arquivado

**C5** - Confirmar "Arquivar" leva o Usuário à Hoje (ARQ-01, AC 3)
Proof: walk - confirmar o diálogo abre a Hoje sem o Ciclo arquivado

**C6** - Com o Cronômetro ativo numa Matéria do Ciclo, arquivar é recusado com "Pare ou descarte o cronômetro antes de arquivar." e o Ciclo segue ativo (ARQ-02, AC 4)
Proof: run unit | ✓ tests/arquivados.test.ts > arquivar e reativar > recusa arquivar com o Cronômetro do Ciclo ativo

**C7** - Arquivar e reativar não alteram Registros, Voltas, Etapas, Matérias, Tópicos, Cartões nem Faixas (ARQ-03, AC 5)
Proof: run unit | ✓ tests/arquivados.test.ts > arquivar e reativar > arquivar e reativar não alteram o histórico

**C8** - O Ciclo arquivado sai de `ciclos` da Hoje e da Próxima etapa (ARQ-04, AC 6)
Proof: run unit | ✓ tests/arquivados.test.ts > leituras > o Ciclo arquivado sai da Hoje e da Próxima etapa

**C9** - O Ciclo arquivado some da Sidebar, do menu do celular e da Matéria sugerida do registro e do Cronômetro (ARQ-04, AC 6)
Proof: walk - com um Ciclo arquivado, a lista "Ciclos" da Sidebar e o menu do celular não o mostram, e "Registrar estudo" abre com a Matéria de um Ciclo ativo

**C10** - As Matérias do Ciclo arquivado não aparecem no seletor do modal de registro nem no início do Cronômetro (ARQ-04, AC 7)
Proof: walk - no modal "Registrar estudo", o seletor de Matéria não lista as Matérias do Ciclo arquivado

**C11** - Arquivar um Ciclo já arquivado conclui sem erro e sem mudança (ARQ-05, AC 8)
Proof: run unit | ✓ tests/arquivados.test.ts > arquivar e reativar > arquivar duas vezes é idempotente

**C12** - Ciclo de outro Usuário ou inexistente dá "não encontrado" ao arquivar e reativar (ARQ-05, AC 9)
Proof: run unit | ✓ tests/arquivados.test.ts > arquivar e reativar > ciclo de outro Usuário ou inexistente não é encontrado

**C13** - O item "Arquivados" aparece na Sidebar ligado a `/ciclos/arquivados` (ARQ-06, AC 1)
Proof: walk - o item "Arquivados" da Sidebar leva a `/ciclos/arquivados` e fica selecionado

**C14** - Com arquivados, o item mostra um Counter com a quantidade (ARQ-06, AC 2)
Proof: walk - com 1 Ciclo arquivado o item mostra o Counter "1"

**C15** - Sem arquivados, o item aparece sem Counter (ARQ-06, AC 3)
Proof: walk - sem Ciclo arquivado o item "Arquivados" aparece sem Counter

**C16** - No celular, "Arquivados" é item do menu da conta (ARQ-06, AC 4)
Proof: walk - numa janela de 390px, o menu do avatar mostra "Arquivados" e leva à lista

**C17** - A lista de arquivados vai do arquivado mais recentemente ao mais antigo (ARQ-07, AC 5)
Proof: run unit | ✓ tests/arquivados.test.ts > leituras > arquivados do mais recente ao mais antigo

**C18** - Cada cartão da lista mostra nome (com link para o Ciclo), "Volta N", a quantidade de etapas e "Reativar" (ARQ-07, AC 5)
Proof: walk - `/ciclos/arquivados` mostra um cartão por Ciclo com nome, "Volta N", etapas e "Reativar", e o nome abre a tela do Ciclo

**C19** - Sem arquivados, a página mostra "Nenhum ciclo arquivado." (ARQ-07, AC 6)
Proof: walk - `/ciclos/arquivados` sem arquivados mostra "Nenhum ciclo arquivado."

**C20** - `reativarCiclo` devolve o Ciclo a `ciclos` com a mesma Volta e o mesmo progresso (ARQ-08, AC 7)
Proof: run unit | ✓ tests/arquivados.test.ts > arquivar e reativar > reativar devolve o Ciclo à Hoje com a mesma Volta e o mesmo progresso

**C21** - "Reativar" tira o Ciclo da lista e ele volta à Hoje, à Sidebar e ao seletor de Matéria (ARQ-08, AC 7)
Proof: walk - "Reativar" na lista de arquivados faz o cartão sumir e o Ciclo reaparecer na Hoje, na Sidebar e no modal de registro

**C22** - Reativar um Ciclo ativo conclui sem erro e sem mudança (ARQ-08, AC 8)
Proof: run unit | ✓ tests/arquivados.test.ts > arquivar e reativar > reativar duas vezes é idempotente

**C23** - A tela do Ciclo arquivado mostra "Reativar" no lugar de "Arquivar" e não mostra Adicionar etapa, Reiniciar volta, Renomear, menu e ordenação das Etapas, Editar das Faixas nem ações de Tópicos (ARQ-09, AC 1)
Proof: walk - a tela de um Ciclo arquivado tem as abas e os dados, "Reativar", e nenhuma das ações de alteração

**C24** - Renomear, adicionar, editar, remover e reordenar Etapa, reiniciar Volta e salvar Faixas num Ciclo arquivado recusam com "Ciclo arquivado. Reative para alterar." e nada muda (ARQ-10, AC 2)
Proof: run unit | ✓ tests/arquivados.test.ts > escritas no Ciclo arquivado > Ciclo, Etapas, Volta e Faixas recusam a escrita

**C25** - Criar, importar, renomear, excluir e marcar Tópico de Matéria de Ciclo arquivado recusam com a mesma mensagem (ARQ-10, AC 2)
Proof: run unit | ✓ tests/arquivados.test.ts > escritas no Ciclo arquivado > Tópicos recusam a escrita

**C26** - Registro novo, edição que troca a Matéria para a de um Ciclo arquivado e início do Cronômetro nela recusam com a mesma mensagem (ARQ-10, AC 3)
Proof: run unit | ✓ tests/arquivados.test.ts > escritas no Ciclo arquivado > Registro novo, troca de Matéria e Cronômetro recusam

**C27** - Editar sem trocar a Matéria e excluir Registro de Ciclo arquivado funcionam e recalculam o Cartão (ARQ-11, AC 4)
Proof: run unit | ✓ tests/arquivados.test.ts > escritas no Ciclo arquivado > editar e excluir Registros antigos continua permitido

**C28** - No histórico de Registros, editar um Registro de Ciclo arquivado abre o modal com a Matéria dele selecionada (ARQ-11, AC 4)
Proof: walk - em Registros, "Editar" num Registro de Ciclo arquivado abre o modal com a Matéria e o Ciclo dele, e salvar funciona

**C29** - Os Registros do arquivado seguem em `listarRegistros` e nas Estatísticas, inclusive como opção do filtro de Ciclo (ARQ-12, AC 1)
Proof: run unit | ✓ tests/arquivados.test.ts > leituras > Registros e Estatísticas seguem contando o Ciclo arquivado

**C30** - Os filtros de Registros e de Estatísticas mostram o Ciclo arquivado (ARQ-12, AC 1)
Proof: walk - o filtro de Ciclo de Registros e o de Estatísticas listam o Ciclo arquivado e filtram por ele

**C31** - Os indicadores da Hoje seguem somando o Ciclo arquivado (ARQ-12, AC 2)
Proof: run unit | ✓ tests/arquivados.test.ts > leituras > indicadores da Hoje seguem somando o Ciclo arquivado

**C32** - Arquivando o único Ciclo ativo, a Hoje mostra "Nenhum ciclo ainda" e "Arquivados" com Counter 1 (Edge)
Proof: walk - com um só Ciclo, arquivá-lo deixa a Hoje com "Nenhum ciclo ainda" e o Counter "1"

**C33** - Com o Cronômetro numa Matéria de outro Ciclo, arquivar funciona (Edge)
Proof: run unit | ✓ tests/arquivados.test.ts > arquivar e reativar > arquiva com o Cronômetro de outro Ciclo

---

## Handoff

**Settled mid-build:** none
**Dispatched:** none
**Walked:** not yet

---

## Phase Execution Map

```
Phase 1 → Phase 2

Phase 1:  T1 ------→ T2 ------→ T3 ------→ T4
Phase 2:  T5 ------→ T6 ------→ T7 ------→ T8
```
