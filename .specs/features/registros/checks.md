# Registros checks

Build: `npm run typecheck`; `npm run build`
Run unit: `npx vitest run tests/registros.test.ts tests/estudo.test.ts --reporter=verbose`
Plan: `.specs/features/registros/plan.md`

36 checks in 5 slices · 0 one-way doors · 0 open

## Checks

### S1 - Histórico de Registros com filtro

**C1** - O item "Registros" da Sidebar e da barra de abas abre `/registros` com o título "Registros" e `aria-current="page"`; a barra de abas mantém o "+" central, Hoje e Estatísticas (AC 1)
Proof: walk - abrir Registros pela Sidebar (1440px) e pela barra de abas (375px)

**C2** - A lista vem do mais recente ao mais antigo, cada Registro com Matéria, Ciclo, Volta, tipo, duração, questões, acertos e conteúdo (Tópico, Conteúdo livre ou "—"); datas iguais: o criado por último primeiro (AC 2)
Proof: run unit | ✓ tests/registros.test.ts > histórico de registros > lista do mais recente ao mais antigo, com Matéria, Ciclo, Volta, Tópico e o total
Proof: run unit | ✓ tests/registros.test.ts > histórico de registros > de duas datas iguais mostra primeiro o criado por último
Proof: walk - ver a linha "70 min, 20 questões, 16 acertos, Tópico" como "1h10", "16/20 · 80%" e o nome do Tópico

**C3** - 25 por vez com "Carregar mais" (60 → 25, 50, 60 sem o botão; exatamente 25 sem o botão) (AC 3)
Proof: run unit | ✓ tests/registros.test.ts > histórico de registros > devolve 25 por vez e avisa quando há mais
Proof: run unit | ✓ tests/registros.test.ts > histórico de registros > com exatamente 25 registros não há mais
Proof: walk - com mais de 25 Registros, usar "Carregar mais" até o botão sumir

**C4** - "N registros" mostra o total do filtro atual, "1 registro" no singular (AC 4)
Proof: run unit | ✓ tests/registros.test.ts > histórico de registros > filtra por Ciclo e por Matéria, com o total do filtro
Proof: walk - ver "N registros" mudar ao filtrar

**C5** - O Ciclo escolhido lista só os Registros dele e as Matérias dele no filtro; a Matéria lista só a dela; trocar o Ciclo volta a "Todas as matérias"; "Matéria" fica desabilitada em "Todos os ciclos" (AC 5, 6, 7)
Proof: run unit | ✓ tests/registros.test.ts > histórico de registros > filtra por Ciclo e por Matéria, com o total do filtro
Proof: walk - escolher Ciclo e Matéria nos Selects e trocar o Ciclo

**C6** - Os filtros e o "Carregar mais" vivem na URL (`?ciclo=&materia=&limite=`); abrir a mesma URL mostra a mesma lista; mudar o filtro recomeça nos 25 primeiros (AC 8)
Proof: walk - filtrar, copiar a URL, abri-la em outra aba

**C7** - Sem Registros: "Nenhum registro de estudo ainda." sem tabela nem "Carregar mais"; filtro sem resultado: "Nenhum registro com este filtro." e "Limpar filtros" (AC 9)
Proof: walk - abrir com conta nova e depois filtrar sem resultado e usar "Limpar filtros"

**C8** - `ciclo` ou `materia` de outro Usuário, de outro Ciclo ou inexistente não mostra dado nenhum e responde 200 com "Nenhum registro com este filtro." (AC 10)
Proof: run unit | ✓ tests/registros.test.ts > histórico de registros > ids de outro Usuário ou inexistentes não mostram nada, e os Registros dele nunca aparecem
Proof: walk - abrir `/registros?ciclo=inexistente`

**C9** - Em 375px, 768px e 1440px a página rola na vertical sem rolagem horizontal, com "Editar" e "Excluir" alcançáveis em cada Registro (AC 11)
Proof: walk - abrir `/registros` nos três tamanhos

**C10** - A Volta de cada Registro é a que contém a data dele em (início, fim]: Volta 1 fechada em 10/11 às 15:00 → 10/11 é Volta 1, 11/11 Volta 2, 05/09 Volta 1 (AC 12)
Proof: run unit | ✓ tests/registros.test.ts > histórico de registros > a Volta do Registro é a que contém a data dele em (início, fim]

