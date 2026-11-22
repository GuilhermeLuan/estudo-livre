# Sugestão de ciclo checks

Build: `npx tsc --noEmit`
Run vitest: `npx vitest run tests/sugestao-de-ciclo.test.ts --reporter=verbose`
Plan: `.specs/features/sugestao-de-ciclo/plan.md`

26 checks in 2 slices · 2 one-way doors · 0 open, of which 0 block

## Checks

### S1 - Criar o ciclo já com Matérias e Etapas sugeridas

**C1** - `/ciclos/novo` abre com "Nome do ciclo", "Duração da etapa (h)" valendo "1", a tabela de Matérias sem linhas e o botão "Criar ciclo" (AC 1)
Proof: walk - abrir `/ciclos/novo` logado

**C2** - Digitar "Língua Portuguesa" em "Matéria" e usar "Adicionar matéria" acrescenta ao fim uma linha com "Questões" vazio e Dificuldade "Média" e limpa o campo; nome vazio não acrescenta e mostra "Informe o nome da matéria."; "Fácil", "Média" e "Difícil" são as opções de cada linha (AC 2, 9)
Proof: walk - adicionar "Língua Portuguesa", depois tentar com o campo vazio
Proof: run vitest | ✓ recusa nome de Matéria vazio, repetido ou lista cheia

**C3** - Nome já na tabela, sem diferenciar maiúsculas, é recusado com "A matéria “<nome digitado>” já está na lista." e não acrescenta linha: "estatística" com "Estatística" na lista → "A matéria “estatística” já está na lista." (AC 3)
Proof: walk - adicionar "Estatística" e depois "estatística"
Proof: run vitest | ✓ recusa nome de Matéria vazio, repetido ou lista cheia

**C4** - A lixeira de uma linha a remove, sem confirmação e sem gravar nada (AC 4)
Proof: walk - usar a lixeira de uma linha e conferir que a lista de Ciclos não ganhou nada

**C5** - Com 50 linhas, "Adicionar matéria" recusa com "A sugestão aceita até 50 matérias." (AC 5)
Proof: run vitest | ✓ recusa nome de Matéria vazio, repetido ou lista cheia
Proof: walk - adicionar 50 linhas e tentar a 51ª

**C6** - Sem linhas, "Criar ciclo" cria o Ciclo com a Volta 1 aberta, sem Matérias nem Etapas, e vai para `/ciclos/{id}`; "Visualizar ciclo" fica desabilitado (AC 6)
Proof: run vitest | ✓ sem Matérias cria o Ciclo vazio com a Volta 1 aberta
Proof: walk - criar com a tabela vazia

**C7** - "Questões" vazio, 0, negativo, decimal ou acima de 10.000 é recusado com "Informe as questões da prova (inteiro de 1 a 10.000)." e nada é gravado: 1 → aceito; 10.000 → aceito; 0 → recusado; "7,5" → recusado; 10.001 → recusado (AC 7)
Proof: run vitest | ✓ aceita Questões da prova de 1 a 10.000 e recusa o resto
Proof: run vitest | ✓ recusa Questões da prova inválidas no caso de uso sem gravar nada

**C8** - "Duração da etapa (h)" fora de zero a 10.000 horas é recusada com "A carga horária precisa ser maior que zero e no máximo 10.000 horas." sem gravar: "0,5" → Etapas de 30 minutos; "0" → recusado; "10000" → aceito; "10001" → recusado (AC 8)
Proof: run vitest | ✓ aceita duração da Etapa de 30 minutos a 10.000 horas e recusa o resto

**C9** - O peso de cada Matéria é Questões da prova × fator, com 1 para Fácil, 1,5 para Média e 2 para Difícil (AC 10)
Proof: run vitest | ✓ pesa a Matéria por questões vezes o fator da dificuldade

**C10** - O número de Etapas é peso ÷ menor peso, arredondado com meio para cima, no mínimo 1 e no máximo 8: peso 3 contra menor 2 → 2; peso 100 contra 5 → 8; uma só Matéria → 1; pesos iguais → o mesmo número (AC 11)
Proof: run vitest | ✓ dá peso dividido pelo menor peso em Etapas, arredondando meio para cima, entre 1 e 8

**C11** - As Etapas saem em rodadas, do maior peso para o menor, empate pela ordem digitada: a lista do print dá 23 Etapas na ordem TI, Língua Portuguesa, Estatística, Conhecimentos Bancários, Matemática, Atualidades, Inglês, … (AC 12)
Proof: run vitest | ✓ ordena as Etapas em rodadas do maior peso para o menor, empate pela ordem digitada

**C12** - "Visualizar ciclo" mostra as Etapas na ordem sugerida, cada uma com o nome da Matéria e a duração, e a carga total em horas, sem gravar nada (AC 13)
Proof: walk - preencher as sete matérias do print e usar "Visualizar ciclo"; conferir 23 Etapas, "23h" e nenhum Ciclo novo na lista

**C13** - "Voltar" na visualização mostra o formulário com nome, duração e linhas como estavam (AC 14)
Proof: walk - usar "Voltar" depois de "Visualizar ciclo"

**C14** - "Criar ciclo" cria numa só operação o Ciclo, a Volta 1 aberta, uma Matéria por linha com Dificuldade e Questões da prova, e as Etapas sugeridas com a duração informada nas posições 0 a N-1, e vai para `/ciclos/{id}`; as Etapas são as da visualização (AC 15)
Proof: run vitest | ✓ cria Ciclo, Volta 1, Matérias e Etapas sugeridas numa só operação
Proof: walk - criar o ciclo das sete matérias e conferir a página do Ciclo

