# Gestão de voltas Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, the walk, check_proofs, the Verifier and the screens sub-agent).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: none - a mudança cabe nas camadas que já existem (casos de uso, server actions, componentes da tela do Ciclo)
**Status**: Approved
**Approved**: 2026-11-17 - user: "Aprovado, pode começar"
**Build**: `npm run typecheck; npm run build`
**Run unit**: `npx vitest run tests/voltas.test.ts tests/formato.test.ts --reporter=verbose`

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `AGENTS.md` (BoardUI, design system, commits), `vitest.config.ts`, `package.json`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Casos de uso (`src/casos-de-uso`) | integration (Postgres real) | Todos os ramos; 1:1 com os critérios da spec; cada caso de borda | `tests/*.test.ts` | `npx vitest run tests/voltas.test.ts --reporter=verbose` |
| Formatação e regras puras (`src/app/formato.ts`) | unit | Todos os ramos; os valores concretos da spec | `tests/formato.test.ts` | `npx vitest run tests/formato.test.ts --reporter=verbose` |
| Server actions (`src/app/acoes-*.ts`) | none | Só o gate de build: delegam aos casos de uso | - | build gate only |
| Componentes e páginas (`src/app/*.tsx`) | none | Gate de build + captura `running.png` e walk (sem teste de componente no repo) | - | build gate only |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tarefas só com a regra pura | `npx vitest run tests/formato.test.ts` |
| Full | Tarefas com casos de uso | `npx vitest run` |
| Build | Tarefas de ação, componente ou página | `npm run typecheck; npm run build; npx vitest run` |

---

## Execution Plan

### Phase 1: Regras e casos de uso

```
T1 → T2 → T3
```

### Phase 2: Ações e componentes

```
T3 → T4 → T5 → T6
```

### Phase 3: Tela

```
T6 → T7 → T8 → T9 → T10
```

---

## Task Breakdown

### T1: Listar Voltas e reiniciar a Volta

**What**: `listarVoltas` (Volta aberta primeiro, Volta 1 com início na criação do Ciclo) e `reiniciarVolta` (fecha a aberta e abre a seguinte no mesmo instante; recusa número de Volta que já não é a aberta), exportadas pelo índice dos casos de uso.
**Where**: `src/casos-de-uso/voltas.ts`
**Depends on**: None
**Reuses**: `travarCiclo` de `ciclos.ts` (exportá-la), `NaoEncontradoError`, `ValidacaoError`
**Requirement**: VOLTA-02, VOLTA-04, VOLTA-05, VOLTA-06, VOLTA-07, VOLTA-09, VOLTA-11, VOLTA-12, VOLTA-13, VOLTA-14

**Done when**:

- [x] `listarVoltas(db, usuario, cicloId)` devolve `{ numero, inicio, fim }` da maior à menor; a Volta 1 traz `ciclo.criadoEm` como início
- [x] `reiniciarVolta(db, usuario, cicloId, numero)` fecha e abre com o mesmo instante, sob a trava do Ciclo
- [x] Ciclo de outro Usuário ou inexistente: `NaoEncontradoError`; número desatualizado: `ValidacaoError("Esta volta já foi reiniciada. Atualize a página.")`
- [x] Gate passes: `npx vitest run`
- [x] 9 testes novos em `tests/voltas.test.ts` passam, sem testes removidos

**Tests**: integration
**Gate**: full

**Commit**: `feat(voltas): listar e reiniciar voltas do ciclo`

---

### T2: Datas, duração e aviso da Volta

**What**: `dataDaVolta` (`dd/mm/aaaa` no fuso de Brasília), `duracaoDaVolta` (dias de calendário: "Mesmo dia", "1 dia", "N dias") e `avisoDaVoltaConcluida` ("Volta N concluída. A Volta N+1 começou.").
**Where**: `src/app/formato.ts`
**Depends on**: T1
**Reuses**: `FUSO`, `hojeEmBrasilia`, `quantidade`, a conta de dias de `descricaoDaVolta`
**Requirement**: VOLTA-03, VOLTA-19

**Done when**:

- [x] As três funções exportadas com os valores da spec
- [x] Gate passes: `npx vitest run tests/formato.test.ts`
- [x] 2 testes novos em `tests/formato.test.ts` passam, sem testes removidos

**Tests**: unit
**Gate**: quick

**Commit**: `feat(voltas): formato de data, duração e aviso da volta`

---

### T3: Fechar a Volta ao mudar as Etapas

**What**: `adicionarEtapa`, `editarEtapa` e `removerEtapa` chamam `avaliarFechamentoDaVolta` na mesma transação e devolvem `voltaFechada` (número ou null); `reordenarEtapas` não.
**Where**: `src/casos-de-uso/ciclos.ts`
**Depends on**: T2
**Reuses**: `avaliarFechamentoDaVolta` de `progresso.ts`
**Requirement**: VOLTA-16, VOLTA-17, VOLTA-18, VOLTA-20, VOLTA-21, VOLTA-22, VOLTA-23

