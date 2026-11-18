# Tópicos verification

**Verdict**: FAIL
**Proofs**: `proofs.md` at 76888d3
**Verifier**: independent sub-agent (author != verifier)

## Checks

| Check | Test | Holds |
| --- | --- | --- |
| C1 | `topicos.test.ts` `a Matéria devolve os Tópicos em ordem e o X de Y` + walk (link da Matéria) | yes - asserts order, 3/10 and 1/1 |
| C2 | walk (página de Matéria sem Tópicos) | yes - walked; no unit test, UI-only rule |
| C3 | `topicos.test.ts` `cria o Tópico no fim, sem espaços nas pontas` + walk | yes - trim, order, `estudado` false, 120 chars |
| C4 | `topicos.test.ts` `recusa nome vazio ou com mais de 120 caracteres` | yes - message, 121 and blank; rename with "" only asserts `ValidacaoError` (not the message) |
| C5 | `topicos.test.ts` `recusa nome repetido na Matéria e aceita em outra` | yes - "ia" vs "IA", other Matéria accepted |
| C6 | `topicos.test.ts` `renomeia mantendo posição, marca e Registros` + walk | yes - case-only, collision, position, mark, Registro count |
| C7 | `topicos.test.ts` `excluir o Tópico mantém os Registros sem conteúdo` + walk | yes - 2 Registros kept with null, 120 min kept; confirmation text is walk-only |
| C8 | `topicos.test.ts` `importa um Tópico por linha ignorando vazias e duplicadas` + walk | yes - 2/3, order, CRLF, re-import idempotent |
| C9 | `topicos.test.ts` `a importação recusa linha longa, excesso de linhas e lista vazia` | yes - line number 3, 201 vs 200 distinct, nothing written |
| C10 | `topicos.test.ts` `o Usuário marca e desmarca, mesmo com Registros` + walk | yes |
| C11 | `topicos.test.ts` `nada é lido nem gravado com ids de outro Usuário` + walk (404) | yes - all 6 operations and the other-Ciclo case |
| C12 | `topicos.test.ts` `duas criações simultâneas do mesmo nome gravam um só` | yes - one "ia", unique positions; does not assert the import result |
| C13 | walk (375/768/1440) | yes - walked |
| C14 | walk (breadcrumb) | yes - walked |
| C15 | browser `registrar-estudo.running.png` | yes - screen matches the capture's segment and Select (screens.md judges the rest) |
| C16 | walk (trocar Matéria limpa o Select) | yes - walked; the clear is client state with no unit test |
| C17 | walk (Matéria sem Tópicos) | yes - walked |
| C18 | `topicos.test.ts` `o Registro com Tópico grava o topicoId sem Conteúdo livre` | yes |
| C19 | `topicos.test.ts` `Conteúdo livre e Sem conteúdo gravam sem Tópico` + walk | yes at the use case; "switching discards the other" is only in `registrar`/the form (walk-only), see F3 |
| C20 | walk (salvar com "Tópico" vazio) | no - the rule lives in `src/app/acoes-estudo.ts` `registrar`, no test fails if it is removed; see F3 |
| C21 | `topicos.test.ts` `registrarEstudo recusa Tópico de outra Matéria, de outro Usuário e Tópico com Conteúdo livre` | yes - both messages, nothing written, Tópico unmarked |
| C22 | `topicos.test.ts` `o Registro com Tópico marca o Tópico como estudado` | no - proves the mark, not "na mesma transação"; no test forces a failure after the mark and checks both roll back; see F2 |
| C23 | browser `ciclo.running.png` | yes - column "Tópicos estudados", X/Y right, small Progress (screens.md judges the rest) |
| C24 | `topicos.test.ts` `o Ciclo traz estudados e total de Tópicos por Matéria` + walk | yes - 1/3, 0/0 for no Tópicos, 1/2 after delete + mark |
| C25 | `topicos.test.ts` `a Matéria com Tópicos não é descartada ao perder a última Etapa` | yes - kept, other deleted, returns with same id and Tópicos |

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| `registrarEstudo` with a Tópico races `excluirTopico` and answers with a raw FK error (500), no check names it | own example: 20 rounds of `Promise.allSettled([registrarEstudo(..., topicoId), excluirTopico(topicoId)])` gave 19 `DrizzleQueryError: Failed query: insert into "registro_de_estudo"` (FK violation). `registrarEstudo` locks only the Ciclo (`estudo.ts` ~L90) while `excluirTopico` locks the Matéria and deletes the Tópico between the existence check and the insert | in `registrarEstudo`, lock the Tópico (`for share`/`for update`) in the existence select, or map the FK violation to `ValidacaoError("Escolha um tópico desta matéria.")`; add a test with both calls concurrent | |
| C22 does not hold "mesma transação": nothing proves the Registro and the mark roll back together | `topicos.test.ts` `o Registro com Tópico marca o Tópico como estudado` asserts only the final mark. Own rollback example (future `dia`) rejected before the transaction opens, so it proves nothing about atomicity (Tópico stayed unmarked, 0 Registros, but via `validar`) | add a test that makes a step after the `update topico` fail (e.g. a failing `avaliarFechamentoDaVolta`/cronômetro delete) and asserts no Registro and the Tópico still unmarked | |
| "Escolha um tópico." (C20) and the segment-to-field mapping (C19: Conteúdo livre or Tópico dropped when the segment differs) live in `src/app/acoes-estudo.ts` `registrar` and `formulario-de-registro.tsx`, proven only by a walk | `acoes-estudo.ts` L25 `if (modo === "topico" && !texto(dados, "topicoId"))` and L35-36 `conteudoLivre: modo === "livre" ? ... : ""`, `topicoId: modo === "topico" ? ... : null`; no Vitest reaches them and the plan says these rules belong in `src/casos-de-uso` | move the rule to `registrarEstudo` (a `conteudo` mode or a null/empty `topicoId` check) or add a test of the action with a `FormData` per segment | |
| Name length counts UTF-16 units, not characters | own example: an import line of 100 emoji ("😀".repeat(100)) failed with "A linha 3 passa de 120 caracteres." (`topicos.ts` `.length` in `nomeValido` and `importarTopicos`); AC 4/9 say 120 characters | count with `[...nome].length` in both places and add a test | |
| The import notice changes the plan's text for 1 ("1 importado, 1 ignorado") and no check names it | `acoes-topicos.ts` `importarTopicosDaMateria` pluralizes; AC 8 fixes "N importados, M ignorados."; C8's walk only reads 2/3 | pick one: keep the plan's literal text or add the singular to AC 8 and a check | |