**C15** - Se uma gravação falha, não ficam Ciclo, Matéria nem Etapa: nome de Matéria repetido chegando ao caso de uso é recusado com "A matéria “<nome>” já está na lista." e a contagem de Ciclos não muda (AC 16)
Proof: run vitest | ✓ não deixa nada criado quando uma gravação falha

**C16** - O caso de uso ignora Etapas enviadas pelo cliente e deriva as próprias (AC 17)
Proof: run vitest | ✓ ignora Etapas enviadas pelo cliente

**C17** - Nome do Ciclo vazio é recusado com "Informe o nome do ciclo." e nada é gravado, mesmo com linhas (AC 18)
Proof: run vitest | ✓ recusa o nome do Ciclo vazio mesmo com Matérias

**C18** - Enquanto envia, "Criar ciclo" fica desabilitado (AC 19)
Proof: walk - criar o ciclo e ver o botão desabilitado durante o envio

**C19** - A 1440px e a 390px a tabela é utilizável, sem rolagem horizontal da página, e "Visualizar ciclo" e "Criar ciclo" são alcançáveis com 50 linhas (AC 20)
Proof: walk - tabela com 50 linhas a 1440px e a 390px

**C20** - Sem sessão, `/ciclos/novo` redireciona para `/entrar` (Surface 307)
Proof: walk - abrir `/ciclos/novo` sem sessão

### S2 - Backup e cópia preservam os campos novos

**C21** - O backup exportado traz em cada Matéria `dificuldade` (`"facil"`, `"media"`, `"dificil"` ou `null`) e `questoesDaProva` (inteiro ou `null`) (AC S2.1)
Proof: run vitest | ✓ exporta dificuldade e questoesDaProva de cada Matéria

**C22** - Importar um backup exportado recria cada Matéria com os mesmos valores (AC S2.2)
Proof: run vitest | ✓ importa de volta Dificuldade e Questões da prova iguais

**C23** - Importar um backup versão 1 sem os dois campos importa normalmente, com os dois nulos (AC S2.3)
Proof: run vitest | ✓ importa backup antigo sem os campos com os dois nulos

**C24** - Dificuldade fora de `facil`, `media`, `dificil`, ou Questões da prova que não seja inteiro maior que zero, recusa o arquivo sem substituir nenhum Ciclo: `"dificil2"`, `0`, `2.5`, `"7"` → recusados; `null` → aceito (AC S2.4)
Proof: run vitest | ✓ recusa arquivo com Dificuldade ou Questões da prova inválidas sem substituir nada

**C25** - Copiar uma Matéria com Dificuldade cria a cópia com a mesma Dificuldade e Questões da prova nulo (AC S2.5)
Proof: run vitest | ✓ copiar Matéria leva a Dificuldade e não as Questões da prova

**C26** - A Matéria criada por "Adicionar etapa" nasce com Dificuldade e Questões da prova nulos (AC S2.6)
Proof: run vitest | ✓ Matéria criada por Etapa manual nasce sem Dificuldade nem Questões da prova

## Coverage

| Set (size) | Member -> proof | Unproven |
| --- | --- | --- |
| `/ciclos/novo` statuses (3) | `303` C14 · `200` com `{erro}` C7 · `307` sem sessão C20 | - |
| door 1: campos em `materia` (2) | `dificuldade` C14 · `questoes_da_prova` C14 | - |
| door 2: formato do backup (2 campos) | `dificuldade` C21 · `questoesDaProva` C21 | - |
| AC 7, Questões da prova (5 examples) | 1 C7 · 10.000 C7 · 0 C7 · "7,5" C7 · 10.001 C7 | - |
| AC 8, duração da Etapa (4 examples) | "0,5" C8 · "0" C8 · "10000" C8 · "10001" C8 | - |
| AC 11, Etapas por Matéria (4 examples) | 3 contra 2 C10 · 100 contra 5 C10 · uma só C10 · pesos iguais C10 | - |
| fatores de dificuldade (3) | Fácil C9 · Média C9 · Difícil C9 | - |
| AC S2.4, valores inválidos no arquivo (5) | `"dificil2"` C24 · `0` C24 · `2.5` C24 · `"7"` C24 · `null` C24 | - |
| controles da tela (6) | Adicionar matéria C2 · lixeira C4 · Visualizar ciclo C12 · Voltar C13 · Criar ciclo C14 · Dificuldade C2 | - |
| leitores do dado novo (3) | backup exporta C21 · backup importa C22 · copiar matéria C25 | - |

## Swept

- validation: C3, C5, C7, C8, C17, C24
- failure modes: C15
- idempotency: n/a - cada envio cria um Ciclo novo; o envio duplo é barrado pelo botão desabilitado (C18)
- authorization: C20; `criarCiclo` grava sempre no Usuário que chama, conferido em C14
- concurrency: n/a - o Ciclo novo não compartilha linha com outra operação; a unicidade de nome por Ciclo é conferida em C15
- data lifecycle: C22 (exportar, importar e os mesmos valores)
- dependency failure: n/a - sem chamada externa
- state transitions: n/a - nenhuma entidade muda de estado nesta funcionalidade
- observability: n/a - sem requisito de log

## Handoff

- **Settled mid-build:** none (C3 reescrito para dizer que a mensagem usa o nome digitado, como o `<nome>` do AC 3)
- **Dispatched:** none
- **Boundary:** none
- **Abandoned:** none
- **Walked:** none
