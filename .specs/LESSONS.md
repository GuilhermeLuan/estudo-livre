# LESSONS - auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Plan/Checks)

Corroborated across multiple features. Safe to apply as guidance.

_none_

## Candidates (under observation - do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

### L-001 - A guard that reads state outside the lock of the write it protects can be raced: lock the row, then check and write in the same transaction, and test the two operations in parallel
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `use-cases` · harmful: 0
- features: arquivar-ciclo
- evidence: verification.md finding 1, C34 (use-cases)
- last seen: 2026-11-19T01:14:29Z

### L-002 - When a criterion says a derived value is recalculated, assert the derived value after the change, not only the rows that remain
- signal: `weak_test` · recurrence: 1 feature(s) · scope: `use-cases` · harmful: 0
- features: arquivar-ciclo
- evidence: verification.md finding 2, C27 (use-cases)
- last seen: 2026-11-19T01:14:29Z

### L-003 - When a criterion fixes a numeric bound, test the bound value itself as accepted and the next value as refused
- signal: `weak_test` · recurrence: 1 feature(s) · scope: `use-cases` · harmful: 0
- features: copiar-materia
- evidence: verification.md finding 1, C14 (use-cases) (use-cases)
- last seen: 2026-11-21T12:44:21Z

### L-004 - Quando uma regra de ordem vale para duas listas, o teste afirma a ordem e o desempate de cada lista, com itens inseridos fora de ordem.
- signal: `weak_test` · recurrence: 1 feature(s) · scope: `listas` · harmful: 0
- features: tela-de-revisoes
- evidence: C29 (verification.md) (listas)
- last seen: 2026-11-22T15:25:22Z

### L-005 - Um limite de itens que a tela aplica mora numa constante do caso de uso, e o teste afirma o valor dela com mais itens que o limite.
- signal: `weak_test` · recurrence: 1 feature(s) · scope: `listas` · harmful: 0
- features: tela-de-revisoes
- evidence: C7 (verification.md) (listas)
- last seen: 2026-11-22T15:25:22Z

### L-006 - Antes de aprovar um cabeçalho que a captura desenha numa linha, confira com os nomes mais longos que os dados reais permitem, pois os de exemplo da captura são curtos.
- signal: `spec_deviation` · recurrence: 1 feature(s) · scope: `telas` · harmful: 0
- features: tela-de-revisoes
- evidence: hoje.running.png (screens.md) (telas)
- last seen: 2026-11-22T15:25:22Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
