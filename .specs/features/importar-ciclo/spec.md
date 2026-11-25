# Importar ciclo em JSON Specification

**Approved**: 2026-11-25 - user: "Aprovado, pode implementar."

## Problem Statement

Montar um Ciclo a partir de um edital hoje é digitação manual: cada Matéria, cada Etapa com sua carga e cada Tópico do conteúdo programático entram um a um. Uma IA lê o edital e monta essa estrutura em segundos, mas o app não tem por onde recebê-la; o backup (`/backup`) carrega o histórico inteiro e substitui todos os Ciclos (AD-032), então não serve para isso.

## Goals

- [ ] O Usuário cria um Ciclo completo (Matérias, Etapas e Tópicos) a partir de um arquivo JSON, sem apagar nada do que já tem.
- [ ] Uma IA que recebe `docs/importar-ciclo-com-ia.md` e um edital produz um JSON que o app aceita.
- [ ] Um JSON com erro é recusado com uma mensagem que diz onde está o erro, para o Usuário devolvê-la à IA.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Importar um Ciclo no formato do backup (com Voltas, Registros e revisões) | AD-039: formato enxuto, Ciclo nasce zerado |
| Aplicar a Sugestão de ciclo às Matérias do arquivo | AD-040: as Etapas vêm explícitas |
| Faixas de acerto e Mínimo de questões no arquivo | Não pedido; o Ciclo nasce com os padrões, editáveis depois |
| Importar Ciclo arquivado ou importar vários Ciclos num arquivo | Um arquivo, um Ciclo novo e ativo |
| Prévia antes de criar | AD-044 |
| Servir as instruções para IA pelo app, ou um link para elas na tela | AD-042: só no repositório |
| Exportar um Ciclo neste formato | Não pedido |
| Frame no Figma | Não há; a tela segue `docs/design-system.md`, atualizado no mesmo PR |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Formato | AD-039; esquema em "Formato do arquivo" abaixo | Decidido | y - AD-039 |
| Etapas | AD-040 | Decidido | y - AD-040 |
| Local e efeito | AD-041: `/ciclos/novo`, sempre soma | Decidido | y - AD-041 |
| Instruções | AD-042: `docs/importar-ciclo-com-ia.md` | Decidido | y - AD-042 |
| Mensagens de erro | AD-043: o primeiro problema, com o lugar | Decidido | y - AD-043 |
| Fluxo | AD-044: cria e abre | Decidido | y - AD-044 |
| Tamanho máximo do arquivo | 1 MB ("O arquivo passa de 1 MB.") | Um Ciclo com 50 Matérias × 200 Tópicos cabe com folga; o backup usa 50 MB porque leva histórico | y - aprovado com a spec |
| Como a Etapa aponta a Matéria | Pelo nome, sem diferenciar maiúsculas, como o app já compara nomes de Matéria | Uma IA escreve nomes com mais acerto do que ids | y - aprovado com a spec |
| Chaves desconhecidas no JSON | Ignoradas | IA costuma acrescentar comentários ou campos; recusar por isso só atrapalha | y - aprovado com a spec |
| Matéria sem Etapa e sem Tópico | Recusada ("Matéria "X": informe ao menos uma etapa ou um tópico.") | O app descarta essa Matéria (AD-008); criar e logo deixar uma Matéria vazia confunde | y - aprovado com a spec |
| Limites | Até 50 Matérias (o mesmo da Sugestão de ciclo), 200 Etapas, 200 Tópicos por Matéria (o da importação de Tópicos), nome do Tópico até 120 caracteres, carga de 1 a 600.000 minutos (10.000 h, a do app) | Reaproveita os limites que o app já tem; 200 Etapas cobre 50 Matérias × 4 | y - aprovado com a spec |
| Nome de Ciclo repetido | Permitido, como na criação manual | Nome de Ciclo não é único no app | y - fato do schema |
| Faixas, Mínimo, Tópico estudado | Padrões do app; Tópicos nascem não estudados, na ordem do arquivo | Ciclo novo, sem histórico | y - aprovado com a spec |

**Open questions:** none - todas resolvidas acima ou nas AD-039 a AD-044.

### Formato do arquivo

