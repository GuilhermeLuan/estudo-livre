# Interface no BoardUI verification

**Verdict**: FAIL
**Proofs**: `proofs.md` at 30a75ec (HEAD is 85ec926; 53 pass, 7 fail = the 7 browser proofs C7 C15 C16 C25 C36 C42 C48 "not judged", awaiting the screens sub-agent)
**Verifier**: independent sub-agent (author != verifier)

## Checks

| Check | Test | Holds |
| --- | --- | --- |
| C1 | `! grep` on src/app + src/casos-de-uso (grep proof) | partial - grep catches old token/class use in those two dirs only (src/components, src/styles not scanned; my wider grep of `src` was clean) and does not check Inter at all; layout.tsx loads Inter, nothing asserts it renders |
| C2 | walk proof (no test) - walk proof: only needs the single `**Walked:**` line in checks.md, so it would NOT catch a false claim | no mechanical test - unproven by a mechanical test; judge only by the walk |
| C3 | walk proof (no test) - walk proof: only needs the single `**Walked:**` line in checks.md, so it would NOT catch a false claim | no mechanical test - unproven mechanically; the inline `<head>` script is a view-source claim a walk cannot falsify |
| C4 | walk proof (no test) - walk proof: only needs the single `**Walked:**` line in checks.md, so it would NOT catch a false claim | no mechanical test - unproven mechanically |
| C5 | walk proof (no test) - walk proof: only needs the single `**Walked:**` line in checks.md, so it would NOT catch a false claim | no mechanical test - unproven mechanically |
| C6 | walk proof (no test) - walk proof: only needs the single `**Walked:**` line in checks.md, so it would NOT catch a false claim | no mechanical test - unproven mechanically |
| C7 | browser proof - browser proof: a picture saved and judged by the screens sub-agent (`screens.md`, not yet judged at proofs HEAD); would catch a visual false claim only once judged | no mechanical test - deferred to screens |
| C8 | walk proof (no test) - walk proof: only needs the single `**Walked:**` line in checks.md, so it would NOT catch a false claim | no mechanical test - unproven mechanically |
| C9 | walk proof (no test) - walk proof: only needs the single `**Walked:**` line in checks.md, so it would NOT catch a false claim | no mechanical test - unproven mechanically |
| C10 | walk proof (no test) - walk proof: only needs the single `**Walked:**` line in checks.md, so it would NOT catch a false claim | no mechanical test - unproven mechanically |
| C11 | walk proof (no test) - walk proof: only needs the single `**Walked:**` line in checks.md, so it would NOT catch a false claim | no mechanical test - unproven mechanically |
| C12 | walk proof (no test) - walk proof: only needs the single `**Walked:**` line in checks.md, so it would NOT catch a false claim | no mechanical test - unproven mechanically |
| C13 | walk proof (no test) - walk proof: only needs the single `**Walked:**` line in checks.md, so it would NOT catch a false claim | no mechanical test - unproven mechanically |
| C14 | walk proof (no test) - walk proof: only needs the single `**Walked:**` line in checks.md, so it would NOT catch a false claim | no mechanical test - unproven mechanically |
| C15 | browser proof - browser proof: a picture saved and judged by the screens sub-agent (`screens.md`, not yet judged at proofs HEAD); would catch a visual false claim only once judged | no mechanical test - deferred to screens |
| C16 | browser proof - browser proof: a picture saved and judged by the screens sub-agent (`screens.md`, not yet judged at proofs HEAD); would catch a visual false claim only once judged | no mechanical test - deferred to screens |
| C17 | `tests/indicadores.test.ts` `Estudado hoje soma o dia em Brasília e dá a diferença contra ontem`, `um registro das 23h50 de ontem em Brasília não conta hoje`, `soma todos os Ciclos...` (+ `tests/formato.test.ts` `rótulos de chip`) | yes - asserts 70/+25, the 23h50 boundary, zero/null; my 00:10-today, negative diff (-25) and sum cases also held |
| C18 | `tests/indicadores.test.ts` `Questões hoje soma as questões e arredonda o acerto` (+ zero case in `soma todos os Ciclos...`) | yes - 20/16 -> 80, 3/2 -> 67, zero -> 0/null; my 10/8+30/15 -> 58 and 5/0 -> 0 held. The string `<n>% de acerto` is built in page.tsx and untested |
| C19 | `tests/indicadores.test.ts` `Nesta semana compara com a semana anterior inteira...`, `Nesta semana cai 50%...` | yes - Sunday boundary, two-weeks-back excluded, +12, -50, null; my Monday-00:00 inclusion (-20) held. Half-point rounding unprobed (see finding 1) |
| C20 | walk proof (no test) - walk proof: only needs the single `**Walked:**` line in checks.md, so it would NOT catch a false claim | no mechanical test - unproven mechanically |
| C21 | walk proof (no test) - walk proof: only needs the single `**Walked:**` line in checks.md, so it would NOT catch a false claim | no mechanical test - unproven mechanically |
| C22 | walk proof (no test) - walk proof: only needs the single `**Walked:**` line in checks.md, so it would NOT catch a false claim | no mechanical test - unproven mechanically |
| C23 | walk proof (no test) - walk proof: only needs the single `**Walked:**` line in checks.md, so it would NOT catch a false claim | no mechanical test - unproven mechanically |
| C24 | walk proof (no test) - walk proof: only needs the single `**Walked:**` line in checks.md, so it would NOT catch a false claim | no mechanical test - unproven mechanically |
| C25 | browser proof - browser proof: a picture saved and judged by the screens sub-agent (`screens.md`, not yet judged at proofs HEAD); would catch a visual false claim only once judged | no mechanical test - deferred to screens |
| C26 | `tests/volta-do-ciclo.test.ts` `cada Etapa traz o feito...`, `depois de fechar a Volta...`; `tests/formato.test.ts` `Volta 3 aberta em 2/11...` | partial - Volta line and extraMinutos are asserted; the header string "<n> etapas · <m> matérias · <carga>", "Faltam <tempo>" and the percent are built in `ciclos/[id]/page.tsx` with no test |
| C27 | `tests/formato.test.ts` `uma Situação por Etapa` | partial - all five Situações asserted on the function; which Etapa is the Próxima (`!concluida`, page.tsx) and the highlight are untested. My 59/60 -> Em andamento (Próxima etapa when proxima) and 61/60 -> Concluída held |
| C28 | walk proof (no test) - walk proof: only needs the single `**Walked:**` line in checks.md, so it would NOT catch a false claim | no mechanical test - unproven mechanically |
| C29 | walk proof (no test) - walk proof: only needs the single `**Walked:**` line in checks.md, so it would NOT catch a false claim | no mechanical test - unproven mechanically |
| C30 | walk proof (no test) - walk proof: only needs the single `**Walked:**` line in checks.md, so it would NOT catch a false claim | no mechanical test - unproven mechanically |
| C31 | walk proof (no test) - walk proof: only needs the single `**Walked:**` line in checks.md, so it would NOT catch a false claim | no mechanical test - unproven mechanically |
| C32 | `tests/volta-do-ciclo.test.ts` `cada Etapa traz o feito...` | no - asserts each Matéria's carga and feito only; "<n> etapa(s)" is computed in the UI and the < 1024px reorder is CSS, neither asserted |
| C33 | walk proof (no test) - walk proof: only needs the single `**Walked:**` line in checks.md, so it would NOT catch a false claim | no mechanical test - unproven mechanically |
| C34 | `tests/ciclos.test.ts` `um Usuário não vê nem altera Ciclos e Etapas de outro` | partial - asserts NaoEncontradoError from the use case; the `notFound()` mapping in page.tsx is untested (code reads correct) |
| C35 | walk proof (no test) - walk proof: only needs the single `**Walked:**` line in checks.md, so it would NOT catch a false claim | no mechanical test - unproven mechanically |
| C36 | browser proof - browser proof: a picture saved and judged by the screens sub-agent (`screens.md`, not yet judged at proofs HEAD); would catch a visual false claim only once judged | no mechanical test - deferred to screens |
| C37 | walk proof (no test) - walk proof: only needs the single `**Walked:**` line in checks.md, so it would NOT catch a false claim | no mechanical test - unproven mechanically |
| C38 | walk proof (no test) - walk proof: only needs the single `**Walked:**` line in checks.md, so it would NOT catch a false claim | no mechanical test - unproven mechanically; the 80% / dash rule is client code with no unit test (`percentualDeAcerto` is tested in `formato.test.ts` but the proof does not name it) |
| C39 | walk proof (no test) - walk proof: only needs the single `**Walked:**` line in checks.md, so it would NOT catch a false claim | no mechanical test - unproven mechanically |
| C40 | walk proof (no test) - walk proof: only needs the single `**Walked:**` line in checks.md, so it would NOT catch a false claim | no mechanical test - unproven mechanically |
| C41 | walk proof (no test) - walk proof: only needs the single `**Walked:**` line in checks.md, so it would NOT catch a false claim | no mechanical test - unproven mechanically |
| C42 | browser proof - browser proof: a picture saved and judged by the screens sub-agent (`screens.md`, not yet judged at proofs HEAD); would catch a visual false claim only once judged | no mechanical test - deferred to screens |
| C43 | walk proof (no test) - walk proof: only needs the single `**Walked:**` line in checks.md, so it would NOT catch a false claim | no mechanical test - unproven mechanically; existing `tests/estatisticas.test.ts` filter test covers the data side but is not the named proof |
| C44 | `tests/estatisticas.test.ts` `variação semanal > compara a semana atual com a anterior` and `semana atual zerada cai 100%...`; `tests/formato.test.ts` `variação arredondada...` | yes - +12, -100, null asserted; my Ciclo-filtered and Monday-boundary cases (-20) held. Half-point rounding unprobed (finding 1) |
| C45 | walk proof (no test) - walk proof: only needs the single `**Walked:**` line in checks.md, so it would NOT catch a false claim | no mechanical test - unproven mechanically |
| C46 | `tests/estatisticas.test.ts` `calcula o % de acerto por Matéria só com os registros que têm questões` | partial - asserts Direito (no questões) is absent from acertoPorMateria; its presence in horasPorMateria is asserted by other tests, not this one |
| C47 | walk proof (no test) - walk proof: only needs the single `**Walked:**` line in checks.md, so it would NOT catch a false claim | no mechanical test - unproven mechanically |
| C48 | browser proof - browser proof: a picture saved and judged by the screens sub-agent (`screens.md`, not yet judged at proofs HEAD); would catch a visual false claim only once judged | no mechanical test - deferred to screens |
| C49 | walk proof (no test) - walk proof: only needs the single `**Walked:**` line in checks.md, so it would NOT catch a false claim | no mechanical test - unproven mechanically |
| C50 | walk proof (no test) - walk proof: only needs the single `**Walked:**` line in checks.md, so it would NOT catch a false claim | no mechanical test - unproven mechanically |
| C51 | walk proof (no test) - walk proof: only needs the single `**Walked:**` line in checks.md, so it would NOT catch a false claim | no mechanical test - unproven mechanically |
| C52 | `test ! -e prototype` (shell proof) | yes - fails if the directory exists |
| C53 | `! grep -Ei "geist|disco do ciclo" docs/design-system.md` (grep proof) | partial - catches the two banned words only; the required content (tokens with both modes, type scale, components, 1024px) is not checked, so an empty doc would pass |
| C54 | `grep -q ig7Pq2uPxPWjeWuCKmTuBW AGENTS.md && grep -q "Figma vence" AGENTS.md` (grep proof) | yes - both literals required; stale-rule leftovers (old prototype pointer) not checked |

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| Half-point variation rounds asymmetrically: 70 vs 80 min gives "−12%" (−12.5) while +12.5 would give "+13%"; no test sits on a .5 | own throwaway test at HEAD: `variacaoPercentual(70,80)` -> -12; `Math.round` in `src/dominio.ts` rounds toward +inf. Affects AC19 and AC44 (Hoje and Estatísticas) | decide the rule (round half away from zero) and add a test on a .5 in both signs; or log -12 as intended | |
| C32's test does not hold its criterion: asserts carga/feito only | `tests/volta-do-ciclo.test.ts` first test; "<n> etapa(s)" counted in the UI, reorder is CSS | add the etapa count per Matéria to the use case and assert it, or give C32 a walk/browser proof | |
| C26 header, "Faltam" and percent strings are built in the page and no proof reaches them | `src/app/(app)/ciclos/[id]/page.tsx`; C26's proofs only name Volta line and `cada Etapa traz o feito` | move the header/faltam/percent formatting into `formato.ts` and test it, or add a walk | |
| C27: the Próxima etapa choice and highlight are untested | `situacaoDaEtapa` takes `proxima` as given; page.tsx computes it with `etapas.find(e => !concluida(e))` | cover it in a unit or walk that checks the highlighted row | |
| C1 proof does not check Inter and scans only src/app + src/casos-de-uso | grep in checks.md; `src/components` and `src/styles` unscanned (my wider grep was clean) | grep `src` and add a check that layout sets the Inter variable on body | |
| C53 grep passes an empty or incomplete design doc | only bans "geist" and "disco do ciclo" | add greps for the Claro suave hex `#ebebe8`, `1024px`, Sidebar, StatCard, EtapaRow | |
| C38 walk proof leaves the 80% / "—" rule with no test | `percentualDeAcerto` tested in `formato.test.ts` but the Acerto field's own client logic is only walked | name the `percentualDeAcerto` test in C38's proof, if the field calls it | |
| All walk proofs (C2-C6, C8-C14, C20-C24, C28-C31, C33, C35, C37-C41, C43, C45, C47, C49-C51) pass on one `**Walked:**` line | `check_proofs.py` accepts any walk when that line exists; none of these can fail | accepted by the method for UI; screens sub-agent and `screens.md` are the real check for the browser proofs (all 7 "not judged" at proofs HEAD) | |

Own examples (throwaway, deleted): AC17 (00:10 today counts, today 75 vs yesterday 100 -> -25 label "−25min"), AC18 (10/8 + 30/15 + yesterday's 5/0 -> 40 questões, 58%), AC19 (Monday 00:00 counts this week; 80 vs 100 -> -20), AC44 (same value with a Ciclo filter -> -20), AC26 ("1 de dezembro · há 9 dias", 23:30 yesterday vs 00:10 today -> "há 1 dia", same day -> "hoje"), AC27 (59/60 -> Em andamento / Próxima etapa, 61/60 -> Concluída). Only the half-point rounding in finding 1 is questionable; nothing broke.
