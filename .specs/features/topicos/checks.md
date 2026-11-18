# Tópicos checks

Build: `npm run typecheck`; `npm run build`
Run unit: `npx vitest run tests/topicos.test.ts tests/formato.test.ts --reporter=verbose`
Plan: `.specs/features/topicos/plan.md`

25 checks in 3 slices · 2 one-way doors · 0 open

## Checks

### S1 - Manter os Tópicos de uma Matéria

**C1** - A Matéria devolve os Tópicos em ordem e o X de Y; o nome da Matéria no cartão abre `/ciclos/<id>/materias/<materiaId>` com "3 de 10 tópicos estudados" e "1 de 1 tópico estudado" (AC 1)
Proof: run unit | ✓ tests/topicos.test.ts > Tópicos > a Matéria devolve os Tópicos em ordem e o X de Y
Proof: walk - clicar no nome da Matéria no cartão do Ciclo e ver a página com "X de Y tópicos estudados" e o Progress

**C2** - Sem Tópicos a página mostra "Nenhum tópico ainda", "Novo tópico" e "Importar tópicos", sem Progress (AC 2)
Proof: walk - abrir a página de uma Matéria sem Tópicos

**C3** - Criar acrescenta ao fim, não estudado, e apara as pontas: "  IA  " grava "IA" (AC 3)
Proof: run unit | ✓ tests/topicos.test.ts > Tópicos > cria o Tópico no fim, sem espaços nas pontas
Proof: walk - usar "Novo tópico" e ver o Tópico no fim da lista

**C4** - Nome vazio ou com 121 caracteres é recusado com "O nome do tópico precisa ter de 1 a 120 caracteres." (AC 4)
Proof: run unit | ✓ tests/topicos.test.ts > Tópicos > recusa nome vazio ou com mais de 120 caracteres

**C5** - Nome repetido na Matéria sem diferenciar maiúsculas é recusado; o mesmo nome em outra Matéria é aceito (AC 5)
Proof: run unit | ✓ tests/topicos.test.ts > Tópicos > recusa nome repetido na Matéria e aceita em outra

**C6** - Renomear mantém posição, marca e Registros; só maiúsculas do próprio Tópico é aceito; colisão é recusada (AC 6)
Proof: run unit | ✓ tests/topicos.test.ts > Tópicos > renomeia mantendo posição, marca e Registros
Proof: walk - usar "Renomear" na lista e ver o nome trocado

**C7** - Excluir remove o Tópico e mantém os Registros sem vínculo (as horas da Matéria seguem 120 min); a confirmação traz "Excluir o tópico “<nome>”?" e, com N ≥ 1 Registros, "Os N registros de estudo dele continuam, sem conteúdo." (N = 1: "O registro de estudo dele continua, sem conteúdo.") (AC 7)
Proof: run unit | ✓ tests/topicos.test.ts > Tópicos > excluir o Tópico mantém os Registros sem conteúdo
Proof: walk - usar "Excluir" num Tópico com Registros e ler a confirmação

**C8** - Importar cria um Tópico por linha, em ordem, ignorando vazias e duplicadas: "IA\n\n ia \nRedes\nredes\nSO" com "SO" existente cria "IA" e "Redes", 3 ignorados (AC 8)
Proof: run unit | ✓ tests/topicos.test.ts > Tópicos > importa um Tópico por linha ignorando vazias e duplicadas
Proof: walk - colar o texto em "Importar tópicos" e ver "2 importados, 3 ignorados."

**C9** - Importar recusa tudo com linha de 121 caracteres ("A linha <n> passa de 120 caracteres."), com mais de 200 linhas distintas ("Importe no máximo 200 tópicos por vez.") e responde "Nada para importar." com lista vazia (AC 9)
Proof: run unit | ✓ tests/topicos.test.ts > Tópicos > a importação recusa linha longa, excesso de linhas e lista vazia

**C10** - Marcar e desmarcar grava a marca, também com Registros; um novo Registro marca de novo (AC 10)
Proof: run unit | ✓ tests/topicos.test.ts > Tópicos > o Usuário marca e desmarca, mesmo com Registros
Proof: walk - clicar o Checkbox e ver o X de Y mudar na mesma tela

