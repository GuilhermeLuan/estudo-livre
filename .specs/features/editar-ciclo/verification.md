# Editar ciclo verification

**Verdict**: FAIL
**Proofs**: `proofs.md` at 25b1074
**Verifier**: independent sub-agent (author != verifier)

## Checks

| Check | Test | Holds |
| --- | --- | --- |
| C1 | walk - Ciclo ativo mostra o botão e o clique abre a edição; Ciclo arquivado não mostra o botão | yes |
| C2 | browser `captures/editar-ciclo.running.png` | not judged here - screens.md |
| C3 | `editar-ciclo.test.ts` `obterSugestaoDoCiclo > lista as Matérias com Etapa na ordem da primeira Etapa` | yes - a ordem esperada (TI, Português, Inglês) difere da ordem de inserção e da alfabética, e a Matéria sem Etapa fica fora |
| C4 | `editar-ciclo.test.ts` `obterSugestaoDoCiclo > Matéria criada à mão vem sem Questões nem Dificuldade` | no - prova os nulos no caso de uso; a linha com "Questões" vazio e "Média" que o critério fixa (`page.tsx:35`) não é provada por teste nem pelo walk |
| C5 | `editar-ciclo.test.ts` `duracaoDaEdicao > usa a gravada, senão a carga mais comum (empate a menor), senão 1h` | no - prova os minutos; o exemplo do critério "gravada 90 min → '1,5'" é a conversão em `page.tsx:34`, que nenhum teste nem o walk (só viu "1") exercita |
| C6 | walk - repetida, Questões "0" e "Visualizar ciclo" | no - o check cita "lista cheia" e o walk não a exercita; a borda "mais de 50 Matérias com Etapa" falha (ver Findings) |
| C7 | walk - o diálogo mostra "Gerar ciclo?", o texto, "Cancelar" e "Gerar ciclo" | yes |
| C8 | walk - depois de "Cancelar" o formulário segue como estava e a página do Ciclo mostra as mesmas Etapas | yes |
| C9 | `editar-ciclo.test.ts` `gerarEtapas > substitui as Etapas pelas sugeridas e grava nome, duração, Questões e Dificuldade` | yes - nomes na ordem de `sugerirEtapas`, posições 0..N-1, carga 90, Questões/Dificuldade de TI, Português e Inglês |
| C10 | `editar-ciclo.test.ts` `gerarEtapas > reaproveita a Matéria de mesmo nome com Registros e Tópicos` | yes - "português" minúsculo reaproveita o mesmo id; Cartões vêm com o Tópico (FK em `topico`) |
| C11 | `editar-ciclo.test.ts` `gerarEtapas > cria a Matéria nova com Questões e Dificuldade` | yes |
| C12 | `editar-ciclo.test.ts` `gerarEtapas > Matéria fora da lista perde as Etapas e só fica com Registro ou Tópico` | yes - cobre Registro, Tópico e nenhum dos dois |
| C13 | `editar-ciclo.test.ts` `gerarEtapas > mantém a Volta aberta e recalcula o progresso com as horas dela` | yes - Volta 2 igual (número e início), [60, 60] e 60 extra |
| C14 | `editar-ciclo.test.ts` `gerarEtapas > fecha a Volta quando todas as novas Etapas ficam completas` | yes no caso de uso; o redirecionamento com `?volta-concluida=N` de `gerarCiclo` (`acoes-ciclos.ts:89`) não é provado (ver Findings) |
| C15 | `editar-ciclo.test.ts` `gerarEtapas > recusa a lista vazia sem mudar nada` | yes - mensagem exata, Etapas e nome iguais |
| C16 | `editar-ciclo.test.ts` `gerarEtapas > recusa Matéria repetida sem mudar as Etapas` | yes, mas frouxo - na falha real (byte nulo) nome e duração enviados são iguais aos gravados, então um `update(ciclo)` fora da transação passaria |
| C17 | `editar-ciclo.test.ts` `gerarEtapas > recusa Ciclo arquivado sem mudar nada` | yes - mensagem exata e Etapas iguais |
| C18 | `editar-ciclo.test.ts` `gerarEtapas > não lê nem gera Ciclo de outro Usuário` | yes |
| C19 | `editar-ciclo.test.ts` `gerarEtapas > ignora Etapas enviadas pelo cliente` | yes |
| C20 | `editar-ciclo.test.ts` `gerarEtapas > recusa o nome do Ciclo vazio` | yes - nome "  " e mensagem exata |
| C21 | walk - depois de confirmar, o botão "Gerar ciclo" fica desabilitado até a página do Ciclo abrir | yes |
| C22 | walk - a edição mostra a descrição sem a frase; `/ciclos/novo` continua com ela | yes |
| C23 | `editar-ciclo.test.ts` `criarCiclo > grava a duração da Etapa no Ciclo` | yes - "1,5" → 90, 45 e o padrão 60 |
| C24 | walk - a 390px sem rolagem horizontal e botões alcançáveis | yes |
| C28 | `editar-ciclo.test.ts` `gerarEtapas > gera com mais de 50 Matérias que já têm Etapa e só recusa acrescentar novas` | yes - checado pelo autor depois do achado; 52ª recusada sem mudar Etapas, 51 geradas |
| C25 | `editar-ciclo.test.ts` `backup > exporta duracaoEtapaMinutos` | yes - 90 e null |
| C26 | `editar-ciclo.test.ts` `backup > importa duracaoEtapaMinutos ou nulo quando ausente` | yes - valor e chave ausente (o `null` explícito não é testado; exemplo próprio passou) |
| C27 | `editar-ciclo.test.ts` `backup > recusa duracaoEtapaMinutos inválida sem substituir nada` | yes - 0, 2.5, "60", 600001 recusados e 600000 aceito |