### S2 - Editar um Registro

**C11** - "Editar" abre o modal de `.specs/features/registros/captures/registrar-estudo.png`, com título "Editar registro", botão "Salvar", campos preenchidos e sem a linha do cronômetro, Nota da revisão e Próxima revisão estimada (AC 13)
Proof: browser - reach the state, save `captures/registrar-estudo.running.png`

**C12** - O segmento Conteúdo abre no que o Registro tem: Tópico, Conteúdo livre ou Sem conteúdo (AC 14)
Proof: walk - editar um Registro de cada tipo de conteúdo

**C13** - Salvar grava os valores novos, fecha o modal e mostra a linha atualizada na posição da nova data (60 → 90 min mostra "1h30") (AC 15)
Proof: run unit | ✓ tests/registros.test.ts > editar registro > grava os valores novos e a lista mostra a linha atualizada na posição da nova data
Proof: walk - editar a duração e ver "1h30" na linha

**C14** - Trocar a Matéria move o Registro, inclusive entre Ciclos, as horas mudam de Ciclo e o Tópico só vale se for da nova Matéria (AC 16)
Proof: run unit | ✓ tests/registros.test.ts > editar registro > trocar a Matéria move as horas para o outro Ciclo e só aceita Tópico da nova Matéria

**C15** - Tópico de outra Matéria, de outro Usuário ou Tópico com Conteúdo livre é recusado na edição, sem gravar (AC 17)
Proof: run unit | ✓ tests/registros.test.ts > editar registro > recusa Tópico de outro Usuário e Tópico com Conteúdo livre, sem gravar

**C16** - Acertos acima das questões ("20 e 21") e acertos sem questões são recusados na edição; "20 e 20" e "0 e 0" são aceitos (AC 18)
Proof: run unit | ✓ tests/registros.test.ts > editar registro > recusa acertos acima das questões e acertos sem questões

**C17** - Duração fora de 1 min a 24 h, data inválida ou futura, tipo inválido, Conteúdo livre acima de 200, anotação acima de 2000 e questões acima de 1000 são recusados com as mensagens do registro (AC 19)
Proof: run unit | ✓ tests/registros.test.ts > editar registro > recusa as mesmas entradas inválidas do registro e não grava

**C18** - Data igual mantém o instante original; dia passado vira meio-dia de Brasília; hoje vira o momento atual (AC 20)
Proof: run unit | ✓ tests/registros.test.ts > editar registro > mantém o instante se a data não muda, vira meio-dia no dia passado e o momento atual em hoje

**C19** - A edição que completa as Etapas da Volta aberta a fecha e abre a seguinte; a que reduz horas não fecha nem reabre Volta (AC 21)
Proof: run unit | ✓ tests/registros.test.ts > editar registro > a edição que completa as Etapas da Volta aberta a fecha; a que reduz horas não reabre nada

**C20** - Registro excluído, de outro Usuário ou com Matéria de outro Usuário é recusado como "não encontrado", sem gravar (AC 22)
Proof: run unit | ✓ tests/registros.test.ts > editar registro > recusa Registro excluído ou de outro Usuário sem gravar

**C21** - A edição marca o Tópico novo como estudado na mesma transação; o anterior fica como está; edição recusada não marca (AC 23)
Proof: run unit | ✓ tests/registros.test.ts > editar registro > marca o Tópico novo como estudado e deixa o anterior e as marcas manuais como estão

### S3 - Excluir um Registro

**C22** - "Excluir" abre o `AlertDialog` "Excluir este registro?" com "<duração> de <Matéria> em <dd/mm/aaaa>. As horas saem do progresso." e "Cancelar" e "Excluir" (AC 24)
Proof: walk - usar "Excluir" numa linha e ler o diálogo

**C23** - Confirmar remove o Registro, a linha some, "N registros" cai e as horas, questões e acertos saem dos totais (AC 25)
Proof: run unit | ✓ tests/registros.test.ts > excluir registro > remove o Registro e tira horas, questões e acertos dos totais, mantendo Tópico estudado e Cronômetro
Proof: walk - confirmar a exclusão e ver a linha sumir