**Done when**:

- [x] As três funções devolvem `voltaFechada`; `removerEtapa` e `editarEtapa` deixam de devolver `void`
- [x] Ciclo sem Etapas depois da remoção mantém a Volta aberta
- [x] Gate passes: `npx vitest run`
- [x] 10 testes novos em `tests/voltas.test.ts` passam (total 19), sem testes removidos

**Tests**: integration
**Gate**: full

**Commit**: `feat(voltas): fecha a volta ao mudar carga, adicionar ou remover etapa`

---

### T4: Ações de reiniciar e aviso de Volta concluída

**What**: `reiniciar(cicloId, numero)` como server action; `EstadoCiclo` ganha `aviso`, preenchido com `avisoDaVoltaConcluida` por `novaEtapa`, `salvarEtapa` e `excluirEtapa`.
**Where**: `src/app/acoes-ciclos.ts`
**Depends on**: T3
**Reuses**: `executar`, `EstadoCiclo`, `revalidatePath`
**Requirement**: VOLTA-09, VOLTA-13, VOLTA-14, VOLTA-19

**Done when**:

- [ ] `reiniciar` devolve `{ erro }` com a mensagem de `ValidacaoError` e "Não encontramos este item. Atualize a página." para `NaoEncontradoError`
- [ ] `novaEtapa`, `salvarEtapa` e `excluirEtapa` devolvem `aviso` quando a Volta fechou
- [ ] Gate passes: `npm run typecheck; npm run build; npx vitest run`

**Tests**: none
**Gate**: build

**Commit**: `feat(voltas): ações de reiniciar volta e aviso de volta concluída`

---

### T5: Botão e diálogo "Reiniciar volta"

**What**: Botão secundário com ícone que abre o `AlertDialog` "Reiniciar volta?" com o texto e os botões da spec, chama `reiniciar` e mostra o erro, se houver.
**Where**: `src/app/reiniciar-volta.tsx`
**Depends on**: T4
**Reuses**: `AlertDialog` de `components/base/modal/modal.tsx`, `Button`, `Aviso`
**Requirement**: VOLTA-08, VOLTA-10, VOLTA-13, VOLTA-15

**Done when**:

- [ ] O diálogo traz título, texto e botões "Cancelar" e "Reiniciar volta" da spec; cancelar não chama a ação
- [ ] Gate passes: `npm run typecheck; npm run build; npx vitest run`

**Tests**: none
**Gate**: build

**Commit**: `feat(voltas): botão e confirmação de reiniciar volta`

---

### T6: Tabela do histórico de Voltas

**What**: Tabela "Volta", "Início", "Fim", "Duração" com as linhas de `listarVoltas`, "Em andamento" na aberta, dentro de um cartão que rola na horizontal abaixo de 1024px.
**Where**: `src/app/tabela-de-voltas.tsx`
**Depends on**: T5
**Reuses**: `Table` de `components/base/table`, `dataDaVolta`, `duracaoDaVolta`
**Requirement**: VOLTA-02, VOLTA-03, VOLTA-04

**Done when**:

- [ ] A tabela mostra uma linha por Volta, na ordem recebida, com os textos da spec
- [ ] Usa tokens semânticos do BoardUI e textos em pt-BR
- [ ] Gate passes: `npm run typecheck; npm run build; npx vitest run`

**Tests**: none
**Gate**: build

**Commit**: `feat(voltas): tabela do histórico de voltas`

---

### T7: Aviso ao editar ou remover Etapa

**What**: A lista de Etapas mostra o `Aviso` quando salvar ou excluir uma Etapa devolve `aviso`.
**Where**: `src/app/lista-etapas.tsx`
**Depends on**: T6
**Reuses**: `Aviso` de `aviso.tsx`
**Requirement**: VOLTA-19

**Done when**:

- [ ] Salvar ou excluir uma Etapa que fecha a Volta mostra "Volta N concluída. A Volta N+1 começou."
- [ ] Gate passes: `npm run typecheck; npm run build; npx vitest run`

**Tests**: none
**Gate**: build

**Commit**: `feat(voltas): aviso de volta concluída ao editar ou remover etapa`

---

### T8: Aviso ao adicionar Etapa

**What**: "Adicionar etapa" mostra o `Aviso` quando a Etapa nova fecha a Volta.
**Where**: `src/app/dialogos-do-ciclo.tsx`
**Depends on**: T7
**Reuses**: `Aviso`, `FormularioNome`
**Requirement**: VOLTA-19

