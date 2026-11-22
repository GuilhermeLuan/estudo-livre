# Exportar e importar backup em JSON Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, the walk, check_proofs, the Verifier and the screens sub-agent).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: inline (below, "Design inline"); sem `design.md`: nenhuma tabela nova, só leitura e escrita das que existem
**Status**: In Progress
**Approved**: 2026-11-22 - user: "aprovado, pode começar"
**Build**: `npm run typecheck; npm run build`
**Run unit**: `npx vitest run tests/backup.test.ts --reporter=verbose`

## Design inline

- `src/casos-de-uso/backup.ts`, exportado em `index.ts`:
  - `exportarBackup(db, usuario): Backup` monta o objeto `{ formato: "estudo-livre", versao: 1, exportadoEm, ciclos: [...] }`. Cada Ciclo traz `nome`, `criadoEm`, `arquivadoEm`, `faixas { erreiAte, dificilAte, bomAte }`, `minimoDeQuestoes`, `materias [{ id, nome, topicos [{ id, nome, estudado, posicao }] }]`, `etapas [{ materiaId, cargaMinutos, posicao }]`, `voltas [{ numero, inicio, fim }]`, `registros [{ id, materiaId, topicoId, dataHora, duracaoMinutos, tipo, questoes, acertos, anotacao, nota, conteudoLivre, criadoEm }]`, `cartoes [{ topicoId, proximaRevisao, estado }]` e `logDeRevisao [{ topicoId, registroId, nota, revisadoEm, antes, depois }]`. Os ids do arquivo só ligam as partes. As datas vão em ISO 8601 UTC. A ordem é fixa: Ciclos por `criadoEm, id`; Etapas por posição; Voltas por número; Tópicos por posição; Registros por `dataHora, criadoEm, id`.
  - `nomeDoArquivoDeBackup(agora)` devolve `estudo-livre-backup-<hojeEmBrasilia>.json`.
  - `importarBackup(db, usuario, texto): { ciclos: number }` recusa, sempre com `ValidacaoError`:
    - texto com mais de 50 MB (`Buffer.byteLength`);
    - JSON que não parseia, `formato` errado ou estrutura e tipos inválidos;
    - `versao` diferente de 1;
    - Cronômetro do Usuário ativo.
    - O validador é escrito à mão (o repo não tem zod). Ele checa `tipo ∈ TIPOS_DE_ESTUDO`, `nota ∈ NOTAS | null`, inteiros ≥ 0, `duracaoMinutos > 0`, datas ISO válidas e referências a Matéria, Tópico ou Registro presentes no arquivo.
    - Numa única transação: apaga os Ciclos do Usuário (o cascade leva Matérias, Etapas, Voltas, Tópicos, Registros, Cartões e log), insere tudo com ids novos via mapa de ids e chama `recalcularTopico` para cada Tópico com Registros. O `cartoes`/`logDeRevisao` do arquivo é lido só pelo validador (AD-031).
    - Uma violação de unicidade do Postgres (`23505`: nome de Matéria ou Tópico repetido, Volta duplicada ou duas abertas) vira o mesmo `ValidacaoError` de arquivo inválido, e a transação desfaz tudo.
  - Mensagens: `INVALIDO = "O arquivo não é um backup válido do Estudo Livre."`, `"Versão de backup desconhecida: <v>."`, `"O arquivo passa de 50 MB."`, `"Pare ou descarte o cronômetro antes de importar."`.
- `src/app/api/backup/route.ts`: `GET` com `exigirUsuario()` (o proxy já manda quem não tem cookie para `/entrar`) e `Response.json(backup, { headers: { "Content-Disposition": attachment; filename=... } })`.
- `next.config.ts`: `experimental.serverActions.bodySizeLimit: "51mb"` e `experimental.proxyClientMaxBodySize: "51mb"`. Os padrões são 1 MB e 10 MB (`node_modules/next/dist/docs/.../serverActions.md`, `proxyClientMaxBodySize.md`); a folga cobre o overhead do multipart.
- `src/app/acoes-backup.ts`: a server action `importar(dados)` lê o `File` do campo `arquivo`, chama `importarBackup`, `revalidatePath("/", "layout")` e devolve `{ aviso }` ou `{ erro }`.
- `src/app/(app)/backup/page.tsx` mostra os cartões e o total de Ciclos (ativos e arquivados, de `obterHome`) que o diálogo de confirmação usa. `src/app/backup-importar.tsx` (client) traz o campo de arquivo, "Escolha um arquivo.", a pré-checagem de 50 MB no cliente (sem ela o Next corta o corpo antes da action), o `AlertDialog` e o `Aviso`, como em `reiniciar-volta.tsx`.
- `navegacao.tsx` recebe o item "Backup" (`RiDatabase2Line`) no bloco Conta da Sidebar, o item no menu do celular e `TITULOS["/backup"]`. `docs/design-system.md` ganha a página Backup, que não tem frame no Figma.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines and spec. Guidelines found: `AGENTS.md` (UI segue `docs/design-system.md`, tokens BoardUI, `/frontend-design`), `vitest.config.ts` (testes em `tests/`, Postgres real). Os `tests/*.test.ts` existentes são o piso.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Casos de uso (`src/casos-de-uso/backup.ts`) | integration (Postgres real) | 1:1 com os critérios, caminhos de recusa, isolamento entre Usuários, ida e volta | `tests/backup.test.ts` | `npx vitest run tests/backup.test.ts` |
| Rota, server action, config e telas (`src/app/**`, `next.config.ts`) | none | Provadas pela visita (walk) | - | build gate |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with one test file | `npx vitest run tests/backup.test.ts` |
| Full | After tasks that touch existing use cases | `npx vitest run` |
| Build | After phase completion or tasks with no test layer | `npm run typecheck; npm run build; npx vitest run` |