```json
{
  "formato": "estudo-livre-ciclo",
  "versao": 1,
  "nome": "TRF 5 - Analista Judiciário",
  "materias": [
    { "nome": "Português", "dificuldade": "media", "questoesDaProva": 15, "topicos": ["Crase", "Concordância verbal"] },
    { "nome": "Direito Constitucional", "dificuldade": "dificil", "questoesDaProva": 20 }
  ],
  "etapas": [
    { "materia": "Direito Constitucional", "cargaMinutos": 60 },
    { "materia": "Português", "cargaMinutos": 60 },
    { "materia": "Direito Constitucional", "cargaMinutos": 90 }
  ]
}
```

- `nome`: texto não vazio. `materias` e `etapas`: listas (podem ser vazias).
- Matéria: `nome` texto não vazio, único no arquivo sem diferenciar maiúsculas; `dificuldade` `"facil"`, `"media"`, `"dificil"` ou ausente/`null`; `questoesDaProva` inteiro de 1 a 10.000 ou ausente/`null`; `topicos` lista de textos não vazios, únicos na Matéria sem diferenciar maiúsculas, ou ausente.
- Etapa: `materia` igual ao nome de uma Matéria do arquivo; `cargaMinutos` inteiro de 1 a 600.000. A ordem da lista é a ordem do Ciclo.

---

## User Stories

### P1: Importar o ciclo ⭐ MVP

**User Story**: Como Usuário, quero carregar um JSON com a estrutura de um Ciclo para não digitar Matérias, Etapas e Tópicos um a um.

**Why P1**: É a funcionalidade.

**Acceptance Criteria**:

1. WHEN o Usuário abre `/ciclos/novo` THEN the system SHALL mostrar, além da criação manual, um cartão "Importar ciclo" com o texto "Crie um ciclo a partir de um arquivo JSON.", o botão "Escolher arquivo" que aceita `.json`, o nome do arquivo escolhido (ou "Nenhum arquivo escolhido") e o botão "Importar ciclo"
2. IF o Usuário usa "Importar ciclo" sem escolher arquivo THEN the system SHALL mostrar "Escolha um arquivo." sob o campo e não criar nada
3. WHEN o Usuário usa "Importar ciclo" com um arquivo válido THEN the system SHALL criar um Ciclo ativo com o `nome` do arquivo e levar o Usuário a `/ciclos/{id}` do Ciclo criado
4. WHEN o Ciclo é importado THEN the system SHALL criar uma Matéria por item de `materias`, com o nome, a Dificuldade e as Questões da prova do arquivo (sem valor quando ausentes)
5. WHEN o Ciclo é importado THEN the system SHALL criar uma Etapa por item de `etapas`, na ordem do arquivo, ligada à Matéria de mesmo nome (sem diferenciar maiúsculas) e com a carga `cargaMinutos`
6. WHEN o Ciclo é importado THEN the system SHALL criar os Tópicos de cada Matéria na ordem do arquivo, todos não estudados
7. WHEN o Ciclo é importado THEN the system SHALL abri-lo na Volta 1, sem Registros, com as Faixas de acerto e o Mínimo de questões padrão
8. The system SHALL manter intactos todos os Ciclos que o Usuário já tinha (ativos e arquivados) ao importar
9. The system SHALL criar o Ciclo, a Volta 1, as Matérias, as Etapas e os Tópicos numa única transação, só na conta do Usuário da sessão
10. IF quem pede a importação não tem sessão THEN the system SHALL recusar sem criar nada e levar à tela de entrar

**Independent Test**: Importar o exemplo de "Formato do arquivo" numa conta com um Ciclo e ver os dois Ciclos na Sidebar, com o novo mostrando 3 Etapas na ordem do arquivo e 2 Tópicos em Português.

---

### P1: Recusa que diz onde está o erro ⭐ MVP

**User Story**: Como Usuário, quero que um JSON errado seja recusado com uma mensagem que eu possa devolver à IA.

**Why P1**: O arquivo vem de uma IA e vai errar às vezes (AD-043).

**Acceptance Criteria** (cada recusa mostra a mensagem sob o campo, em `role="alert"`, e não cria nada):

