# Sugestão de ciclo verification

**Verdict**: FAIL
**Proofs**: `proofs.md` at 23db68b
**Verifier**: independent sub-agent (author != verifier)

## Checks

| Check | Test | Holds |
| --- | --- | --- |
| C1 | walk only - abrir `/ciclos/novo` logado (no test) | yes - the walk reaches the claim (labels, "1", empty table, button) |
| C2 | `sugestao-de-ciclo.test.ts` `recusa nome de Matéria vazio, repetido ou lista cheia` + walk | yes - exact messages on `erroDaNovaMateria`; the append, the cleared field and the "Média" default exist only in the walk, which names them |
| C3 | `sugestao-de-ciclo.test.ts` `recusa nome de Matéria vazio, repetido ou lista cheia` + walk | yes - asserts the message with the typed name "estatística" |
| C4 | walk only - lixeira, lista de Ciclos (no test) | yes - the walk reaches the claim |
| C5 | `sugestao-de-ciclo.test.ts` `recusa nome de Matéria vazio, repetido ou lista cheia` + walk | yes - 49 accepted, 50 refused; the use-case 51 cap is not tested (see findings) |
| C6 | `sugestao-de-ciclo.test.ts` `sem Matérias cria o Ciclo vazio com a Volta 1 aberta` + walk | yes - "Visualizar ciclo" disabled only in the walk |
| C7 | `sugestao-de-ciclo.test.ts` `aceita Questões da prova de 1 a 10.000 e recusa o resto` and `recusa Questões da prova inválidas no caso de uso sem gravar nada` | no - tests send numbers; the typed text ("7,5", empty, "10.000") goes through `questoesDe` in the TSX, which no test or walk reaches, and the message under the field is unproven |
| C8 | `sugestao-de-ciclo.test.ts` `aceita duração da Etapa de 30 minutos a 10.000 horas e recusa o resto` | no - the test passes minutes (30, 0, 600000, 601 * 60 minutes); "0,5" h to 30 min (`minutosDe` and `minutos` in the action) is never run, and there is no walk |
| C9 | `sugestao-de-ciclo.test.ts` `pesa a Matéria por questões vezes o fator da dificuldade` | yes |
| C10 | `sugestao-de-ciclo.test.ts` `dá peso dividido pelo menor peso em Etapas, arredondando meio para cima, entre 1 e 8` | yes - half-up on 1.5 and 2.5; the cap is only shown at 20 (the 7.5 and 8.5 edge is not asserted, though my own run holds) |
| C11 | `sugestao-de-ciclo.test.ts` `ordena as Etapas em rodadas do maior peso para o menor, empate pela ordem digitada` | yes - full 23-item order, ties 14/14 and 5/5 inside |
| C12 | walk only - sete matérias, 23 Etapas, "23h" (no test) | yes - the walk reaches the claim |
| C13 | walk only - "Voltar" (no test) | yes - the walk reaches the claim |
| C14 | `sugestao-de-ciclo.test.ts` `cria Ciclo, Volta 1, Matérias e Etapas sugeridas numa só operação` + walk | yes - the order is compared to `sugerirEtapas` itself (circular), but the 23 count, positions, duration and stored fields are asserted and C11 fixes the order; the Matéria order uses `localeCompare` against SQL `orderBy`, a collation risk |
| C15 | `sugestao-de-ciclo.test.ts` `não deixa nada criado quando uma gravação falha` | yes - the NUL-byte case fails inside the transaction and checks the four counts at zero; the duplicate case is validated before the transaction |
| C16 | `sugestao-de-ciclo.test.ts` `ignora Etapas enviadas pelo cliente` | yes |
| C17 | `sugestao-de-ciclo.test.ts` `recusa o nome do Ciclo vazio mesmo com Matérias` | yes |
| C18 | walk only - botão desabilitado durante o envio (no test) | yes - the walk reaches the claim, if the transient state was seen (`disabled={enviando}`) |
| C19 | walk only - 50 linhas a 1440px e 390px (no test) | yes - the walk reaches the claim |
| C20 | walk only - sem sessão (no test) | yes - the walk reaches the claim |
| C21 | `sugestao-de-ciclo.test.ts` `exporta dificuldade e questoesDaProva de cada Matéria` | yes - values and `null` for a manual Matéria |
| C22 | `sugestao-de-ciclo.test.ts` `importa de volta Dificuldade e Questões da prova iguais` | yes |
| C23 | `sugestao-de-ciclo.test.ts` `importa backup antigo sem os campos com os dois nulos` | yes |
| C24 | `sugestao-de-ciclo.test.ts` `recusa arquivo com Dificuldade ou Questões da prova inválidas sem substituir nada` | yes - four invalid values and `null` accepted, existing Ciclo kept |
| C25 | `sugestao-de-ciclo.test.ts` `copiar Matéria leva a Dificuldade e não as Questões da prova` | yes |
| C26 | `sugestao-de-ciclo.test.ts` `Matéria criada por Etapa manual nasce sem Dificuldade nem Questões da prova` | yes |

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| C7 proves the rule on numbers, not on what the user types, and has no walk | `questoesDe` in `src/app/sugestao-de-ciclo.tsx` turns text into a number (regex `^\d+$`) and no test calls it; the tests pass `7.5` as a number. A change to the regex ("7,5" or "10.000" accepted) leaves every proof green | move `questoesDe` to `src/dominio.ts` and assert "1", "10000", "0", "7,5", "", "10.001" with the field message, or add a walk for the field error | `58c4be6` - `questoesDeTexto` movida para o domínio; C7 agora também prova "7,5", "7.5", "10.000", vazio e letras, e tem walk com "7,5" |
| C8 never runs hours to minutes, the one conversion that makes "0,5" mean 30 minutes | the test passes `duracaoEtapaMinutos` directly; `minutosDe` (TSX) and `minutos` (`acoes-ciclos.ts`) are untested and the check has no walk. The sign, a missing `* 60` or the comma replace could break and stay green | export one hours-to-minutes function from the domain and test "0,5" → 30, "1,5" → 90, "0" → refused, "abc" → refused; or add a walk | `58c4be6` - `minutosDeHoras` no domínio, usada pela tela e pela action; C8 prova "0,5" → 30, "1.5" → 90, "0" e "abc" e tem walk |
| AC 8 is not enforced on an empty table (own example) | throwaway test: `criarCiclo(db, ana, { nome, duracaoEtapaMinutos: 0, materias: [] })` resolved with an id, and the action skips `minutos(dados)` when there are no Matérias; the plan says a duration of 0 or above 10.000 h is refused with no condition on rows | decide: refuse it in `criarCiclo` and the TSX when the duration is invalid even with no rows, or record the exception in the plan (AC 6 says "como hoje") | `58c4be6` - `questoesDeTexto` movida para o domínio; C7 agora também prova "7,5", "7.5", "10.000", vazio e letras, e tem walk com "7,5" |
| Backup refuses `questoesDaProva` above 10.000, which AC S2.4 does not name (own example) | throwaway test: a backup with `questoesDaProva: 10001` is refused; S2.4 says only "inteiro maior que zero" refuses. Stricter, and it guards the integer column, but it differs from the plan and no test pins it | add 10001 to C24's invalid values, or change the plan text to "1 a 10.000" | `58c4be6` - `minutosDeHoras` no domínio, usada pela tela e pela action; C8 prova "0,5" → 30, "1.5" → 90, "0" e "abc" e tem walk |
| C5 proves the 50 cap only at the add-row rule | the 51 Matérias use-case guard (`LISTA_CHEIA` in `materiasValidas`) has no test; my run showed it holds | add a `criarCiclo` call with 51 Matérias refused, nothing written | `58c4be6` - teste "recusa mais de 50 Matérias e aceita 50" em C5 |
| C10 asserts the cap at 20 only | the 8 boundary (7.5 → 8, 8.5 → 9 → 8) is not asserted; my run on 13, 15, 16, 17, 18 held | add a case with 8.5 and 7.5 against a minimum weight of 1 | `58c4be6` - C10 afirma as bordas 7, 7,5 e 8,5 contra o teto de 8 |