---

## Execution Plan

### Phase 1: Domínio

```
T1 → T2
```

### Phase 2: Interface

```
T2 → T3 → T4 → T5 → T6
```

---

## Task Breakdown

### T1: Exportar backup

**What**: `exportarBackup` e `nomeDoArquivoDeBackup` em `backup.ts`, exportados no índice, com os testes de exportação.
**Where**: `src/casos-de-uso/backup.ts`
**Depends on**: None
**Reuses**: `hojeEmBrasilia` de `src/dia.ts`, schema de `src/db/schema.ts`, `cadastrar`/`limparBanco` de `tests/apoio.ts`
**Requirement**: BKP-02, BKP-03, BKP-04

**Done when**:

- [x] Os testes `exportar` de `tests/backup.test.ts` passam. Eles cobrem:
  - `formato`, `versao` e `exportadoEm`;
  - um Ciclo ativo e um arquivado, com cada campo de Matéria, Etapa, Volta, Tópico, Registro, Cartão e log;
  - a ausência de e-mail, nome, Cronômetro e sessão;
  - a ausência dos Ciclos de outro Usuário;
  - o nome do arquivo com o dia de Brasília perto da meia-noite UTC.
- [x] Gate quick passes: `npx vitest run tests/backup.test.ts`

**Tests**: integration
**Gate**: quick

**Commit**: `feat(backup): exportar os dados do usuário em JSON`

---

### T2: Importar backup

**What**: `importarBackup` com validação, substituição numa transação e recálculo dos Cartões, com os testes de importação, recusa e ida e volta.
**Where**: `src/casos-de-uso/backup.ts` (modify)
**Depends on**: T1
**Reuses**: `recalcularTopico` de `src/casos-de-uso/revisao.ts`, `ValidacaoError`, `TIPOS_DE_ESTUDO`, `NOTAS`
**Requirement**: BKP-07, BKP-08, BKP-09, BKP-10, BKP-11

**Done when**:

- [x] Os testes `importar`, `recusar` e `ida e volta` passam. Eles cobrem:
  - a substituição dos Ciclos existentes e a contagem devolvida;
  - o arquivado que volta arquivado, com a mesma data;
  - Cartões recalculados mesmo com `cartoes` adulterado no arquivo;
  - JSON quebrado, formato errado, campo faltando, tipo inválido e referência quebrada, com a mensagem de inválido e a conta intacta;
  - versão 2, com a mensagem própria e a conta intacta;
  - mais de 50 MB;
  - Cronômetro ativo;
  - Matéria repetida no mesmo Ciclo, em que o erro do banco desfaz tudo;
  - a gravação só na conta da sessão;
  - lista vazia;
  - o mesmo arquivo importado duas vezes;
  - Registro sem Tópico nem conteúdo livre;
  - exportar A, importar em B e exportar B dá o mesmo arquivo sem ids e sem `exportadoEm`;
  - a mesma Volta, o mesmo progresso, as mesmas Horas extras, os mesmos totais das Estatísticas e as mesmas próximas revisões.
- [x] Gate full passes: `npx vitest run`

**Tests**: integration
**Gate**: full

**Commit**: `feat(backup): importar backup substituindo os ciclos`

---

### T3: Rota de exportação

**What**: `GET /api/backup` baixa o arquivo do Usuário da sessão com `Content-Disposition`.
**Where**: `src/app/api/backup/route.ts`
**Depends on**: T2
**Reuses**: `exigirUsuario`, `obterDb`, `exportarBackup`, `nomeDoArquivoDeBackup`
**Requirement**: BKP-02, BKP-04