**C11** - Ids de outro Usuário, ou Matéria de outro Ciclo, respondem "não encontrada" e não gravam (AC 11)
Proof: run unit | ✓ tests/topicos.test.ts > Tópicos > nada é lido nem gravado com ids de outro Usuário
Proof: walk - abrir `/ciclos/<outro ciclo>/materias/<matéria>` e ver 404

**C12** - Duas criações simultâneas do mesmo nome gravam um Tópico só, sem erro 500 (AC 12)
Proof: run unit | ✓ tests/topicos.test.ts > Tópicos > duas criações simultâneas do mesmo nome gravam um só

**C13** - A página da Matéria em 375px, 768px e 1440px rola na página, com Renomear e Excluir alcançáveis e sem rolagem horizontal (AC 13)
Proof: walk - abrir a página nos três tamanhos

**C14** - A página tem breadcrumb "Ciclos › <ciclo> › <matéria>" nos tokens BoardUI (AC 14)
Proof: walk - abrir a página e ver o breadcrumb

### S2 - Registrar estudo com Tópico, Conteúdo livre ou nenhum

**C15** - O modal mostra o Conteúdo como `.specs/features/topicos/captures/registrar-estudo.png`: segmento "Tópico / Conteúdo livre / Sem conteúdo" e Select com os Tópicos da Matéria, em ordem (AC 15)
Proof: browser - abrir Registrar estudo numa Matéria com Tópicos a 1440px, salvar `.specs/features/topicos/captures/registrar-estudo.running.png`

**C16** - Trocar a Matéria troca a lista do Select e limpa o Tópico escolhido (AC 16)
Proof: walk - escolher um Tópico, trocar a Matéria e ver o Select limpo com a lista nova

**C17** - Matéria sem Tópicos abre em "Conteúdo livre", com "Tópico" desabilitado e "Esta matéria ainda não tem tópicos." (AC 17)
Proof: walk - abrir o modal numa Matéria sem Tópicos

**C18** - Salvar com um Tópico grava o Registro com esse `topicoId` e sem Conteúdo livre (AC 18)
Proof: run unit | ✓ tests/topicos.test.ts > Tópicos > o Registro com Tópico grava o topicoId sem Conteúdo livre

**C19** - "Conteúdo livre" grava o texto sem Tópico (até 200 caracteres); "Sem conteúdo" grava sem Tópico e sem texto (AC 19)
Proof: run unit | ✓ tests/topicos.test.ts > Tópicos > Conteúdo livre e Sem conteúdo gravam sem Tópico
Proof: run unit | ✓ tests/formato.test.ts > Tópicos na interface > o segmento do Conteúdo grava só o campo do segmento escolhido
Proof: walk - alternar os segmentos e ver que o que estava no outro foi descartado

**C20** - Segmento "Tópico" sem Tópico escolhido recusa com "Escolha um tópico." sob o campo e não grava (AC 20)
Proof: run unit | ✓ tests/formato.test.ts > Tópicos na interface > o segmento do Conteúdo grava só o campo do segmento escolhido
Proof: walk - salvar com "Tópico" e nada escolhido e ver a mensagem sob o campo

**C21** - Tópico de outra Matéria ou de outro Usuário, ou Tópico e Conteúdo livre juntos, são recusados sem gravar (AC 21)
Proof: run unit | ✓ tests/topicos.test.ts > Tópicos > registrarEstudo recusa Tópico de outra Matéria, de outro Usuário e Tópico com Conteúdo livre

**C22** - Gravar um Registro com Tópico o marca como estudado; um Registro recusado não marca; Registro sem Tópico não muda nenhum; registrar e excluir o mesmo Tópico ao mesmo tempo nunca dá erro de banco (AC 22)
Proof: run unit | ✓ tests/topicos.test.ts > Tópicos > o Registro com Tópico marca o Tópico como estudado
Proof: run unit | ✓ tests/topicos.test.ts > Tópicos > registrar com Tópico e excluir o Tópico ao mesmo tempo nunca dá erro de banco

### S3 - "Tópicos estudados" no cartão do Ciclo

**C23** - O cartão Matérias mostra a coluna "Tópicos estudados" como `.specs/features/topicos/captures/ciclo.png` (AC 23)
Proof: browser - abrir `/ciclos/<id>` a 1440px, salvar `.specs/features/topicos/captures/ciclo.running.png`