1. IF o arquivo passa de 1 MB THEN the system SHALL recusar com "O arquivo passa de 1 MB."
2. IF o arquivo não é JSON THEN the system SHALL recusar com "O arquivo não é um JSON válido."
3. IF a raiz não é um objeto com `"formato": "estudo-livre-ciclo"` THEN the system SHALL recusar com "O arquivo não é um ciclo do Estudo Livre: falta "formato": "estudo-livre-ciclo"."
4. IF `versao` não é 1 THEN the system SHALL recusar com "Versão de ciclo desconhecida: <versao>."
5. IF `nome` falta ou é texto vazio THEN the system SHALL recusar com "Informe o nome do ciclo em "nome"."
6. IF `materias` ou `etapas` falta ou não é lista THEN the system SHALL recusar com ""materias" precisa ser uma lista." ou ""etapas" precisa ser uma lista."
7. IF uma Matéria (posição N, contando de 1) não tem `nome` de texto não vazio THEN the system SHALL recusar com "Matéria N: informe o nome."
8. IF duas Matérias têm o mesmo nome sem diferenciar maiúsculas THEN the system SHALL recusar com "Matéria "<nome>" aparece mais de uma vez."
9. IF a `dificuldade` de uma Matéria não é `"facil"`, `"media"`, `"dificil"`, `null` nem ausente THEN the system SHALL recusar com "Matéria "<nome>": dificuldade precisa ser "facil", "media" ou "dificil"."
10. IF `questoesDaProva` de uma Matéria não é inteiro de 1 a 10.000, `null` nem ausente THEN the system SHALL recusar com "Matéria "<nome>": questoesDaProva precisa ser um inteiro de 1 a 10.000."
11. IF um Tópico (posição N na Matéria) não é texto não vazio de até 120 caracteres THEN the system SHALL recusar com "Matéria "<nome>", tópico N: precisa ser um texto de 1 a 120 caracteres."
12. IF dois Tópicos da mesma Matéria têm o mesmo nome sem diferenciar maiúsculas THEN the system SHALL recusar com "Matéria "<nome>": o tópico "<tópico>" aparece mais de uma vez."
13. IF uma Matéria não tem Etapa nem Tópico THEN the system SHALL recusar com "Matéria "<nome>": informe ao menos uma etapa ou um tópico."
14. IF a Etapa N aponta um nome que não está em `materias` THEN the system SHALL recusar com "Etapa N: a matéria "<nome>" não está em materias."
15. IF `cargaMinutos` da Etapa N não é inteiro de 1 a 600.000 THEN the system SHALL recusar com "Etapa N: cargaMinutos precisa ser um inteiro de 1 a 600.000."
16. IF o arquivo passa de 50 Matérias, 200 Etapas ou 200 Tópicos numa Matéria THEN the system SHALL recusar com "O ciclo aceita até 50 matérias.", "O ciclo aceita até 200 etapas." ou "Matéria "<nome>": até 200 tópicos."
17. IF o arquivo tem mais de um problema THEN the system SHALL mostrar só o primeiro, na ordem: tamanho, JSON, formato, versão, nome, listas, Matérias em ordem (e seus Tópicos), Etapas em ordem
18. IF a gravação falha no meio THEN the system SHALL desfazer tudo e não deixar Ciclo parcial
19. The system SHALL ignorar chaves que o formato não define

**Independent Test**: Importar o exemplo com a terceira Etapa apontando "Direito Penal" e ler "Etapa 3: a matéria "Direito Penal" não está em materias.", sem Ciclo novo na Sidebar.

---

### P1: Instruções para a IA ⭐ MVP

**User Story**: Como Usuário, quero um documento que eu entregue à IA junto com o edital para ela gerar o JSON certo.

**Why P1**: Sem ele a IA inventa o formato.

**Acceptance Criteria**:

1. The system SHALL ter `docs/importar-ciclo-com-ia.md`, escrito para a IA ler, com: o objetivo, o esquema completo do formato (cada campo, tipo, obrigatório ou não, limites), as regras que causam recusa, o vocabulário (Ciclo, Matéria, Etapa, Tópico, Carga horária, Dificuldade, Questões da prova), como repartir a carga em Etapas, e a instrução de responder só com o JSON
2. The system SHALL ter em `docs/importar-ciclo-com-ia.md` um exemplo completo num bloco ```json que a importação aceita sem erro
3. The system SHALL ter em `docs/importar-ciclo-com-ia.md` um prompt pronto para o Usuário colar na conversa junto com o edital

**Independent Test**: Um teste extrai o bloco ```json do documento e o importa com sucesso.

---

## Edge Cases