**Done when**:

- [x] Build gate passes
- [ ] Na visita, com sessão, a rota baixa `estudo-livre-backup-<dia>.json`; sem sessão, leva a `/entrar`

**Tests**: none
**Gate**: build

**Commit**: `feat(backup): rota de download do backup`

---

### T4: Ação de importar e limites de corpo

**What**: A server action `importar` e os limites de 51 MB no `next.config.ts`.
**Where**: `src/app/acoes-backup.ts`
**Depends on**: T3
**Reuses**: padrão de `src/app/acoes-registros.ts`
**Requirement**: BKP-07, BKP-10

**Done when**:

- [x] `next.config.ts` com `serverActions.bodySizeLimit` e `proxyClientMaxBodySize`
- [x] Build gate passes

**Tests**: none
**Gate**: build

**Commit**: `feat(backup): ação de importar e limite de 50 MB`

---

### T5: Página Backup

**What**: A página `/backup` com os cartões Exportar e Importar, o campo de arquivo, a confirmação e o aviso.
**Where**: `src/app/backup-importar.tsx`
**Depends on**: T4
**Reuses**: `Button`, `AlertDialog`, `Aviso`, campos de `src/components/base/input`, `/frontend-design`
**Requirement**: BKP-01, BKP-05, BKP-06, BKP-07

**Done when**:

- [ ] `src/app/(app)/backup/page.tsx` e `src/app/backup-importar.tsx` mostram os textos da spec, nos temas Claro suave e Escuro, a 390px e a 1440px
- [ ] Na visita: sem arquivo aparece "Escolha um arquivo."; a conta com Ciclos abre "Substituir seus dados?" e "Cancelar" não muda nada; a conta vazia importa direto; o aviso diz "Backup importado: N ciclos."
- [x] Build gate passes

**Tests**: none
**Gate**: build

**Commit**: `feat(backup): página de backup com exportar e importar`

---

### T6: Navegação e design system

**What**: O item "Backup" na Sidebar e no menu do celular, o título da rota e a seção da página no design system.
**Where**: `src/app/navegacao.tsx`
**Depends on**: T5
**Reuses**: `ItemDeNavegacao`, `DropdownItem`
**Requirement**: BKP-01

**Done when**:

- [ ] Sidebar (≥ 1024px) e menu do celular (< 1024px) levam a `/backup`; o topo do celular diz "Backup"
- [x] `docs/design-system.md` descreve a página Backup
- [x] Build gate passes

**Tests**: none
**Gate**: build

**Commit**: `feat(backup): item backup na navegação`

---

## Checks

**C1** - O arquivo traz `"formato": "estudo-livre"`, `"versao": 1` e `exportadoEm` (BKP-02, AC 4)
Proof: run unit | ✓ tests/backup.test.ts > exportar > traz formato, versão e data da exportação

**C2** - O nome do arquivo é `estudo-livre-backup-<AAAA-MM-DD>.json` com o dia de Brasília (BKP-02, AC 3)
Proof: run unit | ✓ tests/backup.test.ts > exportar > nomeia o arquivo com o dia de Brasília

**C3** - Ciclos ativos e arquivados saem com todos os campos de Matérias, Etapas, Voltas, Tópicos, Registros, Cartões e log (BKP-03, AC 5)
Proof: run unit | ✓ tests/backup.test.ts > exportar > inclui ciclos ativos e arquivados com tudo o que pende deles

**C4** - Cronômetro, sessões, e-mail, nome e Admin ficam fora (BKP-03, AC 6)
Proof: run unit | ✓ tests/backup.test.ts > exportar > omite cronômetro, sessões e dados da conta

**C5** - Só os Ciclos do Usuário da sessão são exportados (BKP-04, AC 7)
Proof: run unit | ✓ tests/backup.test.ts > exportar > não inclui ciclos de outro usuário

**C6** - Sem sessão, `/api/backup` não entrega dados e leva a `/entrar` (BKP-04, AC 8)
Proof: walk - sem sessão, /api/backup redireciona para /entrar

**C7** - Sidebar e menu do celular têm o item "Backup" ligado a `/backup` (BKP-01, AC 1)
Proof: walk - Sidebar a 1440px e menu da conta a 390px levam a /backup

**C8** - A página mostra o título, o cartão Exportar com o texto e o botão, e o cartão Importar com o texto, o campo e o botão (BKP-01, AC 2; BKP-05, AC 1)
Proof: walk - /backup mostra os dois cartões com os textos da spec

**C9** - "Importar backup" sem arquivo mostra "Escolha um arquivo." e não muda nada (BKP-05, AC 2)
Proof: walk - Importar backup sem arquivo mostra Escolha um arquivo.

