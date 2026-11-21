# Copiar matéria de outro ciclo Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, the walk, check_proofs, the Verifier and the screens sub-agent).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: inline (below, "Design inline"); sem `design.md`: escopo médio, nenhuma decisão de arquitetura nova
**Status**: In Progress
**Approved**: 2026-11-21 - user: "Pode implementar"
**Build**: `npm run typecheck; npm run build`
**Run unit**: `npx vitest run tests/copiar-materia.test.ts --reporter=verbose`

## Design inline

- Sem mudança de schema. `src/casos-de-uso/copiar-materia.ts`:
  - `copiarMateria(db, usuario, cicloId, { origemId, nome, cargaMinutos })`: valida nome e carga como `adicionarEtapa`; numa transação trava o Ciclo de destino (`travarCiclo`, que já recusa arquivado), carrega a origem do Usuário (`NaoEncontradoError` se não existe ou é de outro; `ValidacaoError` se é do próprio destino), recusa nome repetido no destino (sem diferenciar maiúsculas), insere Matéria, Etapa no fim e os Tópicos (mesma ordem e nomes, `estudado=false`), e devolve `{ id, materiaId, voltaFechada }` como `adicionarEtapa`.
  - `listarMateriasCopiaveis(db, usuario, cicloId)`: Matérias dos outros Ciclos do Usuário, ativos e arquivados, como `{ id, nome, cicloNome, arquivado, cargaMinutos }` (carga = soma das Etapas, 0 sem Etapas), Ciclo mais recente primeiro e Matérias em ordem alfabética.
- `novaEtapa` (server action) lê `origemId` do formulário: com ele chama `copiarMateria`, sem ele segue `adicionarEtapa`.
- `AdicionarEtapa` ganha a prop `copiaveis`; com a lista não vazia, mostra o `Select` "Copiar de outro ciclo" (primeira opção "Nova matéria") acima dos campos; escolher uma origem preenche Nome e Carga (controlados). A página do Ciclo e `ListaEtapas` passam a lista.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines and spec. Guidelines found: `AGENTS.md` (UI follows `docs/design-system.md`, BoardUI tokens, `/frontend-design`), `vitest.config.ts` (tests in `tests/`, real Postgres), `docs/agents/*`. Existing `tests/*.test.ts` are the floor.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Casos de uso (`src/casos-de-uso/*.ts`) | integration (Postgres real) | 1:1 to spec ACs, failure paths, other-user isolation | `tests/*.test.ts` | `npx vitest run tests/copiar-materia.test.ts` |
| Server actions e telas (`src/app/**`) | none | Provadas pela visita (walk) | - | build gate |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with one test file | `npx vitest run tests/copiar-materia.test.ts` |
| Full | After tasks that touch existing use cases | `npx vitest run` |
| Build | After tasks with no test layer | `npm run typecheck; npm run build; npx vitest run` |

---

## Execution Plan

### Phase 1: Domínio

```
T1 → T2
```

### Phase 2: Interface

```
T2 → T3
```

---

## Task Breakdown

### T1: Copiar a Matéria

**What**: `copiarMateria`, exportada em `src/casos-de-uso/index.ts`, com todos os critérios de criação e de recusa.
**Where**: `src/casos-de-uso/copiar-materia.ts`
**Depends on**: None
**Reuses**: `travarCiclo`, `nomeValido`/`cargaValida` (exportá-las de `ciclos.ts`), `avaliarFechamentoDaVolta`, `ValidacaoError`, `NaoEncontradoError`
**Requirement**: COPIA-02, COPIA-03, COPIA-04

**Done when**:

- [x] Testes em `tests/copiar-materia.test.ts` cobrem cada recusa e cada resultado dos critérios 4-7 e das recusas 1-6, mais os 3 casos de borda
- [x] Gate check passes: `npx vitest run tests/copiar-materia.test.ts`
- [x] Gate check passes: `npx vitest run`

**Tests**: integration
**Gate**: full
**Commit**: `feat(copiar-materia): copiar matéria de outro ciclo`

---

### T2: Listar as Matérias copiáveis

**What**: `listarMateriasCopiaveis`, exportada em `src/casos-de-uso/index.ts`.
**Where**: `src/casos-de-uso/copiar-materia.ts`
**Depends on**: T1
**Reuses**: `progressoDosCiclos` não; soma direta de `etapa.cargaMinutos` por Matéria
**Requirement**: COPIA-01

**Done when**:

- [x] Testes cobrem outros Ciclos ativos e arquivados, exclusão do próprio Ciclo e de outro Usuário, carga somada e 0 sem Etapas, e a ordem
- [x] Gate check passes: `npx vitest run tests/copiar-materia.test.ts`

