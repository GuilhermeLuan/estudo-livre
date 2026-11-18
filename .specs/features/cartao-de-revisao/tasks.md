# Cartão de revisão Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, the walk, check_proofs, the Verifier and the screens sub-agent).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/cartao-de-revisao/design.md`
**Status**: Approved
**Approved**: 2026-11-18 - user: "aprovado"
**Build**: `npm run typecheck; npm run build`
**Run unit**: `npx vitest run --reporter=verbose`

---

## Test Coverage Matrix

> Generated from codebase, project guidelines and spec. Guidelines found: `AGENTS.md` (UI follows `docs/design-system.md`, BoardUI tokens, `/frontend-design`), `vitest.config.ts` (tests in `tests/`, real Postgres via Docker), `docs/agents/*`. Existing tests under `tests/*.test.ts` are the floor.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Domínio puro (`src/revisao.ts`, `src/dominio.ts`, `src/app/formato.ts`) | unit | All branches; 1:1 to spec ACs; every edge case | `tests/*.test.ts` | `npx vitest run tests/<arquivo>.test.ts` |
| Casos de uso (`src/casos-de-uso/*.ts`) | integration (Postgres real) | 1:1 to spec ACs, failure paths, other-user isolation | `tests/*.test.ts` | `npx vitest run tests/<arquivo>.test.ts` |
| Migração e scripts (`scripts/*.mjs`, `drizzle/*.sql`) | integration | Banco no formato antigo com dados, migra, confere o resultado | `tests/migracao-*.test.ts` | `npx vitest run tests/migracao-cartoes.test.ts` |
| Server actions e telas (`src/app/**`) | none | Provadas pelas capturas e pela visita (walk) | - | build gate |
| Schema | none | - (build gate) | - | build gate |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | `npx vitest run tests/revisao.test.ts tests/formato.test.ts` |
| Full | After tasks with integration tests | `npx vitest run` |
| Build | After phase completion or tasks with no test layer | `npm run typecheck; npm run build; npx vitest run` |

---

## Execution Plan

### Phase 1: Domínio e dados

```
T1 → T2 → T3 → T4
```

### Phase 2: Casos de uso

```
T4 → T5 → T6 → T7 → T8 → T9 → T10
```

### Phase 3: Interface

```
T10 → T11 → T12 → T13 → T14 → T15 → T16 → T17 → T18
```

---

## Task Breakdown

### T1: Regras puras da revisão

**What**: Instalar `ts-fsrs` e criar `src/revisao.ts`: notas, Faixas padrão e Mínimo padrão, `notaPelasFaixas`, `textoDaFaixa`, `sugerirNota`, `fraseDaNota`, `validarFaixas` e `recalcularCartao` (reaplica notas em ordem com os parâmetros do design).
**Where**: `src/revisao.ts`
**Depends on**: None
**Reuses**: `percentualDeAcerto` de `src/dominio.ts`
**Requirement**: REV-02, REV-03, REV-04, REV-06, REV-09, REV-12

**Done when**:

