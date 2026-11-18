# Registros verification

**Verdict**: FAIL
**Proofs**: `proofs.md` at a50200b (HEAD is now 2ecace5: `fix(registros): linha separando o rodapé do modal`, touches `formulario-de-registro.tsx` and adds a `tests/zz-verif.test.ts`; proofs and pictures predate it)
**Verifier**: independent sub-agent (author != verifier)

## Checks

| Check | Test | Holds |
| --- | --- | --- |
| C1 | walk - not a test (Sidebar 1440px / barra de abas 375px) | yes - UI-only claim (`aria-current`, "+" central), walk-provable |
| C2 | `registros.test.ts` `lista do mais recente ao mais antigo, ...` + `de duas datas iguais mostra primeiro o criado por último`; walk for "1h10"/"16/20 · 80%" | yes - order, fields and tie-break asserted; formatting is walk-only |
| C3 | `registros.test.ts` `devolve 25 por vez e avisa quando há mais` + `com exatamente 25 registros não há mais` | yes - 25/50/60 and exactly 25 asserted at `listarRegistros`; the button itself is walk-only |
| C4 | `registros.test.ts` `filtra por Ciclo e por Matéria, com o total do filtro` | no - asserts totals 2 and 1 only; the singular "1 registro" text and the plural are formatted in the UI and only walked ("ver N registros mudar") |
| C5 | `registros.test.ts` `filtra por Ciclo e por Matéria, ...` (incl. Matéria de outro Ciclo = 0) | yes for the filter; "Matéria" disabled / reset on Ciclo change is walk-only |
| C6 | walk - not a test | yes - URL state is walk-provable (but see finding on `limite`) |
| C7 | walk - not a test | yes - empty and no-match states are walk-provable |
| C8 | `registros.test.ts` `ids de outro Usuário ou inexistentes não mostram nada, ...` | yes - other user's ciclo/materia and unknown id all give empty/0; the 200 is walk-only |
| C9 | walk - not a test (3 widths) | yes - layout claim, walk-provable |
| C10 | `registros.test.ts` `a Volta do Registro é a que contém a data dele em (início, fim]` | no - uses 10/11 12:00 against a 15:00 close, never the closing instant itself; flipping `<=`/`<` on either bound still passes (my own example below passes at HEAD, so the code is right, the test is loose) |
| C11 | browser - `registrar-estudo.running.png` (screens.md, not judged here) | n/a - screens sub-agent |
| C12 | walk - not a test | yes - walk-provable; note `RegistroParaEdicao` mode logic has no unit test |
| C13 | `registros.test.ts` `grava os valores novos e a lista mostra a linha atualizada na posição da nova data` | yes - fails if the position or any field is not updated; "1h30" text is walk-only |
| C14 | `registros.test.ts` `trocar a Matéria move as horas para o outro Ciclo e só aceita Tópico da nova Matéria` | yes - server side (hours move, foreign Tópico refused); "Tópico limpo" on Matéria change is modal state (`setTopicoId("")`) with no test |
| C15 | `registros.test.ts` `recusa Tópico de outro Usuário e Tópico com Conteúdo livre, sem gravar` | yes - both messages and unchanged duration asserted |
| C16 | `registros.test.ts` `recusa acertos acima das questões e acertos sem questões` | no - the two refusals never check "não gravar" (the later accepted `edit(20,20)`/`edit(0,0)` overwrite the row; only the final state is asserted) |
| C17 | `registros.test.ts` `recusa as mesmas entradas inválidas do registro e não grava` | yes - 8 cases with exact messages; unchanged duration asserted once. Accept-side bounds (1 min, 1440 min, 200 chars) not exercised here |
| C18 | `registros.test.ts` `mantém o instante se a data não muda, vira meio-dia no dia passado e o momento atual em hoje` | no (partial) - "hoje vira o momento atual" asserts only `>= antes`; any later instant today (e.g. 23:59) passes. The `dia` omitted branch is untested |
| C19 | `registros.test.ts` `a edição que completa as Etapas da Volta aberta a fecha; a que reduz horas não reabre nada` | yes - closure returns 1, Volta 2 open, reduced edit returns null and Voltas stay `[1 closed, 2 open]`; the toast text "Volta N fechada. Volta N+1 começou em <ciclo>." (acoes-registros.ts) has no test or walk |
| C20 | `registros.test.ts` `recusa Registro excluído ou de outro Usuário sem gravar` | yes - three cases, `NaoEncontradoError`, row unchanged; the page message string lives in `acoes-registros.ts`, untested |
| C21 | `registros.test.ts` `marca o Tópico novo como estudado e deixa o anterior e as marcas manuais como estão` | yes - new marked, previous stays true, refused edit leaves false; "same transaction" not proved |
| C22 | walk - not a test (AlertDialog text) | yes - exact dialog copy is walk-provable |
| C23 | `registros.test.ts` `remove o Registro e tira horas, questões e acertos dos totais, mantendo Tópico estudado e Cronômetro`; walk | yes - total 0, feito 0, hojeMinutos/questoesHoje 0 |
| C24 | walk - not a test | yes - Cancelar is UI-only |
| C25 | same test as C23 | yes - `estudado` true and `obterCronometro` not null asserted |
| C26 | `registros.test.ts` `excluir um Registro de Volta fechada não reabre a Volta nem muda a aberta` | yes - Voltas rows `toEqual` before/after, aberta feito 15 |
| C27 | `registros.test.ts` `recusa Registro já excluído ou de outro Usuário e não apaga nada` | yes |
| C28 | `registros.test.ts` `um dia dentro de Volta fechada fica nela, não soma na aberta e não a reabre; um dia depois soma` | yes - volta 1 / 2, feito 0 then 90, fim exact, one open Volta. Setup `db.delete(registroDeEstudo)` is contrived but sound |
| C29 | `registros.test.ts` `um dia passado dentro da Volta aberta soma ao progresso e, completando as Etapas, a fecha` | no (partial) - asserts only the closure; the "soma ao progresso" half (a non-completing past day adding minutes) is never asserted |
| C30 | `registros.test.ts` `recusa data futura ao registrar e ao editar` | yes - exact message on both; no-write not asserted |
| C31 | `registros.test.ts` `recusa acertos acima das questões mesmo com data retroativa` | yes - message and count 0 |
| C32 | `registros.test.ts` `editar e excluir mudam a Hoje e o Ciclo na próxima leitura`; walk | no (partial) - AC 34 also names Nesta semana, Estatísticas, próxima etapa and horas extras; only Estudado hoje and Matéria feito are asserted |
| C33 | `registros.test.ts` `mudanças simultâneas no mesmo Registro e entre dois Ciclos não dão erro 500 nem fecham a Volta duas vezes` | no - double delete is sound; the cross-Ciclo edits (10 -> 50 min against cargas of 60) never reach 100%, so "sem fechar a mesma Volta duas vezes" is not exercised for edits; deadlock-freedom is only probabilistic |
| C34 | walk - not a test (375px/1440px) | yes for fields kept; "folha no celular" is not in the plan's AC 13 (extra claim, not contradicted) |
| C35 | walk - not a test (sem sessão -> login) | yes - redirect is walk-provable |
| C36 | `estudo.test.ts` `soma as durações ao Progresso da matéria na Volta atual`; walk | no - the unit test is about progress, not the modal title or button; only the walk ("Registrar estudo" / "Salvar registro") holds the claim |

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| `/registros?limite=100000000000000000000` returns a 500 | `page.tsx:16` `Math.max(25, parseInt(...))` gives 1e20; my throwaway call `listarRegistros(db, u, { limite: 1e20 })` threw `value "100000000000000000000" is out of range for type bigint` (1e10 is fine) | clamp `limite` in `listarRegistros` (e.g. `Math.min(limite, total cap)` or fall back to 25 above a sane max) and test it | |
| C10 does not hold the (início, fim] boundary | test uses 10/11 12:00 vs a 15:00 close; no Registro at exactly `fim` or `fim + 1ms`. My example (Registro at exactly `fim` -> Volta 1, progress 0; at `fim+1ms` -> Volta 2, progress 600) passes at HEAD | add the two instants to the test | |
| C18 "hoje" asserts `>= antes` only | a stored instant of 23:59 today passes | also assert `<= Date.now()` after the call | |
| C16 never proves "não gravar" on the two refusals | `edit(20,21)` and `edit(null,3)` are followed by accepted edits; only the end state is read | assert the row is unchanged after each rejection | |
| C33 does not exercise a double close from edits | cross edits move 10 -> 50 min into Ciclos with carga 60 | make the crossed edits each complete the destination Ciclo and assert exactly one Volta 2 per Ciclo | |
| C29 proves the closure but not that a past day inside the open Volta adds minutes | only `voltaFechada === 1` asserted | register a non-completing past day and assert `feito` | |
| C4 "1 registro" singular and C36 modal title/button have no assertion | C4 test asserts totals only; C36 unit test is progress arithmetic | a unit/format test for the singular label; rely on the walk for C36 but state it is walk-only | |
| C19 toast "Volta N fechada. Volta N+1 começou em <ciclo>." untested; C32 omits Nesta semana, Estatísticas, horas extras | text built in `acoes-registros.ts`; C32 asserts hojeMinutos and feito only | assert the text in a test or walk; add the missing readers or narrow the check to what is proved | |
| HEAD moved after `proofs.md` | `2ecace5` changed `formulario-de-registro.tsx` after proofs at `a50200b`; a `tests/zz-verif.test.ts` is committed in it (another verifier's scratch, not mine; I restored it after a name clash and deleted my own scratch files) | rerun `check_proofs.py`, re-save pictures at the new HEAD, and drop `tests/zz-verif.test.ts` from the commit | |

Own examples run at HEAD (throwaway, deleted): (1) Registro at exactly the closing instant is Volta 1, adds 0 to the open Volta; +1 ms is Volta 2 and adds 600 - pass. (2) Moving a Registro into a Matéria of another Ciclo that completes it closes the destination Volta (returns 1, Volta 2 opens) and leaves the origin Ciclo on Volta 1 with 0 hours - pass. Also limite 0, -5, 1.5, NaN fall back to 25 and 1 returns 1 - pass; only the huge `limite` above fails.

Against `captures/registrar-estudo.png`: no check or criterion contradicts it beyond the five approved departures. Segmento Conteúdo (Tópico / Conteúdo livre / Sem conteúdo), Acerto tile, Tipo de estudo segments and Cancelar/Salvar match; the footer divider is now present at HEAD.