- WHEN `materias` e `etapas` são listas vazias THEN the system SHALL criar o Ciclo vazio, como a criação manual sem Matérias
- WHEN o Usuário importa o mesmo arquivo duas vezes THEN the system SHALL criar dois Ciclos de mesmo nome
- WHEN uma Matéria tem Tópicos e nenhuma Etapa THEN the system SHALL criá-la sem Etapa
- WHEN uma Etapa escreve o nome da Matéria com outra caixa ("português") THEN the system SHALL ligá-la à Matéria "Português"
- WHEN os textos têm espaços nas pontas THEN the system SHALL gravá-los sem eles e comparar nomes sem eles

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| IMPC-01 | P1: Importar (cartão, sem arquivo) | Execute | Implementing |
| IMPC-02 | P1: Importar (cria e abre; Matérias, Etapas, Tópicos, Volta 1) | Execute | Implementing |
| IMPC-03 | P1: Importar (soma, transação, sessão) | Execute | Implementing |
| IMPC-04 | P1: Recusa (tamanho, JSON, formato, versão, nome, listas) | Execute | Implementing |
| IMPC-05 | P1: Recusa (Matérias e Tópicos) | Execute | Implementing |
| IMPC-06 | P1: Recusa (Etapas, limites, ordem, falha, chaves extras) | Execute | Implementing |
| IMPC-07 | P1: Instruções para a IA | Execute | Implementing |

**Coverage:** 7 total, 7 mapped to checks, 0 unmapped

---

## Sources

- Pedido do Usuário: "parecido com backup, quero uma funcionalidade de importar ciclo, esse import vai por um json. Além disso, quero um MD para instrucoes para IA como ela vai criar esse JSON."
- AD-039 a AD-044 em `.specs/STATE.md`
- Backup (`src/casos-de-uso/backup.ts`, `src/app/importar-backup.tsx`): padrão do campo de arquivo e da validação
- Sem frame no Figma: o cartão segue `docs/design-system.md` (entrada "Novo ciclo"), atualizado no mesmo PR

---

## Success Criteria

- [ ] O exemplo do documento importa e cria o Ciclo descrito.
- [ ] Nenhum arquivo recusado cria Ciclo, Matéria, Etapa ou Tópico.

---

## Execution Plan

Tarefas implícitas (3 passos, sem `tasks.md`):

1. Caso de uso `importarCiclo` e testes → files: `src/casos-de-uso/importar-ciclo.ts`, `src/casos-de-uso/index.ts`, `src/dominio.ts`, `tests/importar-ciclo.test.ts` → verify: run unit → commit: `feat(ciclos): importar ciclo a partir de um JSON` ✅
2. Instruções para a IA → files: `docs/importar-ciclo-com-ia.md`, `tests/instrucoes-para-ia.test.ts` → verify: run unit → commit: `docs(ciclos): instruções para a IA montar o JSON do ciclo` ✅
3. Cartão "Importar ciclo" em `/ciclos/novo` → files: `src/app/acoes-ciclos.ts`, `src/app/importar-ciclo.tsx`, `src/app/(app)/ciclos/novo/page.tsx`, `docs/design-system.md` → verify: build + walk → commit: `feat(ciclos): cartão importar ciclo na página novo ciclo` ✅

## Checks

**Build**: `npm run typecheck; npm run build`
**Run unit**: `TEST_DATABASE_URL=postgres://postgres:teste@localhost:54332/teste npx vitest run tests/importar-ciclo.test.ts tests/instrucoes-para-ia.test.ts --reporter=verbose`

**C1** - /ciclos/novo mostra o cartão "Importar ciclo" com o texto, "Escolher arquivo" (.json), "Nenhum arquivo escolhido" e "Importar ciclo" (IMPC-01, AC 1)
Proof: walk - /ciclos/novo mostra o cartão Importar ciclo com os textos da spec

**C2** - "Importar ciclo" sem arquivo mostra "Escolha um arquivo." e não cria nada (IMPC-01, AC 2)
Proof: walk - Importar ciclo sem arquivo mostra Escolha um arquivo.

**C3** - Arquivo válido cria um Ciclo ativo com o nome do arquivo e leva a /ciclos/{id} (IMPC-02, AC 3)
Proof: walk - importar o exemplo leva a /ciclos/{id} do Ciclo "TRF 5 - Analista Judiciário"