**Tests**: integration
**Gate**: quick
**Commit**: `feat(copiar-materia): listar matérias copiáveis`

---

### T3: Seletor "Copiar de outro ciclo" no modal

**What**: `novaEtapa` lê `origemId`; `AdicionarEtapa` mostra o seletor e preenche Nome e Carga; a página do Ciclo e `ListaEtapas` passam `copiaveis`.
**Where**: `src/app/dialogos-do-ciclo.tsx`
**Depends on**: T2
**Reuses**: `Select`/`SelectItem` de `@/components/base/select/select`, `FormularioNome`, `acoes-ciclos.ts`, padrão de `formulario-de-registro.tsx`
**Requirement**: COPIA-01, COPIA-02

**Done when**:

- [x] `src/app/acoes-ciclos.ts`, `src/app/formulario-ciclo.tsx`, `src/app/lista-etapas.tsx` e `src/app/(app)/ciclos/[id]/page.tsx` ajustados; textos em pt-BR, tokens BoardUI, `/frontend-design` aplicada
- [x] Gate check passes: `npm run typecheck; npm run build; npx vitest run`

**Tests**: none
**Gate**: build
**Commit**: `feat(copiar-materia): seletor Copiar de outro ciclo no modal Adicionar etapa`

---

## Checks

**C1** - Com outro Ciclo com Matérias, o modal "Adicionar etapa" mostra o seletor "Copiar de outro ciclo" com cada Matéria rotulada "<Matéria> · <Ciclo>", e "(arquivado)" nos arquivados (COPIA-01, AC 1)
Proof: walk - no Concurso B, o modal lista "Português · Concurso A" e "Direito · Concurso C (arquivado)"

**C2** - `listarMateriasCopiaveis` devolve as Matérias de outros Ciclos ativos e arquivados, e nenhuma do próprio Ciclo nem de outro Usuário (COPIA-01, AC 1)
Proof: run unit | ✓ tests/copiar-materia.test.ts > listarMateriasCopiaveis > lista as Matérias de outros Ciclos, ativos e arquivados

**C3** - Escolher a origem preenche "Nome da matéria" e "Carga horária (h)" com a soma das Etapas dela, editáveis (COPIA-01, AC 2)
Proof: walk - escolher "Português · Concurso A" (2 Etapas, 3 h) preenche "Português" e "3", e os campos aceitam edição

**C4** - A carga da origem é a soma das Etapas dela, e 0 sem Etapas, que deixa o campo vazio (COPIA-01, AC 2, 3)
Proof: run unit | ✓ tests/copiar-materia.test.ts > listarMateriasCopiaveis > a carga é a soma das Etapas e 0 sem Etapas

**C5** - Uma origem sem Etapas deixa "Carga horária (h)" vazio no modal (COPIA-01, AC 3)
Proof: walk - escolher uma Matéria sem Etapas deixa a carga vazia

**C6** - Copiar cria a Matéria com o nome do campo, uma Etapa no fim com a carga do campo e os Tópicos na mesma ordem (COPIA-02, AC 4)
Proof: run unit | ✓ tests/copiar-materia.test.ts > copiarMateria > cria a Matéria, a Etapa no fim e os Tópicos na ordem

**C7** - Os Tópicos copiados vêm não estudados, sem Registros e sem Cartão de revisão (COPIA-02, AC 5)
Proof: run unit | ✓ tests/copiar-materia.test.ts > copiarMateria > os Tópicos copiados vêm não estudados, sem Registros nem Cartão

**C8** - Copiar não altera a Matéria de origem, as Etapas, os Tópicos, o estado de estudado, os Registros nem os Cartões (COPIA-03, AC 6)
Proof: run unit | ✓ tests/copiar-materia.test.ts > copiarMateria > a origem fica inalterada

**C9** - Alterar a cópia (Tópico, Etapa, Registro) não altera a origem (COPIA-03, AC 7)
Proof: run unit | ✓ tests/copiar-materia.test.ts > copiarMateria > alterar a cópia não altera a origem

**C10** - "Nova matéria" mantém os campos e não copia nada (COPIA-01, AC 8)
Proof: walk - escolher "Nova matéria" depois de uma origem mantém os campos e, ao enviar, cria só a Etapa

**C11** - Sem outros Ciclos com Matérias, o modal abre sem o seletor (COPIA-01, AC 9)
Proof: walk - no único Ciclo do Usuário, "Adicionar etapa" não mostra "Copiar de outro ciclo"

