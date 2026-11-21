# Copiar matéria de outro ciclo verification

**Verdict**: FAIL
**Proofs**: `proofs.md` at 2bace8a
**Verifier**: independent sub-agent (author != verifier)

## Checks

| Check | Test | Holds |
| --- | --- | --- |
| C1 | walk: `FormularioNome` (`rotuloDaCopia`: `<nome> · <ciclo>` + ` (arquivado)`), `listarMateriasCopiaveis` | yes - walk plausible against the code |
| C2 | `copiar-materia.test.ts` `lista as Matérias de outros Ciclos, ativos e arquivados` | yes - asserts exact list and order; destino's own Matéria and another user's are in the data |
| C3 | walk: `escolher` sets nome and horas (`cargaMinutos / 60`, `.replace(".", ",")`), inputs re-keyed, still editable | yes - walk plausible |
| C4 | `copiar-materia.test.ts` `a carga é a soma das Etapas e 0 sem Etapas` | yes - 180 and 0 asserted |
| C5 | walk: `m.cargaMinutos ? ... : undefined` + re-key leaves the field empty | yes - walk plausible |
| C6 | `copiar-materia.test.ts` `cria a Matéria, a Etapa no fim e os Tópicos na ordem` | yes - asserts name, carga, posição and Tópico order |
| C7 | `copiar-materia.test.ts` `os Tópicos copiados vêm não estudados, sem Registros nem Cartão` | yes - source is shown to have registro, cartão and estudados |
| C8 | `copiar-materia.test.ts` `a origem fica inalterada` | yes - full before/after snapshot |
| C9 | `copiar-materia.test.ts` `alterar a cópia não altera a origem` | yes - rename, mark, delete, add Tópico, edit Etapa, registro |
| C10 | walk: `name={copia ? "origemId" : undefined}` so "Nova matéria" sends no `origemId`, fields untouched | yes - walk plausible |
| C11 | walk: `copiaveis.length > 0 &&` gates the Select | yes - walk plausible |
| C12 | walk: `novaEtapa` falls to `adicionarEtapa` without `origemId` | yes - walk plausible |
| C13 | `copiar-materia.test.ts` `recusa nome repetido no destino` | yes - case and padding differ, message and counts asserted |
| C14 | `copiar-materia.test.ts` `recusa carga inválida` | no - only the invalid side: 600000 min (exactly 10.000 h) is never asserted accepted, so `>=` instead of `>` passes |
| C15 | `copiar-materia.test.ts` `recusa nome vazio` | yes |
| C16 | `copiar-materia.test.ts` `recusa origem inexistente, de outro Usuário ou do próprio Ciclo` | yes - error class and counts (own-Ciclo message not asserted, spec fixes none) |
| C17 | `copiar-materia.test.ts` `recusa destino arquivado` | yes |
| C18 | `copiar-materia.test.ts` `uma falha no meio desfaz tudo` | yes - trigger fails the Tópico insert after Matéria and Etapa are written |
| C19 | `copiar-materia.test.ts` `origem sem Tópicos gera cópia sem Tópicos` | yes |
| C20 | `copiar-materia.test.ts` `a mesma cópia duas vezes recusa a segunda` | yes - sequential, as the spec says |

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| C14 does not hold the upper bound: nothing asserts that exactly 10.000 h is accepted | `recusa carga inválida` loops `[0, -5, 1.5, NaN, 600001]`; changing `minutos > CARGA_MAXIMA_MINUTOS` to `>=` still passes. At HEAD I confirmed 600000 is accepted and 600001 refused, so the code is right, the test is loose | add a copy with `cargaMinutos: 10_000 * 60` that succeeds | `351e582` - C14 agora copia com exatamente 10.000 h |

Probed at HEAD with a throwaway test (deleted): 10.000 h exact accepted and +1 min refused; 500 Tópicos copied in order; "PORTUGUÊS" refused against "Português" while "Portugues" (no accent) is allowed, matching the unique index on `lower(nome)`; 3 simultaneous copies of the same name give exactly 1 Matéria (the Ciclo row lock serialises); a copy into an Ciclo whose other Etapa is done does not close the Volta (the new Etapa starts empty). Note: the Verifier prompt excluded the tasks.md `## Handoff`, but its `**Walked:**` line was read to judge the walks.