**C24** - "Cancelar" ou fechar o diálogo não remove nada (AC 26)
Proof: walk - usar "Cancelar" e ver o Registro na lista

**C25** - Excluir mantém o Tópico estudado e o Cronômetro (AC 27)
Proof: run unit | ✓ tests/registros.test.ts > excluir registro > remove o Registro e tira horas, questões e acertos dos totais, mantendo Tópico estudado e Cronômetro

**C26** - Excluir Registro de Volta fechada não reabre a Volta, não muda número nem fim e não muda a Volta aberta (AC 28)
Proof: run unit | ✓ tests/registros.test.ts > excluir registro > excluir um Registro de Volta fechada não reabre a Volta nem muda a aberta

**C27** - Registro já excluído ou de outro Usuário é recusado e nada é apagado (AC 29)
Proof: run unit | ✓ tests/registros.test.ts > excluir registro > recusa Registro já excluído ou de outro Usuário e não apaga nada

### S4 - Registro retroativo

**C28** - Dia dentro de Volta fechada: o Registro fica nela, a aberta não ganha as horas, a fechada continua fechada; um dia depois do fechamento soma na aberta (AC 30)
Proof: run unit | ✓ tests/registros.test.ts > registro retroativo e Volta > um dia dentro de Volta fechada fica nela, não soma na aberta e não a reabre; um dia depois soma

**C29** - Dia passado dentro da Volta aberta soma ao progresso e, completando as Etapas, a fecha (AC 31)
Proof: run unit | ✓ tests/registros.test.ts > registro retroativo e Volta > um dia passado dentro da Volta aberta soma ao progresso e, completando as Etapas, a fecha

**C30** - Data futura é recusada ao registrar e ao editar (AC 32)
Proof: run unit | ✓ tests/registros.test.ts > registro retroativo e Volta > recusa data futura ao registrar e ao editar

**C31** - Acertos acima das questões são recusados ao registrar com data retroativa, sem gravar (AC 33)
Proof: run unit | ✓ tests/registros.test.ts > registro retroativo e Volta > recusa acertos acima das questões mesmo com data retroativa

### S5 - Progresso consistente

**C32** - Editar e excluir mudam a Hoje (Estudado hoje) e o progresso do Ciclo na próxima leitura (AC 34)
Proof: run unit | ✓ tests/registros.test.ts > progresso consistente > editar e excluir mudam a Hoje e o Ciclo na próxima leitura
Proof: walk - excluir um Registro de hoje e ver Hoje e o Ciclo

**C33** - Duas mudanças simultâneas no mesmo Registro ou entre dois Ciclos são serializadas na trava do Ciclo, sem erro e sem fechar a Volta duas vezes; a segunda sobre Registro excluído recusa como "não encontrado" (AC 35)
Proof: run unit | ✓ tests/registros.test.ts > progresso consistente > mudanças simultâneas no mesmo Registro e entre dois Ciclos não dão erro 500 nem fecham a Volta duas vezes

**C34** - O modal de edição aceita o mesmo Registro nas telas em 375px, 768px e 1440px (folha no celular) sem perder campos (AC 13)
Proof: walk - abrir "Editar" em 375px e 1440px

**C35** - `GET /registros` responde 200 ao Usuário logado e redireciona ao login sem sessão (Surface)
Proof: walk - abrir `/registros` sem sessão e ver o login

**C36** - O modal "Registrar estudo" da Hoje continua como antes: título "Registrar estudo" e botão "Salvar registro" (regressão do modal compartilhado)
Proof: run unit | ✓ tests/estudo.test.ts > registro de estudo e progresso da volta > soma as durações ao Progresso da matéria na Volta atual
Proof: walk - abrir "Registrar estudo" na Hoje

## Coverage