**Done when**:

- [ ] O aviso sobrevive ao fechamento do modal e some sozinho
- [ ] Gate passes: `npm run typecheck; npm run build; npx vitest run`

**Tests**: none
**Gate**: build

**Commit**: `feat(voltas): aviso de volta concluída ao adicionar etapa`

---

### T9: Instalar o componente Tabs do BoardUI

**What**: Instala `tabs` pelo BoardUI (MCP `install_components` ou `npx boardui@latest add tabs`).
**Where**: `src/components/base/tabs/tabs.tsx`
**Depends on**: T8
**Reuses**: BoardUI MCP
**Requirement**: VOLTA-01

**Done when**:

- [ ] O componente existe sob `src/components/base/tabs/` e compila
- [ ] Gate passes: `npm run typecheck; npm run build; npx vitest run`

**Tests**: none
**Gate**: build

**Commit**: `chore(ui): instala o componente Tabs do BoardUI`

---

### T10: Abas e histórico na tela do Ciclo

**What**: A tela do Ciclo ganha as abas "Etapas" e "Voltas" e o botão "Reiniciar volta" ao lado de "Adicionar etapa", como em `captures/ciclo.png`; "Etapas" guarda o cartão da Volta, a tabela de Etapas e o cartão "Matérias"; "Voltas" guarda a tabela.
**Where**: `src/app/(app)/ciclos/[id]/page.tsx`
**Depends on**: T9
**Reuses**: `Tabs`, `ReiniciarVolta`, `TabelaDeVoltas`, `listarVoltas`
**Requirement**: VOLTA-01, VOLTA-02, VOLTA-15

**Done when**:

- [ ] A tela de `.specs/features/gestao-de-voltas/captures/ciclo.png` está montada, só com as abas "Etapas" e "Voltas" e sem "Arquivar" nem "Faixas de acerto" (AD-001)
- [ ] Após reiniciar, a tela continua na aba em que estava e mostra a Volta N+1
- [ ] Gate passes: `npm run typecheck; npm run build; npx vitest run`

**Tests**: none
**Gate**: build

**Commit**: `feat(voltas): abas Etapas e Voltas e botão de reiniciar na tela do ciclo`

---

## Checks

**C1** - A tela do Ciclo mostra as abas "Etapas" (selecionada) e "Voltas" e o botão "Reiniciar volta" ao lado de "Adicionar etapa", como em `captures/ciclo.png` (VOLTA-01, AC 1)
Proof: browser captures/ciclo.running.png

**C2** - O histórico lista as Voltas da maior para a menor, com a aberta primeiro (VOLTA-02, AC 2; VOLTA-04, AC 4)
Proof: run unit | ✓ tests/voltas.test.ts > Voltas > lista a Volta aberta primeiro e as fechadas da mais recente à mais antiga
Proof: walk - abrir a aba "Voltas" e ver as colunas Volta, Início, Fim e Duração na ordem

**C3** - Datas em `dd/mm/aaaa` e duração "Mesmo dia", "1 dia" e "N dias" (VOLTA-03, AC 3)
Proof: run unit | ✓ tests/formato.test.ts > Histórico de Voltas > datas em dd/mm/aaaa e duração em dias de calendário

**C4** - A Volta aberta mostra Fim "Em andamento" e duração até hoje (VOLTA-04, AC 4)
Proof: walk - abrir a aba "Voltas" e ver "Em andamento" na primeira linha

**C5** - A Volta 1 começa na data de criação do Ciclo (VOLTA-05, AC 5)
Proof: run unit | ✓ tests/voltas.test.ts > Voltas > a Volta 1 começa na criação do Ciclo

**C6** - Um Ciclo sem Volta fechada lista só a Volta 1 em andamento (VOLTA-06, AC 6)
Proof: run unit | ✓ tests/voltas.test.ts > Voltas > um Ciclo sem Volta fechada lista só a Volta 1 aberta

**C7** - Listar as Voltas de Ciclo de outro Usuário responde "não encontrado" (VOLTA-07, AC 7)
Proof: run unit | ✓ tests/voltas.test.ts > Voltas > listar as Voltas de outro Usuário responde não encontrado

**C8** - "Reiniciar volta" abre o diálogo com o título "Reiniciar volta?", o texto da spec e os botões "Cancelar" e "Reiniciar volta", sem alterar nada (VOLTA-08, AC 1)
Proof: walk - usar "Reiniciar volta" e ler o diálogo; abrir a aba "Voltas" e ver que nada mudou

**C9** - Confirmar fecha a Volta N e abre a N+1 com o mesmo instante, e a tela mostra a Volta N+1 com 0% (VOLTA-09, AC 2)
Proof: run unit | ✓ tests/voltas.test.ts > Voltas > reiniciar fecha a Volta aberta e abre a seguinte no mesmo instante
Proof: walk - confirmar o diálogo e ver "Volta 2" com 0%