- [x] `ts-fsrs` em `package.json`; `src/revisao.ts` só importa `ts-fsrs`
- [x] Conversão: 59% Errei, 60% Difícil, 74% Difícil, 75% Bom, 89% Bom, 90% Fácil
- [x] `recalcularCartao` sem notas dá Cartão sem data; com notas devolve Cartão e log em ordem
- [x] Gate check passes: `npx vitest run tests/revisao.test.ts`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(revisao): regras puras de nota e cartão FSRS`

---

### T2: Schema e migração 0006

**What**: Adicionar ao schema as Faixas e o Mínimo no `ciclo`, `nota` no `registro_de_estudo` e as tabelas `cartao_de_revisao` e `log_de_revisao`; gerar `0006` e acrescentar nela o `UPDATE` que dá a nota padrão aos Registros antigos com Tópico e questões ≥ 5.
**Where**: `src/db/schema.ts`
**Depends on**: T1
**Reuses**: padrão das tabelas `topico` e `registro_de_estudo`
**Requirement**: REV-08, REV-11

**Done when**:

- [x] `npm run db:generate` produz `drizzle/0006_*.sql` com o `UPDATE` de notas
- [x] Os Ciclos ganham 60/75/90 e Mínimo 5 por `DEFAULT`
- [x] Gate check passes: `npm run typecheck; npx vitest run`

**Tests**: none
**Gate**: build
**Commit**: `feat(db): faixas do ciclo, nota do registro e cartão de revisão`

---

### T3: Reconstrução dos Cartões dos Registros antigos

**What**: Criar `scripts/cartoes.mjs` com `reconstruirCartoes(pool)`: para cada Tópico com Registros e sem Cartão, cria o Cartão e o log reaplicando os Registros com `src/revisao.ts`; idempotente.
**Where**: `scripts/cartoes.mjs`
**Depends on**: T2
**Reuses**: `src/revisao.ts`; padrão de `tests/migracao-etapas.test.ts`
**Requirement**: REV-08

**Done when**:

- [x] Banco no formato da migração 0005 com Registros (com e sem questões) migra e ganha Cartões e notas
- [x] Rodar de novo não muda nada
- [x] Gate check passes: `npx vitest run tests/migracao-cartoes.test.ts`

**Tests**: integration
**Gate**: full
**Commit**: `feat(migracao): cria os cartões dos registros que já existem`

---

### T4: Migração chama a reconstrução

**What**: `scripts/migrar.mjs` chama `reconstruirCartoes` depois do `migrate`; o `Dockerfile` copia `src/revisao.ts` para a imagem.
**Where**: `scripts/migrar.mjs`
**Depends on**: T3
**Reuses**: `scripts/cartoes.mjs`
**Requirement**: REV-08

**Done when**:

- [x] `node scripts/migrar.mjs` contra um banco com dados antigos cria os Cartões
- [x] `Dockerfile` tem o `COPY` de `src/revisao.ts`
- [x] Gate check passes: `npm run typecheck; npx vitest run`

**Tests**: none
**Gate**: build
**Commit**: `feat(migracao): roda a reconstrução dos cartões ao migrar`

---

### T5: Recálculo do Cartão de um Tópico

**What**: Criar `src/casos-de-uso/revisao.ts` com `recalcularTopico(tx, topicoId)` (apaga e refaz Cartão e log dos Registros com nota, em ordem; Cartão vazio se há Registros e nenhuma nota; nenhum se não há Registros) e `obterCartao(db, usuario, topicoId)`.
**Where**: `src/casos-de-uso/revisao.ts`
**Depends on**: T4
**Reuses**: `src/revisao.ts`, `Tx` de `src/db`
**Requirement**: REV-01, REV-05, REV-06, REV-07

**Done when**:

- [x] Registros inseridos direto no banco geram o Cartão esperado, em ordem cronológica e desempate por `criadoEm` e `id`
- [x] Sem Registros, nenhum Cartão e nenhum log
- [x] Gate check passes: `npx vitest run tests/cartoes.test.ts`

**Tests**: integration
**Gate**: full
**Commit**: `feat(revisao): recálculo do cartão do tópico`

---

### T6: Registrar estudo gera nota e Cartão

**What**: `registrarEstudo` aceita `nota` em `DadosDoEstudo`, resolve-a pelas Faixas do Ciclo (sugerida, escolhida, obrigatória abaixo do Mínimo, descartada sem Tópico ou sem questões), grava no Registro e chama `recalcularTopico`.
**Where**: `src/casos-de-uso/estudo.ts`
**Depends on**: T5
**Reuses**: `recalcularTopico`, `notaPelasFaixas`
**Requirement**: REV-01, REV-03, REV-04, REV-05, REV-06

**Done when**:

- [x] Cada critério REV-01 a REV-06 e a nota inválida têm teste pela fronteira
- [x] Testes existentes que registram Tópico com 1–4 questões enviam `nota`
- [x] Gate check passes: `npx vitest run`

**Tests**: integration
**Gate**: full
**Commit**: `feat(revisao): registrar estudo gera nota e cartão`

---

### T7: Editar e excluir Registro recalculam

**What**: `editarRegistro` (com `nota`, trocando Matéria, Tópico, data, questões) e `excluirRegistro` recalculam o Cartão de cada Tópico afetado; `listarRegistros` devolve a `nota`.
**Where**: `src/casos-de-uso/registros.ts`
**Depends on**: T6
**Reuses**: `recalcularTopico`, a resolução de nota de T6
**Requirement**: REV-07, REV-09

**Done when**:

- [x] Editar, excluir, lançar retroativo, trocar Matéria ou Tópico e deixar de ter questões dão o Cartão do recálculo do zero
- [x] Excluir o último Registro remove Cartão e log
- [x] Cartões de outro Usuário não mudam
- [x] Gate check passes: `npx vitest run`

**Tests**: integration
**Gate**: full
**Commit**: `feat(revisao): editar e excluir registro recalculam o cartão`

---

### T8: Tópico mostra a próxima revisão

**What**: `obterMateria` devolve `proximaRevisao` (dia AAAA-MM-DD de Brasília ou nulo) em cada Tópico.
**Where**: `src/casos-de-uso/topicos.ts`
**Depends on**: T7
**Reuses**: `hojeEmBrasilia`
**Requirement**: REV-13

**Done when**:

- [x] Tópico com Cartão com data traz o dia; sem Cartão ou com Cartão vazio traz nulo
- [x] Excluir o Tópico remove Cartão e log e mantém os Registros
- [x] Gate check passes: `npx vitest run`

**Tests**: integration
**Gate**: full
**Commit**: `feat(topicos): mostra a próxima revisão de cada tópico`

---

### T9: Faixas de acerto do Ciclo

**What**: Criar `src/casos-de-uso/faixas.ts` com `obterFaixas(db, usuario, cicloId)`, `salvarFaixas(db, usuario, cicloId, dados)` (valida com `validarFaixas`) e `listarFaixasDosCiclos(db, usuario)`; exportar em `index.ts`.
**Where**: `src/casos-de-uso/faixas.ts`
**Depends on**: T8
**Reuses**: `validarFaixas`, padrão de `renomearCiclo`
**Requirement**: REV-11, REV-12

**Done when**:

- [x] Ciclo novo vem com 60/75/90 e Mínimo 5; salvar válido grava; inválido recusa e mantém
- [x] Notas já gravadas não mudam; Ciclo de outro Usuário dá `NaoEncontradoError`
- [x] Gate check passes: `npx vitest run`

**Tests**: integration
**Gate**: full
**Commit**: `feat(ciclos): faixas de acerto e mínimo de questões`

---

### T10: Estimativa da próxima revisão

**What**: `estimarProximaRevisao(db, usuario, rascunho)` em `src/casos-de-uso/revisao.ts`: a conta do recálculo com o Registro do rascunho (novo ou `registroId` em edição), sem gravar, devolvendo o dia ou nulo.
**Where**: `src/casos-de-uso/revisao.ts`
**Depends on**: T9
**Reuses**: `recalcularCartao`, resolução de nota
**Requirement**: REV-10

**Done when**:

- [x] A data estimada é igual à do Tópico depois de salvar o mesmo Registro
- [x] Sem Tópico, ou Cartão sem data, devolve nulo; nada é gravado
- [x] Gate check passes: `npx vitest run`

**Tests**: integration
**Gate**: full
**Commit**: `feat(revisao): estimativa da próxima revisão`

---

### T11: Texto da próxima revisão

**What**: `textoDaProximaRevisao(dia)` em `src/app/formato.ts`: "Próxima revisão: dd/mm/aaaa" ou "Sem revisão agendada".
**Where**: `src/app/formato.ts`
**Depends on**: T10
**Reuses**: formatadores de data de `formato.ts`
**Requirement**: REV-13

**Done when**:

- [x] Data vira "Próxima revisão: 30/11/2026"; nulo vira "Sem revisão agendada"
- [x] Gate check passes: `npx vitest run tests/formato.test.ts`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(formato): texto da próxima revisão`

