# gestao-de-voltas verification

**Verdict**: FAIL
**Proofs**: `proofs.md` at 188e0e6
**Verifier**: independent sub-agent (author != verifier)

## Checks

| Check | Test | Holds |
| --- | --- | --- |
| C1 | walk/browser - `captures/ciclo.running.png` (screens.md) | yes - tabs Etapas/Voltas and Reiniciar volta beside Adicionar etapa match the capture; the extra Matérias/Faixas/Arquivar are approved differences |
| C2 | `tests/voltas.test.ts` `lista a Volta aberta primeiro e as fechadas da mais recente à mais antiga` + walk | yes - exact order [3,2,1] and open-first; column headers only by walk |
| C3 | `formato.test.ts` `datas em dd/mm/aaaa e duração em dias de calendário` | yes - Mesmo dia / 1 dia across midnight / 14 dias, and UTC-vs-Brasília date; formatter level, table wiring only by walk |
| C4 | walk - aba Voltas, "Em andamento" na primeira linha (`tabela-de-voltas.tsx:21`); open-until-today covered by `formato.test.ts` | yes |
| C5 | `tests/voltas.test.ts` `a Volta 1 começa na criação do Ciclo` | yes - toEqual(criadoEm) |
| C6 | `tests/voltas.test.ts` `um Ciclo sem Volta fechada lista só a Volta 1 aberta` | yes |
| C7 | `tests/voltas.test.ts` `listar as Voltas de outro Usuário responde não encontrado` | yes - other user and nonexistent id |
| C8 | walk - diálogo de confirmação (`reiniciar-volta.tsx:22-29` text matches spec) | yes - code reads exactly as spec |
| C9 | `tests/voltas.test.ts` `reiniciar fecha a Volta aberta e abre a seguinte no mesmo instante` + walk | yes - inicio == fim exact; 0% asserted by C12 and the walk |
| C10 | walk - cancelar o diálogo | yes - no state mutation path on cancel in code |
| C11 | `tests/voltas.test.ts` `reiniciar sem Registro de estudo é permitido` | yes - twice in a row, [3,2,1] |
| C12 | `tests/voltas.test.ts` `reiniciar mantém os Registros na Volta fechada e zera o progresso` | yes - feito 0/percentual 0, then registros [[30,2],[40,1]] |
| C13 | `tests/voltas.test.ts` `reiniciar com o número de uma Volta que já não é a aberta é recusado` | yes - exact message, ValidacaoError, Volta 2 still open; but see finding on NaN/1.5 |
| C14 | `tests/voltas.test.ts` `reiniciar o Ciclo de outro Usuário responde não encontrado` | yes - also asserts Ana's Voltas unchanged |
| C15 | walk - reiniciar na aba Voltas | yes - tab is client state (`Tabs` uncontrolled) so it survives revalidate; fim hoje by walk |
| C16 | `tests/voltas.test.ts` `mudar a carga recalcula o progresso da Volta aberta` | yes - [150,60,40] exact |
| C17 | `tests/voltas.test.ts` `editar a carga.../remover a Etapa que falta.../adicionar uma Etapa já cumprida pelas horas extras` | yes - the three operations each close; edit case also asserts fim==inicio and feito 0 |
| C18 | `tests/voltas.test.ts` `mudança que deixa uma Etapa abaixo de 100% mantém a Volta aberta` | yes - add and edit, both below 100% |
| C19 | `tests/voltas.test.ts` `editar a Etapa devolve o número da Volta fechada` + `formato.test.ts` aviso + walk | yes - [1,null] and exact string; plumbing `acoes-ciclos.ts` executar only by walk |
| C20 | `tests/voltas.test.ts` `remover a última Etapa mantém a Volta aberta` | yes - fails if the length===0 guard is dropped |
| C21 | `tests/voltas.test.ts` `mudar a carga não reabre nem altera a Volta fechada` | yes - toEqual on before/after |
| C22 | `tests/voltas.test.ts` `reordenar as Etapas não muda as Voltas` | yes (strengthened in ed80488: the state is all-100% with the Volta open) - was weak: the state was not all-100%, so a mutant that evaluated closing on reorder would still pass |
| C23 | `tests/voltas.test.ts` `registro e mudança de Etapa simultâneos fecham a Volta uma vez` | yes - [2,1]; a double close would give [3,2,1] |

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| `reiniciarVolta` with a non-integer or NaN número (a forged server-action argument) dies with a raw `DrizzleQueryError` instead of the VOLTA-13 refusal; 0 and -1 are refused correctly | throwaway test at HEAD: `reiniciarVolta(db, ana, id, NaN)` rejects with `DrizzleQueryError: Failed query: update "volta"...`; `src/casos-de-uso/voltas.ts:25-30` passes `numero` straight to `eq(volta.numero, numero)`; `src/app/acoes-ciclos.ts` `executar` only maps ValidacaoError/NaoEncontradoError | in `reiniciarVolta`, throw the "Esta volta já foi reiniciada. Atualize a página." ValidacaoError when `!Number.isInteger(numero)`, and add a check on NaN and 1.5 to C13's test | ed80488 - C13 now asserts 0, -1, 1.5 and NaN |

Own examples that held at HEAD: renaming a Etapa onto another Matéria of the same Ciclo and completing everything returns Volta 1 closed; removing an Etapa of a Matéria with horas extras that completes the rest closes the Volta; reiniciar with 0 and -1 is refused with the spec message. The day-boundary duration (31/12 to 02/01, 28/02 to 01/03) was run but I did not read its output before deleting the throwaway file, so it is unverified. Other notes: C22 is the only loose assertion; C2, C4, C8, C10, C15 are walk only. No check contradicts `captures/ciclo.png` (tab order Etapas/Voltas and the missing Matérias/Faixas/Arquivar are approved differences).