**C10** - Cancelar o diálogo mantém a Volta aberta como estava (VOLTA-10, AC 3)
Proof: walk - cancelar o diálogo e ver "Volta 1" e o progresso iguais

**C11** - Reiniciar é permitido sem Registro de estudo na Volta aberta (VOLTA-11, AC 4)
Proof: run unit | ✓ tests/voltas.test.ts > Voltas > reiniciar sem Registro de estudo é permitido

**C12** - Os Registros até o reinício ficam na Volta fechada e o progresso da nova Volta começa em zero (VOLTA-12, AC 5)
Proof: run unit | ✓ tests/voltas.test.ts > Voltas > reiniciar mantém os Registros na Volta fechada e zera o progresso

**C13** - Reiniciar com o número de uma Volta que já não é a aberta é recusado com "Esta volta já foi reiniciada. Atualize a página." (VOLTA-13, AC 6)
Proof: run unit | ✓ tests/voltas.test.ts > Voltas > reiniciar com o número de uma Volta que já não é a aberta é recusado

**C14** - Reiniciar Ciclo de outro Usuário é recusado e não altera as Voltas dele (VOLTA-14, AC 7)
Proof: run unit | ✓ tests/voltas.test.ts > Voltas > reiniciar o Ciclo de outro Usuário responde não encontrado

**C15** - Depois de reiniciar, a tela fica na aba em que estava e o histórico mostra a Volta N fechada com fim hoje (VOLTA-15, AC 8)
Proof: walk - reiniciar estando na aba "Voltas" e ver a Volta 1 com fim hoje e a Volta 2 em andamento

**C16** - Baixar a carga de uma Etapa recalcula o progresso da Volta aberta (VOLTA-16, AC 1)
Proof: run unit | ✓ tests/voltas.test.ts > Voltas e carga horária > mudar a carga recalcula o progresso da Volta aberta

**C17** - Adicionar, editar ou remover uma Etapa que deixa todas em 100% fecha a Volta e abre a seguinte (VOLTA-17, AC 2)
Proof: run unit | ✓ tests/voltas.test.ts > Voltas e carga horária > editar a carga até completar todas as Etapas fecha a Volta
Proof: run unit | ✓ tests/voltas.test.ts > Voltas e carga horária > remover a Etapa que falta fecha a Volta
Proof: run unit | ✓ tests/voltas.test.ts > Voltas e carga horária > adicionar uma Etapa já cumprida pelas horas extras fecha a Volta

**C18** - Uma mudança que deixa alguma Etapa abaixo de 100% mantém a Volta aberta (VOLTA-18, AC 3)
Proof: run unit | ✓ tests/voltas.test.ts > Voltas e carga horária > mudança que deixa uma Etapa abaixo de 100% mantém a Volta aberta

**C19** - Quando a mudança fecha a Volta N, o caso de uso devolve N e a tela mostra "Volta N concluída. A Volta N+1 começou." (VOLTA-19, AC 4)
Proof: run unit | ✓ tests/voltas.test.ts > Voltas e carga horária > editar a Etapa devolve o número da Volta fechada
Proof: run unit | ✓ tests/formato.test.ts > Histórico de Voltas > aviso de Volta concluída
Proof: walk - baixar a carga da última Etapa incompleta e ver o aviso no topo

**C20** - Remover a última Etapa do Ciclo mantém a Volta aberta (VOLTA-20, AC 5)
Proof: run unit | ✓ tests/voltas.test.ts > Voltas e carga horária > remover a última Etapa mantém a Volta aberta

**C21** - Mudar carga ou Etapas nunca reabre nem altera uma Volta fechada (VOLTA-21, AC 6)
Proof: run unit | ✓ tests/voltas.test.ts > Voltas e carga horária > mudar a carga não reabre nem altera a Volta fechada

**C22** - Reordenar as Etapas mantém as Voltas como estão (VOLTA-22, AC 7)
Proof: run unit | ✓ tests/voltas.test.ts > Voltas e carga horária > reordenar as Etapas não muda as Voltas

**C23** - Um Registro e uma mudança de Etapa simultâneos que fecham a Volta a fecham uma única vez (VOLTA-23, AC 8)
Proof: run unit | ✓ tests/voltas.test.ts > Voltas e carga horária > registro e mudança de Etapa simultâneos fecham a Volta uma vez

---

## Handoff

**Settled mid-build:** none
**Dispatched:** none
**Walked:** none

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3

Phase 1:  T1 → T2 → T3
Phase 2:  T3 → T4 → T5 → T6
Phase 3:  T6 → T7 → T8 → T9 → T10
```