---

### T12: Campo da nota no formulário

**What**: `lerFormularioDeRegistro` lê o campo `nota` e o entrega em `estudo.nota` (vazio vira ausente).
**Where**: `src/app/campos-do-registro.ts`
**Depends on**: T11
**Reuses**: `texto`, `inteiroOpcional`
**Requirement**: REV-09

**Done when**:

- [x] `nota` preenchido chega ao caso de uso; vazio chega ausente
- [x] Gate check passes: `npx vitest run tests/formato.test.ts`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(registro): o formulário envia a nota da revisão`

---

### T13: Ações de revisão

**What**: Criar `src/app/acoes-revisao.ts` com as server actions `estimarRevisao` e `salvarFaixasDoCiclo`, com `revalidatePath` da tela do Ciclo.
**Where**: `src/app/acoes-revisao.ts`
**Depends on**: T12
**Reuses**: padrão de `src/app/acoes-registros.ts`
**Requirement**: REV-10, REV-12

**Done when**:

- [x] Ações finas, só traduzem `FormData` e erros do caso de uso
- [x] Gate check passes: `npm run typecheck`

**Tests**: none
**Gate**: build
**Commit**: `feat(revisao): ações de estimativa e de faixas`

---

### T14: O modal recebe as Faixas

**What**: `src/app/(app)/layout.tsx` entrega `faixas` e Mínimo de cada Matéria ao modal (tipo `MateriaParaRegistro`) e `RegistroParaEdicao` leva `nota`.
**Where**: `src/app/(app)/layout.tsx`
**Depends on**: T13
**Reuses**: `listarFaixasDosCiclos`
**Requirement**: REV-09

**Done when**:

- [x] O modal tem, por Matéria, as Faixas e o Mínimo do Ciclo; o histórico passa a `nota` na edição
- [x] Gate check passes: `npm run typecheck`

**Tests**: none
**Gate**: build
**Commit**: `feat(registro): modal recebe as faixas do ciclo`

---

### T15: Nota da revisão no modal

**What**: `formulario-de-registro.tsx` mostra "Nota da revisão" (SegmentedControl, chip "Sugerida", frase) e "Próxima revisão estimada" no rodapé, como `captures/registrar-estudo.png`.
**Where**: `src/app/formulario-de-registro.tsx`
**Depends on**: T14
**Reuses**: `SegmentedControl`, `Chip`, `sugerirNota`, `fraseDaNota`, `estimarRevisao`
**Requirement**: REV-09, REV-10

**Done when**:

- [x] O modal em 1440x960 casa com `.specs/features/cartao-de-revisao/captures/registrar-estudo.png`, nos temas Claro suave e Escuro
- [x] A nota só aparece com Tópico e questões; o erro do servidor aparece sob o controle
- [x] Gate check passes: `npm run typecheck; npm run build`

**Tests**: none
**Gate**: build
**Commit**: `feat(registro): nota da revisão e próxima revisão estimada no modal`

---

### T16: Cartão "Faixas de acerto"

**What**: Criar `src/app/faixas-de-acerto.tsx`: o cartão (Chips, Mínimo, "Editar") e o modal "Editar faixas de acerto".
**Where**: `src/app/faixas-de-acerto.tsx`
**Depends on**: T15
**Reuses**: `Chip`, `Modal`, `Input`, `salvarFaixasDoCiclo`
**Requirement**: REV-11, REV-12

**Done when**:

- [x] O cartão casa com o da `captures/ciclo.png`; o modal abre preenchido e mostra o erro sob o campo
- [x] Gate check passes: `npm run typecheck; npm run build`

**Tests**: none
**Gate**: build
**Commit**: `feat(ciclos): cartão e modal das faixas de acerto`

---

### T17: Faixas na tela do Ciclo

**What**: A página do Ciclo mostra o cartão abaixo de "Matérias" na aba "Etapas" e a aba "Faixas de acerto".
**Where**: `src/app/(app)/ciclos/[id]/page.tsx`
**Depends on**: T16
**Reuses**: `FaixasDeAcerto`, `obterFaixas`
**Requirement**: REV-11

**Done when**:

- [x] A tela em 1440x960 casa com `.specs/features/cartao-de-revisao/captures/ciclo.png` no que o cartão e a aba desenham, nos dois temas
- [x] Gate check passes: `npm run typecheck; npm run build`

**Tests**: none
**Gate**: build
**Commit**: `feat(ciclos): aba e cartão faixas de acerto`

---

### T18: Data na lista de Tópicos

**What**: `lista-de-topicos.tsx` mostra `textoDaProximaRevisao` em cada Tópico.
**Where**: `src/app/lista-de-topicos.tsx`
**Depends on**: T17
**Reuses**: `textoDaProximaRevisao`, `TopicoItem`
**Requirement**: REV-13

**Done when**:

- [x] Cada Tópico mostra a data ou "Sem revisão agendada"; a data nova aparece após registrar
- [x] Gate check passes: `npm run typecheck; npm run build; npx vitest run`

**Tests**: none
**Gate**: build
**Commit**: `feat(topicos): data da próxima revisão na lista`

---

## Checks

**C1** - O primeiro Registro de um Tópico cria o Cartão (REV-01, AC 1)
Proof: run unit | ✓ tests/cartoes.test.ts > cartão > o primeiro registro de um Tópico cria o Cartão

**C2** - O primeiro Registro sem questões cria o Cartão sem data (REV-01, AC 2)
Proof: run unit | ✓ tests/cartoes.test.ts > cartão > primeiro registro sem questões cria o Cartão sem data

**C3** - Com as Faixas padrão 59% é Errei, 60% e 74% Difícil, 75% e 89% Bom, 90% Fácil (REV-02, AC 3)
Proof: run unit | ✓ tests/revisao.test.ts > faixas e nota > conversão de nota pelas Faixas padrão

**C4** - Com questões no Mínimo a nota é sugerida pelas Faixas e a escolhida do Usuário vale no lugar (REV-03, AC 4)
Proof: run unit | ✓ tests/cartoes.test.ts > nota > questões no mínimo sugerem a nota das Faixas e aceitam a escolhida

**C5** - Abaixo do Mínimo a nota escolhida pelo Usuário é gravada (REV-04, AC 5)
Proof: run unit | ✓ tests/cartoes.test.ts > nota > abaixo do mínimo vale a nota escolhida

**C6** - Abaixo do Mínimo sem nota recusa com "Escolha a nota da revisão." e não grava Registro nem Cartão (REV-04, AC 6)
Proof: run unit | ✓ tests/cartoes.test.ts > nota > abaixo do mínimo sem nota recusa e não grava nada

**C7** - Registro sem questões não altera o Cartão (REV-05, AC 7)
Proof: run unit | ✓ tests/cartoes.test.ts > cartão > registro sem questões não altera o Cartão

**C8** - A nota é aplicada na data do Registro ao Cartão (REV-06, AC 8)
Proof: run unit | ✓ tests/cartoes.test.ts > cartão > a nota é aplicada na data do registro

**C9** - Criar, editar e excluir dão o Cartão do recálculo do zero, igual a lançar os Registros um a um (REV-07, AC 9)
Proof: run unit | ✓ tests/cartoes.test.ts > recálculo > criar, editar e excluir dão o Cartão do recálculo do zero

**C10** - Trocar Matéria ou Tópico na edição recalcula o Cartão de origem e o de destino (REV-07, AC 9)
Proof: run unit | ✓ tests/cartoes.test.ts > recálculo > trocar Matéria ou Tópico recalcula os dois Cartões

**C11** - Registro retroativo recalcula como se lançado na ordem cronológica (REV-07, AC 10)
Proof: run unit | ✓ tests/cartoes.test.ts > recálculo > registro retroativo entra na ordem cronológica

**C12** - Excluir o último Registro remove o Cartão e o log (REV-07, AC 11)
Proof: run unit | ✓ tests/cartoes.test.ts > recálculo > excluir o último registro remove o Cartão e o log

**C13** - Editar um Registro para sem questões apaga a nota e recalcula sem ela (REV-07, AC 12)
Proof: run unit | ✓ tests/cartoes.test.ts > recálculo > editar para sem questões apaga a nota

**C14** - O log tem um item por Registro com nota, com nota, data e estados antes e depois (REV-06, AC 13)
Proof: run unit | ✓ tests/cartoes.test.ts > log > um item por registro com nota

**C15** - Excluir o Tópico remove Cartão e log e mantém os Registros (REV-07, AC 14)
Proof: run unit | ✓ tests/cartoes.test.ts > recálculo > excluir o Tópico remove Cartão e log e mantém os Registros

**C16** - A migração cria os Cartões dos Registros antigos, com nota padrão para questões ≥ 5 (REV-08, AC 15)
Proof: run unit | ✓ tests/migracao-cartoes.test.ts > migração para Cartões > cria os Cartões dos Registros que já existem

**C17** - Registros de outro Usuário nunca entram no Cartão (REV-07, AC 16)
Proof: run unit | ✓ tests/cartoes.test.ts > recálculo > Cartão e Registros de outro Usuário não mudam

**C18** - O modal com Tópico e 20 questões, 16 acertos mostra "Nota da revisão", "Sugerida: Bom" e "Próxima revisão estimada" como a captura (REV-09, AC 1)
Proof: browser captures/registrar-estudo.running.png

**C19** - 80% com as Faixas padrão dá a frase "80% está na faixa 75–90% deste ciclo. Você pode trocar a nota antes de salvar." e a nota Bom marcada (REV-09, AC 2)
Proof: run unit | ✓ tests/revisao.test.ts > faixas e nota > a frase da faixa traz a porcentagem e a faixa

**C20** - Abaixo do Mínimo nenhuma nota vem marcada e a frase é "Menos de 5 questões: escolha a nota da revisão." (REV-09, AC 3)
Proof: run unit | ✓ tests/revisao.test.ts > faixas e nota > abaixo do Mínimo não há sugestão e a frase pede a nota

**C21** - Escolher outra nota no controle a marca e é essa que o Registro grava (REV-09, AC 4)
Proof: walk - no modal com 20 questões e 16 acertos, escolher Fácil marca Fácil; salvar e abrir "Editar registro" mostra Fácil marcada

**C22** - Mudar questões, acertos ou data refaz a sugestão enquanto a nota não foi trocada (REV-09, AC 5)
Proof: walk - no modal, mudar os acertos de 16 para 20 troca "Sugerida: Bom" por "Sugerida: Fácil" e a nota marcada; depois de escolher uma nota à mão, mudar os acertos não a troca

**C23** - A data estimada é a que o Tópico tem depois de salvar o mesmo Registro (REV-10, AC 6)
Proof: run unit | ✓ tests/cartoes.test.ts > estimativa > a data estimada é a do Cartão depois de salvar

**C24** - Sem Tópico, ou com Cartão que ficaria sem data, não há estimativa e nada é gravado (REV-10, AC 7)
Proof: run unit | ✓ tests/cartoes.test.ts > estimativa > sem Tópico ou sem data não há estimativa

**C25** - Com Conteúdo livre ou Sem conteúdo a seção "Nota da revisão" some (REV-09, AC 8)
Proof: walk - no modal, trocar o segmento Conteúdo para "Conteúdo livre" e para "Sem conteúdo" esconde "Nota da revisão" e o rodapé "Próxima revisão estimada"

**C26** - Editar um Registro com nota mostra a nota gravada marcada (REV-09, AC 9)
Proof: run unit | ✓ tests/cartoes.test.ts > nota > o histórico devolve a nota gravada do Registro

**C27** - O erro de nota ausente aparece sob o controle da nota e os campos ficam como estavam (REV-09, AC 10)
Proof: walk - no modal com Tópico e 2 questões, salvar sem escolher nota mostra "Escolha a nota da revisão." sob o controle e mantém os campos preenchidos

**C28** - O cartão "Faixas de acerto" e a aba aparecem na tela do Ciclo como a captura (REV-11, AC 1)
Proof: browser captures/ciclo.running.png

**C29** - Todo Ciclo, novo ou existente, tem as Faixas 60, 75 e 90 e o Mínimo 5 (REV-11, AC 2)
Proof: run unit | ✓ tests/faixas.test.ts > faixas > todo Ciclo tem as Faixas 60, 75 e 90 e o Mínimo 5

**C30** - "Editar" abre o modal "Editar faixas de acerto" com os valores preenchidos (REV-12, AC 3)
Proof: walk - em um Ciclo, "Editar" no cartão abre "Editar faixas de acerto" com 60, 75, 90 e 5 preenchidos

**C31** - Salvar limites crescentes de 1 a 100 e Mínimo de 1 a 1000 grava e o cartão mostra os valores (REV-12, AC 4)
Proof: run unit | ✓ tests/faixas.test.ts > faixas > salvar valores válidos grava

**C32** - Limite fora de 1 a 100, limites não crescentes ou Mínimo fora de 1 a 1000 recusa e mantém os valores (REV-12, AC 5)
Proof: run unit | ✓ tests/faixas.test.ts > faixas > valores inválidos são recusados e os gravados ficam

**C33** - Mudar as Faixas não muda notas já gravadas e vale para os Registros seguintes (REV-12, AC 6)
Proof: run unit | ✓ tests/faixas.test.ts > faixas > mudar as Faixas só vale para os Registros seguintes

**C34** - A aba "Faixas de acerto" mostra o cartão com "Editar" (REV-11, AC 7)
Proof: walk - na tela do Ciclo, a aba "Faixas de acerto" mostra o cartão com Chips, Mínimo e "Editar"

**C35** - Só se mostram e alteram as Faixas dos Ciclos do próprio Usuário (REV-12, AC 8)
Proof: run unit | ✓ tests/faixas.test.ts > faixas > o Ciclo de outro Usuário não aparece nem muda

**C36** - O Tópico com Cartão com data traz "Próxima revisão: dd/mm/aaaa" (REV-13, AC 1)
Proof: run unit | ✓ tests/formato.test.ts > Próxima revisão > texto com a data

**C37** - Tópico sem Cartão, ou com Cartão sem data, mostra "Sem revisão agendada" (REV-13, AC 2)
Proof: run unit | ✓ tests/formato.test.ts > Próxima revisão > sem data

**C38** - A lista de Tópicos mostra a data nova depois de um Registro, sem recarregar a página (REV-13, AC 3)
Proof: walk - registrar estudo de um Tópico com questões e ver a data na lista de Tópicos da Matéria

**C40** - Em "Editar registro" a nota gravada vem marcada e o chip "Sugerida" mostra a sugestão pelas Faixas atuais (REV-09, AC 9)
Proof: walk - em `/registros`, "Editar" num Registro com nota Fácil abre o modal com Fácil marcada e o chip "Sugerida: Bom" (80% nas Faixas atuais); mudar os acertos troca o chip e mantém Fácil marcada

**C39** - `obterMateria` traz a data de cada Tópico, ou nulo (REV-13, AC 1)
Proof: run unit | ✓ tests/topicos.test.ts > próxima revisão > a Matéria traz a data de cada Tópico

---

## Handoff

The feature's live state, written as it happens - a compaction gives no warning.

**Settled mid-build:** none
**Dispatched:** batch 1 (Phase 1, T1-T4) worker, sent at spec commit; started; returned; batch 2 (Phase 2, T5-T10) worker, sent at HEAD 3f04a7b; returned; batch 3 (Phase 3, T11-T18) worker, sent at HEAD a7cf6e1; returned; Verifier e sub-agente de telas (rodada 1), em paralelo, sobre HEAD 0469edd; Verifier retornou (FAIL, 3 findings, fechados); telas rodada 1 retornou e rodada 2 retornou: matches
**Walked:** App em `http://localhost:3100` (`next dev`, banco dev `postgres://postgres:dev@localhost:54330/dev`, migrações aplicadas), entrar com `voltas@exemplo.com` / `senha-de-teste-123`, Ciclo "TRT 2ª Região — Analista" em `/ciclos/d096c67a-327d-4e2d-965c-543706d42093` (Matéria Português em `/ciclos/d096c67a-327d-4e2d-965c-543706d42093/materias/7702c10b-7b34-4abc-b931-cabeb09c5bcf`), janela de 1440x960, tema Claro suave (e Escuro com `localStorage.tema = "escuro"`). Cliques reais num Chromium sem cabeça (Playwright).
- Nota da revisão no modal (REV-09/10): em "Registrar estudo" (botão da Hoje), Tópico 1, 20 questões e 16 acertos mostram "Nota da revisão", "Sugerida: Bom", Bom marcado, "80% está na faixa 75–90% deste ciclo. Você pode trocar a nota antes de salvar." e o rodapé "Próxima revisão estimada: 21/11". C22: acertos 16 para 20 troca para "Sugerida: Fácil" com Fácil marcado ("100% está na faixa ≥ 90%", 26/11); depois de escolher Errei à mão, mudar os acertos mantém Errei (só o chip "Sugerida" muda). C21: escolher Fácil marca Fácil e o Registro gravou Fácil. C25: "Conteúdo livre" e "Sem conteúdo" escondem "Nota da revisão" e o rodapé; voltar a "Tópico" traz a seção de volta. C27: Tópico 3, 2 questões, 1 acerto, "Salvar registro" sem nota mostra "Escolha a nota da revisão." sob o controle ("Menos de 5 questões: escolha a nota da revisão.") com o modal aberto e Tópico/questões/acertos intactos. C26: em `/registros`, "Editar" no Registro com Fácil abre "Editar registro" com Fácil marcada, "Sugerida: Bom" (80%, Faixas atuais) e "Próxima revisão estimada: 26/11".
- Faixas de acerto do Ciclo (REV-11/12): na aba "Etapas" o cartão "Faixas de acerto" fica abaixo de "Matérias" com Errei "< 60%", Difícil "60–75%", Bom "75–90%", Fácil "≥ 90%", "Mínimo de questões 5" e "Editar". C34: a aba "Faixas de acerto" mostra o mesmo cartão com "Editar". C30: "Editar" abre "Editar faixas de acerto" com 60, 75, 90 e 5 (campos "Errei: abaixo de (%)", "Difícil: abaixo de (%)", "Bom: abaixo de (%)", "Mínimo de questões"; o limite de Fácil é o terceiro). Terceiro limite 70 mostra "Cada limite deve ser maior que o anterior." sob o campo e o modal fica aberto; 95 fecha o modal e o cartão mostra "75–95%" e "≥ 95%"; com 25 questões e 23 acertos (92%) o modal sugere Bom ("92% está na faixa 75–95% deste ciclo"). Depois voltei o limite para 90.
- Data da próxima revisão no Tópico (REV-13): `/ciclos/<ciclo>/materias/<matéria>` mostra "Próxima revisão: 26/11/2026" no Tópico 1 de Português e "Sem revisão agendada" nos sem Registro. C38: indo pelo menu (sem recarregar) da Matéria Português para a Hoje, registrando 20/16 no Tópico 5 e voltando pelo menu, o Tópico 5 passa de "Sem revisão agendada" a "Próxima revisão: 21/11/2026".
- Escuro: modal, tela do Ciclo (Etapas e aba "Faixas de acerto") e modal "Editar faixas de acerto" legíveis, Chips com as cores de cada nota. Achado fora desta feature: no Escuro a linha "Próxima etapa" da tabela de Etapas fica com fundo quase branco e o nome da Matéria some (texto claro sobre claro).
- Diferenças das capturas `registrar-estudo.png` e `ciclo.png`: o modal aberto pela Hoje traz "Horas" e "Minutos" no lugar do campo "Duração" único e não tem a linha "Duração preenchida pelo cronômetro" (só aparece ao parar o cronômetro); a barra lateral e a Hoje têm menos itens (sem Revisões, sem Ciclos extras, Ciclo com 3 etapas em vez de 9) e a tela do Ciclo tem o link "Renomear" ao lado do título, ausente da captura; o resto do cartão e da seção "Nota da revisão" bate com a captura.
- Estados que dependem de dados: a Matéria que o modal propõe é a da próxima etapa do Ciclo (muda conforme as horas da Volta; escolher a Matéria no seletor antes do Tópico); o chip e a frase "Menos de 5 questões" só aparecem com questões abaixo do Mínimo; "Sem revisão agendada" aparece em Tópico sem Registro com questões.
- Estado desenhado: `captures/registrar-estudo.running.png` (Hoje, modal "Registrar estudo", Tópico 1, 20 questões, 16 acertos, Sugerida: Bom) e `captures/ciclo.running.png` (aba "Etapas" com o cartão "Faixas de acerto"), ambas em 1440x960, tema Claro suave.

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3

Phase 1:  T1 → T2 → T3 → T4
Phase 2:  T4 → T5 → T6 → T7 → T8 → T9 → T10
Phase 3:  T10 → T11 → T12 → T13 → T14 → T15 → T16 → T17 → T18
```
