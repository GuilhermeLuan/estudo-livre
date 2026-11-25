# Editar ciclo Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, the walk, check_proofs, the Verifier and the screens sub-agent).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: inline (abaixo) - sem `design.md`: reaproveita `criarCiclo`, `sugerirEtapas`, `SugestaoDeCiclo` e `avaliarFechamentoDaVolta`
**Status**: Approved
**Approved**: 2026-11-25 - user: "Plano aprovado, pode implementar"
**Build**: `npm run typecheck; npm run build`
**Run unit**: `npx vitest run tests/editar-ciclo.test.ts --reporter=verbose`

### Design inline

- **Dado novo**: `ciclo.duracao_etapa_minutos` integer nulo (AD-041). Migração gerada por `npm run db:generate`; Ciclos existentes ficam nulos.
- **Domínio** (`src/dominio.ts`): `duracaoDaEdicao(gravada: number | null, cargas: number[]): number` - gravada, senão a carga mais comum (empate: a menor), senão 60.
- **Leitura** (`src/casos-de-uso/ciclos.ts`): `obterSugestaoDoCiclo(db, usuario, cicloId)` → `{ id, nome, arquivado, duracaoEtapaMinutos, materias: { nome, questoesDaProva: number | null, dificuldade: Dificuldade | null }[] }`, Matérias com Etapa na ordem da primeira Etapa.
- **Escrita** (`src/casos-de-uso/ciclos.ts`): `gerarEtapas(db, usuario, cicloId, { nome, duracaoEtapaMinutos, materias })` → `{ voltaFechada: number | null }`. Valida como `criarCiclo` (reusa `materiasValidas`, `nomeValido`, `cargaValida`) e recusa lista vazia (`LISTA_VAZIA` = "Adicione ao menos uma matéria para gerar as etapas."). Numa transação com `travarCiclo`: atualiza nome e duração; resolve cada Matéria por nome (reaproveita ou cria, gravando Questões e Dificuldade); apaga todas as Etapas; insere as sugeridas em posições 0..N-1; roda `descartarMateriaSemUso` nas Matérias que tinham Etapa e saíram; `avaliarFechamentoDaVolta`.
- **Action** (`src/app/acoes-ciclos.ts`): `gerarCiclo(cicloId, estado, dados)` → erro, ou `redirect('/ciclos/{id}')` com `?volta-concluida=N` quando a Volta fechou.
- **Tela**: `SugestaoDeCiclo` ganha o modo edição (`inicial`, `botao="Gerar ciclo"`, confirmação em `AlertDialog`, sem a frase de ciclo vazio, botões desabilitados sem linhas). Página `/ciclos/[id]/editar`; botão "Editar ciclo" no topo de `/ciclos/[id]`, que também mostra o `Aviso` lido de `volta-concluida`.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `AGENTS.md`, `vitest.config.ts`, `.github/workflows/ci.yml` (typecheck, testes, build; sem lint). O repo testa domínio e casos de uso com Postgres real em `tests/`; telas e actions não têm testes de componente.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Domínio (`src/dominio.ts`) | unit | Todos os ramos; 1:1 com os critérios; exemplos da spec | `tests/*.test.ts` | `npx vitest run tests/editar-ciclo.test.ts` |
| Casos de uso (`src/casos-de-uso/*`) | integration (Postgres real) | Caminho feliz + cada recusa e falha dos critérios | `tests/*.test.ts` | `npx vitest run tests/editar-ciclo.test.ts` |
| Schema / migração | none | build gate (e os testes de caso de uso que usam a coluna) | - | `npm run typecheck` |
| Actions e telas (`src/app/*`) | none (walk + captura) | Cada gesto e estado andado no navegador | - | build gate + walk |

## Gate Check Commands

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | Domínio | `npx vitest run tests/editar-ciclo.test.ts` |
| Full | Casos de uso | `npx vitest run` |
| Build | Telas, actions, fim de fase | `npm run typecheck && npx vitest run && npm run build` |

---

## Execution Plan

### Phase 1: Dados e regras

```
T1 → T2 → T3 → T4 → T5
```

