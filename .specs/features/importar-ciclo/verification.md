# Importar ciclo verification

**Verdict**: FAIL (round 1); achados fechados em 36f7948, round 2 em proofs.md
**Proofs**: `proofs.md` at 6799eac
**Verifier**: independent sub-agent (author != verifier)

## Checks

| Check | Test | Holds |
| --- | --- | --- |
| C1 | walk - /ciclos/novo mostra o cartão Importar ciclo com os textos da spec | yes - os textos e o `accept` estão em `src/app/importar-ciclo.tsx:33-71` como o walk relata |
| C2 | walk - Importar ciclo sem arquivo mostra Escolha um arquivo. | yes - cliente (`importar-ciclo.tsx:18`) e action (`acoes-ciclos.ts:84`) |
| C3 | walk - importar o exemplo leva a /ciclos/{id} do Ciclo "TRF 5 - Analista Judiciário" | yes |
| C4 | `importar-ciclo.test.ts` `cria o ciclo com matérias, etapas e tópicos do arquivo` | yes - nome, carga e posição das Etapas, Tópicos em ordem e `estudado` false |
| C5 | `importar-ciclo.test.ts` `deixa dificuldade e questões da prova sem valor quando ausentes` | yes - ausente e `null` |
| C6 | `importar-ciclo.test.ts` `abre o ciclo na volta 1 sem registros e com faixas padrão` | yes |
| C7 | `importar-ciclo.test.ts` `mantém os ciclos que o usuário já tinha` | no - só um Ciclo ativo; o critério (AC 8) inclui os arquivados e nenhum é montado |
| C8 | `importar-ciclo.test.ts` `grava só na conta do usuário da sessão` | yes |
| C9 | `importar-ciclo.test.ts` `desfaz tudo quando a gravação falha no meio` | yes - trigger na última inserção (tópicos) e contagem igual à de antes |
| C10 | walk - POST da action em /ciclos/novo sem cookie é redirecionado para /entrar | yes - `exigirUsuario()` antes de ler o arquivo (`acoes-ciclos.ts:81`) |
| C11 | `importar-ciclo.test.ts` `recusa tamanho antes de JSON sem criar nada` | yes - 1 MB + 1 byte de não-JSON |
| C12 | `importar-ciclo.test.ts` `aceita arquivo de exatamente 1 MB` | yes - mutação `>=` falha o teste |
| C13 | `importar-ciclo.test.ts` `recusa arquivo que não é JSON sem criar nada` | yes |
| C14 | `importar-ciclo.test.ts` `recusa raiz que não é objeto sem criar nada` | yes - só lista; `null` e texto na raiz também recusam (sonda) |
| C15 | `importar-ciclo.test.ts` `recusa formato do backup sem criar nada` | yes |
| C16 | `importar-ciclo.test.ts` `recusa versão desconhecida sem criar nada` | yes - mas veja o achado sobre `"versao": "1"` |
| C17 | `importar-ciclo.test.ts` `recusa nome ausente sem criar nada` | yes |
| C18 | `importar-ciclo.test.ts` `recusa nome vazio sem criar nada` | yes |
| C19 | `importar-ciclo.test.ts` `recusa materias que não é lista sem criar nada` | yes |
| C20 | `importar-ciclo.test.ts` `recusa etapas ausente sem criar nada` | yes |
| C21 | `importar-ciclo.test.ts` `recusa matéria sem nome sem criar nada` | yes |
| C22 | `importar-ciclo.test.ts` `recusa matéria repetida sem criar nada` | yes |
| C23 | `importar-ciclo.test.ts` `recusa dificuldade inválida sem criar nada` | yes |
| C24 | `importar-ciclo.test.ts` `recusa questões da prova fora do limite sem criar nada` | yes - os limites 1 e 10.000 aceitos são provados em `sugestao-de-ciclo.test.ts:107` (mesma função) |
| C25 | `importar-ciclo.test.ts` `recusa questões da prova fracionárias sem criar nada` | yes |
| C26 | `importar-ciclo.test.ts` `recusa tópico vazio sem criar nada` | yes |
| C27 | `importar-ciclo.test.ts` `recusa tópico longo demais sem criar nada` | no - só 121 recusado; 120 aceito não é afirmado: as mutações `>= nomeMaximo` e `limpo.length` (UTF-16) passam a suíte |
| C28 | `importar-ciclo.test.ts` `recusa tópico repetido sem criar nada` | yes |
| C29 | `importar-ciclo.test.ts` `recusa matéria sem etapa nem tópico sem criar nada` | yes - remover a regra falha o teste |
| C30 | `importar-ciclo.test.ts` `recusa etapa com matéria desconhecida sem criar nada` | yes |
| C31 | `importar-ciclo.test.ts` `recusa carga zero sem criar nada` | no - carga 1 aceita não é afirmada: a mutação `< 2` passa a suíte |
| C32 | `importar-ciclo.test.ts` `recusa carga acima do limite sem criar nada` | no - 600.000 aceito não é afirmado: a mutação `>= CARGA_MAXIMA_MINUTOS` passa a suíte |
| C33 | `importar-ciclo.test.ts` `recusa mais de 50 matérias sem criar nada` | no - 50 aceitas não é afirmado: a mutação `>=` passa a suíte |
| C34 | `importar-ciclo.test.ts` `recusa mais de 200 etapas sem criar nada` | no - 200 aceitas não é afirmado: a mutação `>=` passa a suíte |
| C35 | `importar-ciclo.test.ts` `recusa mais de 200 tópicos sem criar nada` | no - 200 aceitos não é afirmado: a mutação `>=` passa a suíte |
| C36 | `importar-ciclo.test.ts` `recusa vários problemas, mostra o primeiro sem criar nada` | yes - só nome contra Matéria e Etapa; veja o achado de ordem |
| C37 | `importar-ciclo.test.ts` `recusa matéria antes de etapa sem criar nada` | yes - para dificuldade; não cobre a regra "sem etapa nem tópico", que sai depois das Etapas |
| C38 | `importar-ciclo.test.ts` `ignora chaves que o formato não define` | yes |
| C39 | `instrucoes-para-ia.test.ts` `tem as seções que a IA precisa` | yes |
| C40 | `instrucoes-para-ia.test.ts` `o exemplo importa sem erro` | yes |
| C41 | `importar-ciclo.test.ts` `aceita listas vazias e cria o ciclo vazio` | yes |
| C42 | `importar-ciclo.test.ts` `importar duas vezes cria dois ciclos de mesmo nome` | yes |
| C43 | `importar-ciclo.test.ts` `cria matéria só com tópicos, sem etapa` | yes |
| C44 | `importar-ciclo.test.ts` `liga a etapa à matéria sem diferenciar maiúsculas e tira espaços das pontas` | yes |
| C45 | `importar-ciclo.test.ts` (round 2, autor) | yes - check novo que fecha um achado; provado em proofs.md |
| C46 | `importar-ciclo.test.ts` (round 2, autor) | yes - check novo que fecha um achado; provado em proofs.md |
| C47 | `importar-ciclo.test.ts` (round 2, autor) | yes - check novo que fecha um achado; provado em proofs.md |
| C48 | `importar-ciclo.test.ts` (round 2, autor) | yes - check novo que fecha um achado; provado em proofs.md |
| C49 | `importar-ciclo.test.ts` (round 2, autor) | yes - check novo que fecha um achado; provado em proofs.md |
| C50 | `importar-ciclo.test.ts` (round 2, autor) | yes - check novo que fecha um achado; provado em proofs.md |
| C51 | `importar-ciclo.test.ts` (round 2, autor) | yes - check novo que fecha um achado; provado em proofs.md |
| C52 | `importar-ciclo.test.ts` (round 2, autor) | yes - check novo que fecha um achado; provado em proofs.md |
| C53 | `importar-ciclo.test.ts` (round 2, autor) | yes - check novo que fecha um achado; provado em proofs.md |
| C54 | `importar-ciclo.test.ts` (round 2, autor) | yes - check novo que fecha um achado; provado em proofs.md |
| C55 | `importar-ciclo.test.ts` (round 2, autor) | yes - check novo que fecha um achado; provado em proofs.md |
| C56 | `importar-ciclo.test.ts` (round 2, autor) | yes - check novo que fecha um achado; provado em proofs.md |
| C57 | `importar-ciclo.test.ts` (round 2, autor) | yes - check novo que fecha um achado; provado em proofs.md |
| C58 | `importar-ciclo.test.ts` (round 2, autor) | yes - check novo que fecha um achado; provado em proofs.md |
| C59 | walk (IMPC-09, autor, pedido do Usuário depois da verificação) | yes - seletor e botão no rodapé à direita, mesma altura de Escolher arquivo; ver **Walked:** na spec |
| C60 | walk (IMPC-09, autor, pedido do Usuário depois da verificação) | yes - Colar JSON troca o campo pela área; ver **Walked:** na spec |
| C61 | walk (IMPC-09, autor, pedido do Usuário depois da verificação) | yes - exemplo colado abre o Ciclo; ver **Walked:** na spec |
| C62 | walk (IMPC-09, autor, pedido do Usuário depois da verificação) | yes - mensagem da Etapa 3 sob a área; ver **Walked:** na spec |
| C63 | walk (IMPC-09, autor, pedido do Usuário depois da verificação) | yes - área vazia mostra Cole o JSON do ciclo.; ver **Walked:** na spec |
| C64 | walk (IMPC-09, autor, pedido do Usuário depois da verificação) | yes - arquivo inválido + colado válido importa; arquivo válido + lixo colado, de volta em Arquivo, importa; ver **Walked:** na spec |

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| A ordem do primeiro problema (AC 17: "Matérias em ordem, Etapas em ordem") não vale para a regra "sem etapa nem tópico" (AC 13): ela roda depois de todas as Etapas | `src/casos-de-uso/importar-ciclo.ts:93-94`. Sonda: `materias: [{nome:"A"}, {nome:"B", dificuldade:"x", topicos:["t"]}]` mostra `Matéria "B": dificuldade...` em vez de `Matéria "A": informe ao menos...`; `materias: [{nome:"A"}, {nome:"B",topicos:["t"]}]`, `etapas: [{materia:"B",cargaMinutos:0}]` mostra `Etapa 1: cargaMinutos...` antes do problema da Matéria A | decidir a ordem (pré-varrer os nomes das Etapas para recusar a Matéria vazia na sua vez, ou registrar na spec que essa regra sai por último) e cobrir com um caso em C37 |  36f7948 - C57, C58 |
| Nomes que o JS e o Postgres dobram diferente passam pela validação e estouram o índice único `lower(nome)`: erro do banco sem mensagem (a action relança, a tela quebra) em vez da recusa de AC 8/AC 12 | `importar-ciclo.ts:58,74` usam `toLowerCase()`; `src/db/schema.ts:82,113` usam `lower()`. Sonda: Matérias `"AΣ"` e `"aσ"` (sigma final) e Matérias `"İ"` e `"i"`, e os mesmos pares como Tópicos, dão `DrizzleQueryError` (nada é gravado; a transação desfaz) | comparar com a mesma dobra do banco, ou capturar a violação de `materia_ciclo_nome`/`topico_materia_nome` e recusar com a mensagem de repetida |  36f7948 - C53, C54 |
| Um texto com o caractere NUL (`\u0000`) em `nome`, no nome de Matéria ou de Tópico passa pela validação e o Postgres recusa a inserção: erro sem mensagem | sonda: `nome: "a\u0000b"` dá `DrizzleQueryError` no insert de `ciclo` (`importar-ciclo.ts:106`) | recusar ou limpar caracteres de controle na leitura |  36f7948 - C52 |
| `"versao": "1"` (texto) é recusado com "Versão de ciclo desconhecida: 1.", mensagem que o Usuário e a IA leem como se a versão 1 fosse desconhecida; sem `versao` sai "Versão de ciclo desconhecida: undefined." | `importar-ciclo.ts:46` usa `String(raiz.versao)`. Sondas `versao: "1"` e `versao` ausente | mostrar o valor como JSON (`"1"`) ou uma mensagem de tipo, e um caso de teste para versão em texto e ausente |  36f7948 - C55, C56 |
| Os testes de limite só provam o lado recusado; o lado aceito (50 Matérias, 200 Etapas, 200 Tópicos, Tópico de 120 caracteres contados por caractere, carga 1 e 600.000) nunca é afirmado | mutações em `importar-ciclo.ts:52,68,73,81,87` (`>` para `>=`, `< 1` para `< 2`, `[...limpo].length` para `limpo.length`) deixam as 40 provas verdes; as sondas mostram que o código atual aceita cada limite | um caso de aceite no limite exato por regra (C27, C31-C35), com um Tópico de 120 emojis para a contagem por caractere |  36f7948 - C45, C46, C47, C48, C49 |
| C7 não monta Ciclo arquivado, e AC 8 diz "ativos e arquivados" | `tests/importar-ciclo.test.ts:102-111` cria só um Ciclo ativo | arquivar um Ciclo antes de importar e afirmar que ele continua arquivado |  36f7948 - C7 |
| Regras no código que nenhum critério, check ou o documento cobrem: `topicos` que não é lista recusa com `Matéria "X": "topicos" precisa ser uma lista.`, e `topicos: null` é aceito como lista vazia (a spec diz "lista ... ou ausente"; o doc diz "lista de textos") | `importar-ciclo.ts:66-67`. Sondas: `topicos: "Crase"` recusa com a mensagem acima; `topicos: null` cria a Matéria | acrescentar o critério (e a linha no doc `docs/importar-ciclo-com-ia.md:38` e na regra 7) com um check, ou recusar `null` como a spec escreve |  36f7948 - C50, C51 (`null` agora recusa, como a spec escreve; IMPC-08 AC 1 e o doc cobrem a mensagem) |