**C4** - Cria Matérias, Etapas na ordem com a carga, e Tópicos na ordem, não estudados (IMPC-02, AC 3 a 6)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > importar ciclo > cria o ciclo com matérias, etapas e tópicos do arquivo

**C5** - Dificuldade e Questões da prova ausentes ficam sem valor (IMPC-02, AC 4)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > importar ciclo > deixa dificuldade e questões da prova sem valor quando ausentes

**C6** - Ciclo nasce na Volta 1, sem Registros, com Faixas 60/75/90 e Mínimo 5 (IMPC-02, AC 7)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > importar ciclo > abre o ciclo na volta 1 sem registros e com faixas padrão

**C7** - Os Ciclos que o Usuário já tinha continuam (IMPC-03, AC 8)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > importar ciclo > mantém os ciclos que o usuário já tinha

**C8** - Grava só na conta da sessão (IMPC-03, AC 9)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > importar ciclo > grava só na conta do usuário da sessão

**C9** - Falha no meio da gravação desfaz tudo (IMPC-03, AC 9; IMPC-06, AC 18)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > recusar ciclo > desfaz tudo quando a gravação falha no meio

**C10** - Sem sessão, a importação é recusada e leva a /entrar (IMPC-03, AC 10)
Proof: walk - POST da action em /ciclos/novo sem cookie é redirecionado para /entrar

**C11** - Mais de 1 MB: "O arquivo passa de 1 MB.", e o limite vem antes do JSON (IMPC-04, AC 1)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa tamanho antes de JSON sem criar nada

**C12** - Exatamente 1 MB é aceito (IMPC-04, AC 1)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > recusar ciclo > aceita arquivo de exatamente 1 MB

**C13** - Não JSON: "O arquivo não é um JSON válido." (IMPC-04, AC 2)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa arquivo que não é JSON sem criar nada

**C14** - Raiz que não é objeto recusa com a mensagem de formato (IMPC-04, AC 3)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa raiz que não é objeto sem criar nada

**C15** - O formato do backup recusa com a mensagem de formato (IMPC-04, AC 3)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa formato do backup sem criar nada

**C16** - Versão 2: "Versão de ciclo desconhecida: 2." (IMPC-04, AC 4)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa versão desconhecida sem criar nada

**C17** - Nome ausente recusa com 'Informe o nome do ciclo em "nome".' (IMPC-04, AC 5)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa nome ausente sem criar nada

**C18** - Nome só com espaços recusa com a mesma mensagem (IMPC-04, AC 5)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa nome vazio sem criar nada

**C19** - "materias" que não é lista recusa (IMPC-04, AC 6)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa materias que não é lista sem criar nada

**C20** - "etapas" ausente recusa (IMPC-04, AC 6)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa etapas ausente sem criar nada

**C21** - Matéria sem nome: "Matéria 2: informe o nome." (IMPC-05, AC 7)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa matéria sem nome sem criar nada

**C22** - Matéria repetida em outra caixa recusa (IMPC-05, AC 8)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa matéria repetida sem criar nada

**C23** - Dificuldade fora de facil/media/dificil recusa (IMPC-05, AC 9)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa dificuldade inválida sem criar nada

**C24** - questoesDaProva 10.001 recusa (IMPC-05, AC 10)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa questões da prova fora do limite sem criar nada

**C25** - questoesDaProva fracionária recusa (IMPC-05, AC 10)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa questões da prova fracionárias sem criar nada

**C26** - Tópico vazio recusa com a posição (IMPC-05, AC 11)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa tópico vazio sem criar nada

**C27** - Tópico com 121 caracteres recusa (IMPC-05, AC 11)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa tópico longo demais sem criar nada

**C28** - Tópico repetido em outra caixa recusa (IMPC-05, AC 12)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa tópico repetido sem criar nada

**C29** - Matéria sem Etapa e sem Tópico recusa (IMPC-05, AC 13)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa matéria sem etapa nem tópico sem criar nada

**C30** - Etapa com Matéria desconhecida: 'Etapa 3: a matéria "Direito Penal" não está em materias.' (IMPC-06, AC 14)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa etapa com matéria desconhecida sem criar nada

**C31** - cargaMinutos 0 recusa (IMPC-06, AC 15)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa carga zero sem criar nada

**C32** - cargaMinutos 600.001 recusa (IMPC-06, AC 15)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa carga acima do limite sem criar nada

**C33** - 51 Matérias: "O ciclo aceita até 50 matérias." (IMPC-06, AC 16)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa mais de 50 matérias sem criar nada