**C10** - Conta sem Ciclos importa sem confirmação; conta com N Ciclos abre "Substituir seus dados?" com o texto e os botões (BKP-06, AC 3 e 4)
Proof: walk - conta vazia importa direto; conta com 2 Ciclos mostra o AlertDialog com "Os 2 ciclos desta conta"

**C11** - "Cancelar" fecha o diálogo e não altera nada (BKP-06, AC 5)
Proof: walk - Cancelar fecha o diálogo e os Ciclos continuam na Sidebar

**C12** - Importar substitui todos os Ciclos e devolve a quantidade do arquivo (BKP-07, AC 6)
Proof: run unit | ✓ tests/backup.test.ts > importar > substitui os ciclos da conta pelos do arquivo

**C13** - Depois da importação aparece "Backup importado: N ciclos." e a Sidebar mostra os Ciclos importados (BKP-07, AC 7)
Proof: walk - aviso Backup importado: 2 ciclos. e a Sidebar com os Ciclos do arquivo

**C14** - Cartões e log são recalculados dos Registros, ignorando os do arquivo (BKP-08, AC 8)
Proof: run unit | ✓ tests/backup.test.ts > importar > recalcula os cartões ignorando os do arquivo

**C15** - Ciclo arquivado volta arquivado, com a mesma data (BKP-07, AC 9)
Proof: run unit | ✓ tests/backup.test.ts > importar > mantém ciclos arquivados com a mesma data

**C16** - A importação grava só na conta da sessão (BKP-07, AC 10)
Proof: run unit | ✓ tests/backup.test.ts > importar > não toca os ciclos de outro usuário

**C17** - Arquivo inválido (JSON quebrado, formato errado, campo faltando, tipo inválido, referência quebrada) é recusado com a mensagem e a conta fica intacta (BKP-09, AC 1)
Proof: run unit | ✓ tests/backup.test.ts > recusar > recusa arquivo inválido sem alterar a conta

**C18** - Versão diferente de 1 é recusada com "Versão de backup desconhecida: 2." (BKP-09, AC 2)
Proof: run unit | ✓ tests/backup.test.ts > recusar > recusa versão desconhecida

**C19** - Arquivo com mais de 50 MB é recusado com "O arquivo passa de 50 MB." (BKP-09, AC 3)
Proof: run unit | ✓ tests/backup.test.ts > recusar > recusa arquivo acima de 50 MB

**C20** - Cronômetro ativo recusa com "Pare ou descarte o cronômetro antes de importar." (BKP-10, AC 4)
Proof: run unit | ✓ tests/backup.test.ts > recusar > recusa com cronômetro ativo

**C21** - Falha no meio da gravação desfaz tudo (BKP-10, AC 5)
Proof: run unit | ✓ tests/backup.test.ts > recusar > desfaz tudo quando a gravação falha no meio

**C22** - Importar sem sessão não altera nada (BKP-10, AC 6)
Proof: walk - POST da action sem cookie é redirecionado para /entrar pelo proxy

**C23** - Exportar A, importar em B e exportar B dá o mesmo arquivo, sem ids e sem `exportadoEm` (BKP-11, AC 1)
Proof: run unit | ✓ tests/backup.test.ts > ida e volta > reexportar dá o mesmo arquivo

**C24** - Depois de importar, Volta, progresso, Horas extras, totais das Estatísticas e próximas revisões são os da origem (BKP-11, AC 2)
Proof: run unit | ✓ tests/backup.test.ts > ida e volta > reproduz voltas, progresso, estatísticas e revisões

**C25** - Arquivo com lista de Ciclos vazia esvazia a conta e conta 0 (Edge Case 1)
Proof: run unit | ✓ tests/backup.test.ts > importar > lista vazia esvazia a conta

**C26** - O mesmo arquivo importado duas vezes deixa os Ciclos uma vez só (Edge Case 2)
Proof: run unit | ✓ tests/backup.test.ts > importar > importar duas vezes não duplica

**C27** - Registro sem Tópico nem conteúdo livre é importado (Edge Case 3)
Proof: run unit | ✓ tests/backup.test.ts > importar > aceita registro sem tópico nem conteúdo livre

---

## Handoff

**Settled mid-build:** none. Textos de N = 1 no aviso ("Backup importado: 1 ciclo.") e no diálogo ("O ciclo desta conta... será apagado") ajustados na spec por concordância. O `file-upload` do BoardUI simula o envio com progresso falso e textos em inglês; o campo usa `<input type="file">` oculto e o `Button` "Escolher arquivo". Os limites de 50 MB foram para `src/dominio.ts`, para o cliente usar sem puxar o banco.
**Dispatched:** none
**Walked:** none