| Set (size) | Member -> proof | Unproven |
| --- | --- | --- |
| `GET /registros` statuses (2) | 200 C2 · redirect ao login C35 | - |
| validações do Registro na edição (8) | duração < 1 C17 · duração > 1440 C17 · data futura C17 · data inválida C17 · tipo C17 · conteúdo livre 201 C17 · anotação 2001 C17 · questões 1001 C17 | - |
| acertos x questões (3 exemplos) | 20/21 C16 · 20/20 C16 · 0/0 C16 | - |
| Volta do Registro, exemplos AC 12 (3) | 10/11 C10 · 11/11 C10 · 05/09 C10 | - |
| controles do modal de `registrar-estudo.png` na edição Matéria, segmento Conteúdo, Data, Duração, Tipo de estudo, Questões, Acertos, Anotação, Cancelar, Salvar (10) | Matéria C14 · segmento Conteúdo C12 · Data C18 · Duração C13 · Tipo de estudo C13 · Questões C16 · Acertos C16 · Anotação C13 · Cancelar C11 · Salvar C13 | - |
| controles da lista (Ciclo, Matéria, Limpar filtros, Carregar mais, Editar, Excluir, Cancelar, Excluir do diálogo) (8) | Ciclo C5 · Matéria C5 · Limpar filtros C7 · Carregar mais C3 · Editar C13 · Excluir C22 · Cancelar C24 · confirmar C23 | - |
| exemplos de Tópico AC 23 (3) | novo marcado C21 · anterior mantido C21 · recusa não marca C21 | - |

## Swept

- validation: C16, C17
- failure modes: C20, C27
- idempotency: C27 (excluir duas vezes)
- authorization: C8, C15, C20, C27
- concurrency: C33
- data lifecycle: C13, C21, C25
- dependency failure: n/a - sem chamada externa
- state transitions: C19, C26, C28
- observability: n/a - sem requisito de log neste slice

## Handoff

- **Settled mid-build:** none
- **Dispatched:** none
- **Boundary:** C1-C36 fechados em `HEAD` da branch `feat/issue-5`
- **Abandoned:** none
- **Walked:** app em `next dev` (porta 3100) contra Postgres 17 descartável (banco `reg`), Chromium headless. Cadastrei Marina Costa e semeei por SQL dois Ciclos (TRT 2ª Região — Analista com 31 Registros e uma Volta aberta; INSS Técnico com a Volta 1 fechada há 10 dias e a Volta 2 aberta), um Tópico estudado e um não. Pela Sidebar (1440px) abri Registros, com `aria-current` no item (C1); a barra de abas a 375px mostra Hoje, Registros, o "+" central e Estatísticas (C1); vi "1h10", "16/20 · 80%" e o Tópico na primeira linha (C2); "Carregar mais" levou de 25 a 32 linhas e sumiu (`?limite=50`) (C3); "N registros" muda com o filtro (C4); Ciclo e Matéria nos Selects, Matéria desabilitada em "Todos os ciclos", INSS mostrou "Volta 2,Volta 1" na coluna Volta (C5, C10); a URL guarda `ciclo` e `materia` (C6); `?ciclo=inexistente` mostrou "Nenhum registro com este filtro." e "Limpar filtros" voltou (C7, C8). Largura da página igual ao viewport (sem rolagem horizontal) em 375, 768, 1024, 1279, 1280 e 1440px, cartões abaixo de 1280px e tabela a partir dele, "Editar" e "Excluir" visíveis (C9). "Editar" abriu o modal com título "Editar registro", botão "Salvar", campos preenchidos e Conteúdo em "Tópico" (C11, C12); 21 acertos para 20 questões mostrou a mensagem de recusa; 30 min e 17 acertos salvaram, o modal fechou, o aviso "Registro salvo." apareceu e a linha ficou "1h30" e "17/20 · 85%" (C13, C16). "Excluir" mostrou "45min de Português em 17/11/2026. As horas saem do progresso."; "Cancelar" manteve 33 registros; confirmar deixou 32 e o aviso "Registro excluído." (C22, C23, C24); a Hoje mostrou Estudado hoje 1h30 depois da exclusão (C32). `/registros` sem sessão respondeu 307 para `/entrar` (C35). O modal "Registrar estudo" da Hoje seguiu com "Registrar estudo" e "Salvar registro" (C36). `captures/registrar-estudo.running.png` salvo a 1440x960 com o modal de edição aberto (C11). A folha do modal a 375px conferida em imagem (C34).