**C12** - Sem origem escolhida, a Etapa é criada como hoje, reaproveitando a Matéria de mesmo nome (COPIA-01, AC 10)
Proof: walk - enviar "Adicionar etapa" sem origem cria a Etapa e reaproveita a Matéria de mesmo nome

**C13** - Nome repetido no destino, sem diferenciar maiúsculas, é recusado com "Este ciclo já tem a matéria “<nome>”." sem criar nada (COPIA-04, AC 1)
Proof: run unit | ✓ tests/copiar-materia.test.ts > recusas > recusa nome repetido no destino

**C14** - Carga fora de 0-10.000 horas é recusada sem criar nada (COPIA-04, AC 2)
Proof: run unit | ✓ tests/copiar-materia.test.ts > recusas > recusa carga inválida

**C15** - Nome vazio é recusado com "Informe o nome da matéria." sem criar nada (COPIA-04, AC 3)
Proof: run unit | ✓ tests/copiar-materia.test.ts > recusas > recusa nome vazio

**C16** - Origem inexistente, de outro Usuário ou do próprio destino é recusada sem criar nada (COPIA-04, AC 4)
Proof: run unit | ✓ tests/copiar-materia.test.ts > recusas > recusa origem inexistente, de outro Usuário ou do próprio Ciclo

**C17** - Destino arquivado é recusado com "Ciclo arquivado. Reative para alterar." sem criar nada (COPIA-04, AC 5)
Proof: run unit | ✓ tests/copiar-materia.test.ts > recusas > recusa destino arquivado

**C18** - Se uma gravação da cópia falha, nada fica: sem Matéria, Etapa nem Tópico novos (COPIA-04, AC 6)
Proof: run unit | ✓ tests/copiar-materia.test.ts > recusas > uma falha no meio desfaz tudo

**C19** - Origem sem Tópicos gera cópia sem Tópicos (spec, caso de borda)
Proof: run unit | ✓ tests/copiar-materia.test.ts > bordas > origem sem Tópicos gera cópia sem Tópicos

**C20** - Enviar a mesma cópia duas vezes cria a primeira e recusa a segunda por nome repetido (spec, caso de borda)
Proof: run unit | ✓ tests/copiar-materia.test.ts > bordas > a mesma cópia duas vezes recusa a segunda

---

## Handoff

**Settled mid-build:** none
**Dispatched:** Verifier (round 1) sobre o diff `8029107..HEAD` (HEAD do commit "docs(copiar-materia): proofs.md da execução") - sent; sem captura citada, sem screens sub-agent
**Walked:** App em `http://localhost:3100` (`next dev`, banco dev `postgres://postgres:dev@localhost:54330/dev`, migrações aplicadas), janela de 1440x960, tema Claro suave, cliques reais num Chromium sem cabeça (Playwright). Sessão criada por `POST /api/auth/sign-up/email` (usuários `copia@exemplo.com` e `solo@exemplo.com`, senha `senha-de-teste-123`); dados semeados por SQL: Ciclos "Concurso A" (`/ciclos/cic-a`, Português com 2 Etapas de 1h e 2h e 4 Tópicos, "Crase" estudado), "Concurso C" arquivado (Direito com 1 Etapa; Raciocínio sem Etapas) e "Concurso B" (`/ciclos/cic-b`, destino, com a Etapa Informática de 1h); `solo` tem o Ciclo único `/ciclos/cic-solo`.
- Copiar (COPIA-01/02): em "Concurso B", "Adicionar etapa" mostra "Copiar de outro ciclo" com "Nova matéria", "Português · Concurso A", "Direito · Concurso C (arquivado)" e "Raciocínio · Concurso C (arquivado)". Escolher "Português · Concurso A" preenche Nome "Português" e Carga "3". Editar para "Língua Portuguesa" e "2,5" e escolher "Nova matéria" mantém os dois valores. Escolher "Raciocínio" (sem Etapas) deixa a carga vazia. Escolher de novo "Português" e enviar fecha o modal e a tela mostra a Etapa 2 "Português" (3h, 0/4 Tópicos); no banco: Etapa na posição 1 com 180 min e 4 Tópicos não estudados.
- Recusa (COPIA-04): copiar "Português" de novo mostra sob os campos "Este ciclo já tem a matéria “Português”." e o modal segue aberto; "Cancelar" fecha.
- Sem origem: enviar "informática" com 2 h cria a 2ª Etapa da Matéria Informática (1 Matéria, 2 Etapas).
- `solo` (um só Ciclo): "Adicionar etapa" abre sem o seletor.

---

## Phase Execution Map

```
Phase 1 → Phase 2

Phase 1:  T1 ------→ T2
Phase 2:  T2 ------→ T3
```