**C34** - 201 Etapas: "O ciclo aceita até 200 etapas." (IMPC-06, AC 16)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa mais de 200 etapas sem criar nada

**C35** - 201 Tópicos: 'Matéria "Português": até 200 tópicos.' (IMPC-06, AC 16)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa mais de 200 tópicos sem criar nada

**C36** - Com vários problemas, só o primeiro aparece (nome antes de Matérias) (IMPC-06, AC 17)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa vários problemas, mostra o primeiro sem criar nada

**C37** - Matérias são conferidas antes das Etapas (IMPC-06, AC 17)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa matéria antes de etapa sem criar nada

**C38** - Chaves desconhecidas são ignoradas (IMPC-06, AC 19)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > importar ciclo > ignora chaves que o formato não define

**C39** - O documento tem objetivo, esquema, regras de recusa, vocabulário, repartição da carga, "só o JSON" e o prompt pronto (IMPC-07, AC 1 e 3)
Proof: run unit | ✓ tests/instrucoes-para-ia.test.ts > instruções para a IA > tem as seções que a IA precisa

**C40** - O exemplo do documento importa sem erro (IMPC-07, AC 2)
Proof: run unit | ✓ tests/instrucoes-para-ia.test.ts > instruções para a IA > o exemplo importa sem erro

**C41** - Listas vazias criam o Ciclo vazio (Edge Case 1)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > importar ciclo > aceita listas vazias e cria o ciclo vazio

**C42** - O mesmo arquivo duas vezes cria dois Ciclos (Edge Case 2)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > importar ciclo > importar duas vezes cria dois ciclos de mesmo nome

**C43** - Matéria só com Tópicos é criada sem Etapa (Edge Case 3)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > importar ciclo > cria matéria só com tópicos, sem etapa

**C44** - Etapa casa a Matéria sem diferenciar maiúsculas e os textos perdem os espaços das pontas (Edge Cases 4 e 5)
Proof: run unit | ✓ tests/importar-ciclo.test.ts > importar ciclo > liga a etapa à matéria sem diferenciar maiúsculas e tira espaços das pontas

---

## Handoff

**Settled mid-build:** none. Os testes rodam num Postgres dedicado (`docker run -d --name estudo-livre-teste-pinfish -e POSTGRES_PASSWORD=teste -e POSTGRES_DB=teste -p 54332:5432 postgres:17-alpine`): o container padrão `estudo-livre-teste-pg` é recriado por outras sessões no meio da execução e derrubava testes ao acaso.
**Dispatched:** none
**Walked:** `next start -H 0.0.0.0 -p 3120` com `DATABASE_URL=postgres://postgres:teste@localhost:54332/walk` (banco `walk` no container `estudo-livre-teste-pinfish`, migrações aplicadas) e `BETTER_AUTH_URL=http://100.83.47.57:3120` (tailnet; a 3100 estava ocupada). Cliques reais num Chromium headless (Playwright 1.49.1), 1440x960 tema claro e 390x844 com a classe `dark`; sessão por `POST /api/auth/sign-up/email` (`walk-<largura>-<timestamp>@exemplo.com`, senha `senha-de-teste-123`).
- C1: em /ciclos/novo, abaixo da criação manual, o cartão mostra "Importar ciclo", "Crie um ciclo a partir de um arquivo JSON.", "Arquivo do ciclo", "Escolher arquivo", "Nenhum arquivo escolhido" e "Importar ciclo"; o campo aceita `.json,application/json`.
- C2: "Importar ciclo" sem arquivo mostra "Escolha um arquivo." sob o campo.
- Recusa: o exemplo do documento com a 3ª Etapa em "Direito Penal" mostra "Etapa 3: a matéria "Direito Penal" não está em materias." e a página continua em /ciclos/novo.
- C3: o exemplo de `docs/importar-ciclo-com-ia.md` leva a /ciclos/{id}, com o título "TRF 5 - Analista Judiciário", 7 Etapas de 1h00 na ordem do arquivo, Volta 1, Matérias com 0/5, 0/4 e 0/2 Tópicos e Faixas padrão; a Sidebar mostra o Ciclo novo. Sem rolagem horizontal nas duas larguras.
- C10: `POST /ciclos/novo` com `Next-Action` e sem cookie responde 307 para /entrar.
