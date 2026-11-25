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

### L-007 - Um importador valida cada campo com a mesma função e a mesma unidade de medida que o caso de uso de criação usa (caracteres, não UTF-16), e testa a ida e volta com valores no limite do app.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `importacao` · harmful: 0
- features: backup-json
- evidence: BKP-11 / C23 (importacao)
- last seen: 2026-11-22T16:05:53Z

### L-008 - Validar arquivo externo inclui os limites do tipo da coluna e as regras cruzadas do caso de uso (acertos sem questões, tópico e conteúdo juntos); erros de dado do Postgres (classes 22/23) viram a mensagem de inválido.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `importacao` · harmful: 0
- features: backup-json
- evidence: BKP-09 AC 1 / C17 (importacao)
- last seen: 2026-11-22T16:05:53Z

### L-009 - Prove a regra de validação sobre o texto digitado, não só sobre o número já convertido: ponha a conversão no domínio e teste vírgula, ponto de milhar e vazio.
- signal: `weak_test` · recurrence: 1 feature(s) · scope: `validation` · harmful: 0
- features: sugestao-de-ciclo
- evidence: C7 verification finding 1 (validation)
- last seen: 2026-11-22T22:01:56Z

### L-010 - Teste a conversão de unidade (horas digitadas para minutos) na função que a tela e a action usam, com vírgula, ponto e texto inválido.
- signal: `weak_test` · recurrence: 1 feature(s) · scope: `validation` · harmful: 0
- features: sugestao-de-ciclo
- evidence: C8 verification finding 2 (validation)
- last seen: 2026-11-22T22:01:56Z

### L-011 - Uma regra de validação vale também quando a lista que a motiva está vazia, a menos que o plano diga o contrário; teste o campo sozinho.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `validation` · harmful: 0
- features: sugestao-de-ciclo
- evidence: AC 8 verification finding 3 (validation)
- last seen: 2026-11-22T22:01:56Z

### L-012 - Mantenha o limite de um campo igual na tela, no caso de uso e na importação de backup, e escreva o mesmo limite no critério.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `backup` · harmful: 0
- features: sugestao-de-ciclo
- evidence: AC S2.4 verification finding 4 (backup)
- last seen: 2026-11-22T22:01:56Z

### L-013 - Teste o limite de tamanho de uma lista em cada camada que o aplica (domínio e caso de uso), com N e N+1 itens.
- signal: `weak_test` · recurrence: 1 feature(s) · scope: `validation` · harmful: 0
- features: sugestao-de-ciclo
- evidence: C5 verification finding 5 (validation)
- last seen: 2026-11-22T22:01:56Z

### L-014 - Em regra de arredondamento com teto, afirme as bordas exatas (meio acima, meio abaixo, o teto) e não só um valor longe delas.
- signal: `weak_test` · recurrence: 1 feature(s) · scope: `domain` · harmful: 0
- features: sugestao-de-ciclo
- evidence: C10 verification finding 6 (domain)
- last seen: 2026-11-22T22:01:56Z

### L-015 - Conversões feitas na página (valor gravado → texto do campo) ficam fora dos testes: extraia para uma função pura em src/dominio.ts e teste o texto que o critério fixa.
- signal: `weak_test` · recurrence: 1 feature(s) · scope: `src/app` · harmful: 0
- features: editar-ciclo
- evidence: C4 (src/app)
- last seen: 2026-11-25T23:38:48Z

### L-016 - Ao reaproveitar uma validação de criação numa edição, confira os limites contra dados que já existem (um Ciclo pode já passar do teto) e teste a borda.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `src/casos-de-uso` · harmful: 0
- features: editar-ciclo
- evidence: Edge Cases EDIT-03 (src/casos-de-uso)
- last seen: 2026-11-25T23:38:48Z

### L-017 - No teste de falha no meio da transação, envie valores diferentes dos gravados e confira cada linha tocada, senão um update fora da transação passa despercebido.
- signal: `weak_test` · recurrence: 1 feature(s) · scope: `tests` · harmful: 0
- features: editar-ciclo
- evidence: C16 (tests)
- last seen: 2026-11-25T23:38:48Z

### L-018 - Todo limite numérico tem dois testes: o valor exato aceito e o seguinte recusado; só o lado recusado deixa passar a troca de > por >=.
- signal: `weak_test` · recurrence: 1 feature(s) · scope: `tests` · harmful: 0
- features: importar-ciclo
- evidence: verification.md C27,C31-C35 (tests)
- last seen: 2026-11-25T23:55:08Z

### L-019 - Validar unicidade sem diferenciar maiúsculas em JS não garante o índice lower() do Postgres; capture a violação 23505 pela constraint e recuse com mensagem.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `casos-de-uso` · harmful: 0
- features: importar-ciclo
- evidence: verification.md - toLowerCase vs lower() (casos-de-uso)
- last seen: 2026-11-25T23:55:08Z

### L-020 - No it.each do vitest, um $campo interpolado com mais de 40 caracteres sai cortado com reticências e a prova por linha não acha o teste; mantenha os nomes de caso curtos.
- signal: `gate_fail` · recurrence: 1 feature(s) · scope: `tests` · harmful: 0
- features: importar-ciclo
- evidence: proofs C57 (tests)
- last seen: 2026-11-25T23:55:08Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