### Phase 2: Tela

```
T6 → T7 → T8 → T9
```

---

## Task Breakdown

### T1: Duração da edição no domínio ✅

**What**: `duracaoDaEdicao(gravada, cargas)` e a mensagem `LISTA_VAZIA` em `src/dominio.ts`, com testes
**Where**: `src/dominio.ts`
**Depends on**: None
**Reuses**: `DURACAO_PADRAO_DA_ETAPA_MINUTOS`
**Requirement**: EDIT-05

**Done when**:

- [ ] Gravada vence; sem gravada, a carga mais comum (empate: a menor); sem Etapas, 60
- [ ] Exemplos da spec (90 → 90; 60,60,120 → 60; 60,120 → 60; [] → 60) em `tests/editar-ciclo.test.ts`
- [ ] Gate check passes: `npx vitest run tests/editar-ciclo.test.ts`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(ciclos): duração da etapa na edição do ciclo`

---

### T2: Gravar a duração da Etapa no Ciclo ✅

**What**: coluna `ciclo.duracao_etapa_minutos` com migração e `criarCiclo` gravando a duração informada
**Where**: `src/db/schema.ts` (+ migração gerada em `drizzle/`), `src/casos-de-uso/ciclos.ts`
**Depends on**: T1
**Reuses**: `criarCiclo`
**Requirement**: EDIT-23

**Done when**:

- [ ] Criar com "1,5" grava 90; criar sem Matérias grava a duração informada (padrão 60)
- [ ] Gate check passes: `npx vitest run`

**Tests**: integration
**Gate**: full
**Commit**: `feat(ciclos): grava a duração da etapa no ciclo`

---

### T3: Ler o Ciclo para a edição ✅

**What**: caso de uso `obterSugestaoDoCiclo`
**Where**: `src/casos-de-uso/ciclos.ts`
**Depends on**: T2
**Reuses**: `exigirCiclo`, `duracaoDaEdicao`
**Requirement**: EDIT-03, EDIT-04, EDIT-05, EDIT-18

**Done when**:

- [ ] Uma linha por Matéria com Etapa, na ordem da primeira Etapa; Matéria sem Etapa fica fora
- [ ] Questões e Dificuldade gravadas; nulos quando a Matéria foi criada à mão
- [ ] Duração por `duracaoDaEdicao`; Ciclo de outro Usuário → `NaoEncontradoError`
- [ ] Gate check passes: `npx vitest run`

**Tests**: integration
**Gate**: full
**Commit**: `feat(ciclos): lê o ciclo para editar a sugestão`

---

### T4: Gerar as Etapas no mesmo Ciclo ✅

**What**: caso de uso `gerarEtapas`
**Where**: `src/casos-de-uso/ciclos.ts`
**Depends on**: T3
**Reuses**: `materiasValidas`, `sugerirEtapas`, `travarCiclo`, `descartarMateriaSemUso`, `avaliarFechamentoDaVolta`
**Requirement**: EDIT-09 a EDIT-20

**Done when**:

- [ ] Etapas substituídas pelas de `sugerirEtapas`, posições 0..N-1, duração informada; nome e duração gravados no Ciclo
- [ ] Matéria de mesmo nome (sem diferenciar maiúsculas) reaproveitada com o mesmo id e Registros; nova criada com Questões e Dificuldade
- [ ] Matéria fora da lista: sem Etapas; fica com Registro ou Tópico, apagada sem eles
- [ ] Volta aberta com mesmo número e início; progresso recalculado (3h de Português, 2 Etapas de 1h → 100%, 1h extra); fecha e devolve o número quando tudo fica 100%
- [ ] Recusas: lista vazia, nome vazio, Matéria repetida, Questões inválidas, arquivado, outro Usuário - sem mudar nada
- [ ] Gate check passes: `npx vitest run`

**Tests**: integration
**Gate**: full
**Commit**: `feat(ciclos): gera as etapas sugeridas num ciclo existente`

---

### T5: Duração da Etapa no backup ✅

**What**: exportar e importar `duracaoEtapaMinutos` por Ciclo
**Where**: `src/casos-de-uso/backup.ts`
**Depends on**: T4
**Reuses**: validadores de `backup.ts` (`exigir`, `inteiro`)
**Requirement**: EDIT-25, EDIT-26, EDIT-27

**Done when**:

- [ ] Exporta inteiro ou `null`; importa o valor ou nulo quando ausente
- [ ] Recusa 0, 2.5, "60" e 600001 com a recusa de arquivo inválido, sem substituir nada
- [ ] Gate check passes: `npx vitest run`

**Tests**: integration
**Gate**: full
**Commit**: `feat(backup): leva a duração da etapa do ciclo`

---

### T6: Action de gerar o ciclo

**What**: server action `gerarCiclo` que chama `gerarEtapas` e redireciona para `/ciclos/{id}` (com `?volta-concluida=N` quando a Volta fechou)
**Where**: `src/app/acoes-ciclos.ts`
**Depends on**: None (Phase 1 completa)
**Reuses**: `executar`, `materiasDoFormulario`, `minutos`
**Requirement**: EDIT-09, EDIT-14

**Done when**:

- [ ] Erros voltam como `{ erro }`; sucesso redireciona; revalida `/ciclos/{id}`
- [ ] Gate check passes: `npm run typecheck`

**Tests**: none
**Gate**: build
**Commit**: `feat(ciclos): action para gerar o ciclo editado`

---

### T7: Modo edição da tela de sugestão

**What**: `SugestaoDeCiclo` aceita valores iniciais, botão "Gerar ciclo" com `AlertDialog`, sem a frase de ciclo vazio e com botões desabilitados sem linhas
**Where**: `src/app/sugestao-de-ciclo.tsx`
**Depends on**: T6
**Reuses**: `AlertDialog` de `@/components/base/modal/modal` (como em `reiniciar-volta.tsx`)
**Requirement**: EDIT-02, EDIT-04, EDIT-06, EDIT-07, EDIT-08, EDIT-15, EDIT-21, EDIT-22

**Done when**:

- [ ] `/ciclos/novo` continua igual à captura (texto, botões, ciclo vazio permitido)
- [ ] Modo edição bate com `.specs/features/editar-ciclo/captures/editar-ciclo.png`, com os textos de AD-042 e AD-043
- [ ] Gate check passes: `npm run typecheck`

**Tests**: none
**Gate**: build
**Commit**: `feat(ciclos): modo edição da sugestão de ciclo`

---

### T8: Página /ciclos/[id]/editar

**What**: página que carrega `obterSugestaoDoCiclo` e mostra "Editar ciclo" com a tela em modo edição; arquivado mostra a recusa sem formulário; não encontrado → 404
**Where**: `src/app/(app)/ciclos/[id]/editar/page.tsx`
**Depends on**: T7
**Reuses**: `src/app/(app)/ciclos/novo/page.tsx`, `notFound` como em `src/app/(app)/ciclos/[id]/page.tsx`
**Requirement**: EDIT-02, EDIT-03, EDIT-17, EDIT-18, EDIT-24

**Done when**:

- [ ] Abre preenchida; a 1860px e a 390px sem rolagem horizontal
- [ ] Gate check passes: `npm run typecheck && npx vitest run && npm run build`

**Tests**: none
**Gate**: build
**Commit**: `feat(ciclos): página de edição do ciclo`

---

### T9: Botão "Editar ciclo" e aviso da Volta concluída

**What**: link-botão "Editar ciclo" no topo de `/ciclos/[id]` (só não arquivado) e o `Aviso` lido de `?volta-concluida=N`
**Where**: `src/app/(app)/ciclos/[id]/page.tsx`
**Depends on**: T8
**Reuses**: `Button` (href), `Aviso`, `avisoDaVoltaConcluida`
**Requirement**: EDIT-01, EDIT-14

**Done when**:

- [ ] Botão aparece no ativo e some no arquivado; aviso "Volta N concluída. A Volta N+1 começou." depois de gerar fechando a Volta
- [ ] Gate check passes: `npm run typecheck && npx vitest run && npm run build`

**Tests**: none
**Gate**: build
**Commit**: `feat(ciclos): botão editar ciclo na página do ciclo`

---

## Checks

**C1** - "Editar ciclo" aparece no topo do Ciclo ativo, leva a `/ciclos/{id}/editar` e some no arquivado (EDIT-01, AC 1)
Proof: walk - Ciclo ativo mostra o botão e o clique abre a edição; Ciclo arquivado não mostra o botão

**C2** - A edição é a tela da captura com "Editar ciclo" e "Gerar ciclo" (EDIT-02, AC 2)
Proof: browser captures/editar-ciclo.running.png

**C3** - A edição lista uma linha por Matéria com Etapa, na ordem da primeira Etapa, com Questões e Dificuldade gravadas; Matéria sem Etapa fica fora (EDIT-03, AC 3)
Proof: run unit | ✓ tests/editar-ciclo.test.ts > obterSugestaoDoCiclo > lista as Matérias com Etapa na ordem da primeira Etapa

**C4** - Matéria sem Questões ou Dificuldade gravadas vem com Questões nulo e Dificuldade nula (a tela mostra vazio e "Média") (EDIT-04, AC 4)
Proof: run unit | ✓ tests/editar-ciclo.test.ts > obterSugestaoDoCiclo > Matéria criada à mão vem sem Questões nem Dificuldade

**C5** - Duração: gravada 90 → 90; sem gravada 60,60,120 → 60; 60,120 → 60; sem Etapas → 60 (EDIT-05, AC 5)
Proof: run unit | ✓ tests/editar-ciclo.test.ts > duracaoDaEdicao > usa a gravada, senão a carga mais comum (empate a menor), senão 1h

**C6** - Na edição valem as regras da criação: repetida, lista cheia, Questões inválidas e visualização (EDIT-06, AC 6)
Proof: walk - acrescentar "português" com "Português" na lista recusa com "A matéria “português” já está na lista."; Questões "0" recusa com "Informe as questões da prova (inteiro de 1 a 10.000)."; "Visualizar ciclo" mostra as Etapas

**C7** - "Gerar ciclo" abre o AlertDialog "Gerar ciclo?" com o texto e os botões "Cancelar" e "Gerar ciclo" (EDIT-07, AC 7)
Proof: walk - o diálogo mostra "Gerar ciclo?", "As etapas atuais serão substituídas pelas da sugestão. Registros, tópicos e voltas continuam.", "Cancelar" e "Gerar ciclo"

**C8** - "Cancelar" fecha o diálogo e as Etapas do Ciclo não mudam (EDIT-08, AC 8)
Proof: walk - depois de "Cancelar" o formulário segue como estava e a página do Ciclo mostra as mesmas Etapas

**C9** - Gerar grava nome e duração, substitui todas as Etapas pelas sugeridas em posições 0..N-1 e grava Questões e Dificuldade (EDIT-09, AC 9)
Proof: run unit | ✓ tests/editar-ciclo.test.ts > gerarEtapas > substitui as Etapas pelas sugeridas e grava nome, duração, Questões e Dificuldade

**C10** - Matéria de mesmo nome (sem diferenciar maiúsculas) é reaproveitada com o mesmo id e seus Registros e Tópicos (EDIT-10, AC 10)
Proof: run unit | ✓ tests/editar-ciclo.test.ts > gerarEtapas > reaproveita a Matéria de mesmo nome com Registros e Tópicos

**C11** - Nome novo cria a Matéria com Questões e Dificuldade (EDIT-11, AC 11)
Proof: run unit | ✓ tests/editar-ciclo.test.ts > gerarEtapas > cria a Matéria nova com Questões e Dificuldade

**C12** - Matéria tirada da lista perde as Etapas; fica com Registro ou Tópico, é apagada sem eles (EDIT-12, AC 12)
Proof: run unit | ✓ tests/editar-ciclo.test.ts > gerarEtapas > Matéria fora da lista perde as Etapas e só fica com Registro ou Tópico

**C13** - A Volta aberta mantém número e início; 3h de Português em 2 Etapas de 1h → as duas 100% e 1h extra (EDIT-13, AC 13)
Proof: run unit | ✓ tests/editar-ciclo.test.ts > gerarEtapas > mantém a Volta aberta e recalcula o progresso com as horas dela

**C14** - Quando todas as novas Etapas ficam 100%, a Volta fecha e o número volta para o aviso (EDIT-14, AC 14)
Proof: run unit | ✓ tests/editar-ciclo.test.ts > gerarEtapas > fecha a Volta quando todas as novas Etapas ficam completas

**C15** - Lista vazia é recusada com "Adicione ao menos uma matéria para gerar as etapas." sem mudar nada (EDIT-15, AC 15)
Proof: run unit | ✓ tests/editar-ciclo.test.ts > gerarEtapas > recusa a lista vazia sem mudar nada

**C16** - Matéria repetida chegando ao caso de uso é recusada e as Etapas não mudam (EDIT-16, AC 16)
Proof: run unit | ✓ tests/editar-ciclo.test.ts > gerarEtapas > recusa Matéria repetida sem mudar as Etapas

**C17** - Ciclo arquivado recusa a geração sem gravar nada (EDIT-17, AC 17)
Proof: run unit | ✓ tests/editar-ciclo.test.ts > gerarEtapas > recusa Ciclo arquivado sem mudar nada

**C18** - Ciclo de outro Usuário não é lido nem gerado (EDIT-18, AC 18)
Proof: run unit | ✓ tests/editar-ciclo.test.ts > gerarEtapas > não lê nem gera Ciclo de outro Usuário

**C19** - Etapas enviadas pelo cliente são ignoradas (EDIT-19, AC 19)
Proof: run unit | ✓ tests/editar-ciclo.test.ts > gerarEtapas > ignora Etapas enviadas pelo cliente

**C20** - Nome do Ciclo vazio é recusado com "Informe o nome do ciclo." (EDIT-20, AC 20)
Proof: run unit | ✓ tests/editar-ciclo.test.ts > gerarEtapas > recusa o nome do Ciclo vazio

**C21** - "Gerar ciclo" fica desabilitado enquanto envia (EDIT-21, AC 21)
Proof: walk - depois de confirmar, o botão "Gerar ciclo" fica desabilitado até a página do Ciclo abrir

**C22** - A descrição do cartão Matérias na edição não traz "Sem matérias, o ciclo nasce vazio." (EDIT-22, AC 22)
Proof: walk - a edição mostra "Informe as questões da prova e a sua dificuldade em cada matéria para receber a sugestão de etapas." sem a frase; `/ciclos/novo` continua com ela

**C23** - Criar com "1,5" grava 90 minutos no Ciclo (EDIT-23, AC 23)
Proof: run unit | ✓ tests/editar-ciclo.test.ts > criarCiclo > grava a duração da Etapa no Ciclo

**C24** - A edição a 390px não rola na horizontal e os botões ficam alcançáveis (EDIT-24, AC 24)
Proof: walk - a 390px a tabela é usável, sem rolagem horizontal da página, e "Visualizar ciclo" e "Gerar ciclo" alcançáveis

**C25** - O backup exporta `duracaoEtapaMinutos` de cada Ciclo (EDIT-25, AC 1)
Proof: run unit | ✓ tests/editar-ciclo.test.ts > backup > exporta duracaoEtapaMinutos

**C26** - Importar recria a duração, ou nulo quando ausente (EDIT-26, AC 2)
Proof: run unit | ✓ tests/editar-ciclo.test.ts > backup > importa duracaoEtapaMinutos ou nulo quando ausente

**C27** - Importar recusa 0, 2.5, "60" e 600001 sem substituir nada (EDIT-27, AC 3)
Proof: run unit | ✓ tests/editar-ciclo.test.ts > backup > recusa duracaoEtapaMinutos inválida sem substituir nada

---

## Handoff

**Settled mid-build:** none
**Dispatched:** none
**Walked:** none

---

## Phase Execution Map

```
Phase 1 → Phase 2

Phase 1:  T1 → T2 → T3 → T4 → T5
Phase 2:  T6 → T7 → T8 → T9
```