Exemplos próprios em `HEAD` (teste descartável, não commitado):
- Ciclo com 51 Matérias com Etapa (via "Adicionar etapa"): `obterSugestaoDoCiclo` devolve as 51, e `gerarEtapas` com as mesmas 51 é recusado com "A sugestão aceita até 50 matérias." - falha a borda do spec.
- Matéria guardada sem Etapa (com Tópico) e acrescentada como "ATUALIDADES": reaproveitada com o mesmo id e recebe Etapas - passa.
- `duracaoDaEdicao(null, [45, 30])` → 30; `[90, 90, 30, 30, 120]` → 30; ida e volta minutos → texto em horas da página → `minutosDeHoras` exata para 1, 7, 25, 50, 59, 61, 89, 599.999 e 600.000 - passa.
- Importar `duracaoEtapaMinutos: null` explícito → nulo - passa.

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| Ciclo com mais de 50 Matérias com Etapa abre a edição com todas, mas "Gerar ciclo" é recusado mesmo sem acrescentar nenhuma; o spec (Edge Cases, EDIT-03) diz "só recusar acrescentar novas" | `src/casos-de-uso/ciclos.ts:114` (`materiasValidas` recusa `entrada.length > 50`), chamado por `gerarEtapas` em `ciclos.ts:201`; exemplo próprio com 51 Matérias devolve "A sugestão aceita até 50 matérias." | decidir: ou `gerarEtapas` aceita listas acima de 50 desde que não acrescentem Matérias novas ao Ciclo, com teste das 51; ou corrigir o spec com nova requirement (o usuário precisa remover linhas) e um check dela || d3260c3 - C28 |
| C6 cita "lista cheia" mas o walk não a exercita; nenhuma prova da recusa da 51ª linha na edição | `tasks.md` C6 Proof; `Walked:` não menciona 50 linhas | acrescentar ao walk (ou a um teste de `erroDaNovaMateria` com 50 existentes) a recusa "A sugestão aceita até 50 matérias." na edição || b348791 - C6 |
| A tela não é provada para Matéria sem Questões/Dificuldade: o critério fixa "Questões" vazio e "Média", o teste para nos nulos do caso de uso | `tests/editar-ciclo.test.ts:83-86`; mapeamento em `src/app/(app)/ciclos/[id]/editar/page.tsx:35` | extrair o mapeamento para uma função pura testada (null → "" e "media") ou walk num Ciclo com Etapa criada à mão mostrando campo vazio e "Média" || 03a5b90 - C4 |
| O exemplo do critério "gravada 90 min → '1,5'" não é provado; o teste só cobre minutos | `tests/editar-ciclo.test.ts:30`; conversão em `src/app/(app)/ciclos/[id]/editar/page.tsx:34`; walk só viu "1" | extrair a conversão minutos → texto em horas e testar 90 → "1,5", 60 → "1" (ou walk com duração 1,5) || 03a5b90 - C5 |
| O aviso depois de uma geração que fecha a Volta não é provado ponta a ponta: o walk abriu `?volta-concluida=1` à mão | `src/app/acoes-ciclos.ts:89` (`redirect` com `fechada`); `Walked:` item EDIT-14 | walk que gera Etapas já cumpridas pela tela e vê "Volta 1 concluída. A Volta 2 começou." em `/ciclos/{id}` || b348791 - C14 (walk) |
| A falha real no meio da transação (C16) não detecta `update(ciclo)` fora da transação, porque nome e duração enviados são os já gravados; C17/C18 também só conferem Etapas | `tests/editar-ciclo.test.ts:225-227` (nome "Banco", duração 60 iguais aos de `cicloSugerido`) | enviar nome e duração diferentes na chamada que falha e asserir que a linha de `ciclo` segue com "Banco" e 60 || 03a5b90 - C16 |