**C24** - O "X/Y" conta todos os Tópicos da Matéria e muda ao marcar, importar, excluir ou registrar; Matéria sem Tópicos mostra "—" (AC 24)
Proof: run unit | ✓ tests/topicos.test.ts > Tópicos > o Ciclo traz estudados e total de Tópicos por Matéria
Proof: walk - ver "—" numa Matéria sem Tópicos no cartão

**C25** - Matéria com Tópicos sobrevive à remoção da última Etapa e volta com os mesmos Tópicos; sem Tópicos e sem Registros é apagada como hoje (AC 25)
Proof: run unit | ✓ tests/topicos.test.ts > Tópicos > a Matéria com Tópicos não é descartada ao perder a última Etapa

## Coverage

| Set (size) | Member -> proof | Unproven |
| --- | --- | --- |
| door 1: tabela `topico`, unique (materia, lower(nome)) (1) | C5 · C12 | - |
| door 2: `topico_id` on delete set null (1) | C7 | - |
| `GET /ciclos/[id]/materias/[materiaId]` statuses (3) | 200 C1 · 404 C11 · login redirect C11 | - |
| controls de S1 (7) | `Novo tópico` C3 · `Renomear` C6 · `Excluir` C7 · `Importar tópicos` C8 · `Checkbox` C10 · link da Matéria C1 · `Cancelar` dos diálogos C7 | - |
| controls do modal (4) | segmento C19 · Select de Tópico C16 · troca de Matéria C16 · `Salvar registro` C18 | - |
| importação, AC 8 (3 examples) | vazia C8 · duplicada na lista C8 · duplicada contra existente C8 | - |
| limites de nome, AC 4 (3) | vazio C4 · 120 C3 · 121 C4 | - |
| capturas (2) | registrar-estudo C15 · ciclo C23 | - |

## Swept

- validation: C4, C9, C20, C21
- failure modes: C9 (recusa tudo, nada gravado pela metade)
- idempotency: C8 (reimportar o mesmo texto ignora tudo), C12
- authorization: C11, C21
- concurrency: C12, C22
- data lifecycle: C7, C25
- dependency failure: n/a - nada externo é chamado
- state transitions: C10, C22
- observability: n/a - o plano não pede registro de log

## Handoff

- **Settled mid-build:** none
- **Dispatched:** Verifier e screens round 1 em `76888d3`, enviados juntos - returned; screens round 2 em `0f63ece`
- **Boundary:** C1-C25 closed at the commit of this handoff
- **Abandoned:** nada; o Postgres de desenvolvimento (porta 54330) não foi usado, a senha dele não é conhecida: o app rodou contra um Postgres descartável próprio
- **Walked:** app em `next dev` (porta 3100) contra Postgres 17 descartável, Chromium headless a 1440x960 (e 375/768 para C13). Cadastrei Marina Costa, criei o Ciclo "TRT 2ª Região — Analista" com Português, Direito Constitucional e TI, e: do cartão do Ciclo abri a página da Matéria TI pelo link (C1, C14); vi o estado vazio sem Progress (C2); criei "  Redes de computadores  " (C3), recusei "redes DE computadores" (C5), importei "IA / vazia / ia / Sistemas operacionais / redes de computadores" e li "2 importados, 2 ignorados." (C8), marquei e desmarquei o Checkbox e vi o X de Y mudar na tela (C10), renomeei IA (C6), abri nos três tamanhos sem rolagem horizontal e com Renomear/Excluir visíveis (C13) e abri o ciclo errado e li 404 (C11). No modal Registrar estudo: Matéria sem Tópicos abre em "Conteúdo livre", "Tópico" desabilitado e a dica (C17); a lista do Select na ordem (C15); trocar a Matéria limpou o Tópico (C16); salvar com "Tópico" vazio mostrou "Escolha um tópico." (C20); trocar de segmento descartou o texto (C19); salvar com Tópico gravou e o cartão do Ciclo passou a "1/3" em TI (C18, C22, C24). Excluir um Tópico com 1 Registro mostrou a confirmação e deixou o Registro sem vínculo (C7). `captures/registrar-estudo.running.png` e `captures/ciclo.running.png` salvos a 1440x960 (C15, C23). Fora do escopo e já existente: `lista-etapas.tsx` avisa no console de desenvolvimento sobre `aria-describedby` do dnd-kit (id de hidratação), sem relação com esta mudança.
