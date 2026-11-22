# Exportar e importar backup em JSON verification

**Verdict**: FAIL
**Proofs**: `proofs.md` at 00470e8
**Verifier**: independent sub-agent (author != verifier)

## Checks

| Check | Test | Holds |
| --- | --- | --- |
| C1 | `backup.test.ts` `exportar > traz formato, versão e data da exportação` | yes |
| C2 | `backup.test.ts` `exportar > nomeia o arquivo com o dia de Brasília` | yes - both sides of 03:00 UTC |
| C3 | `backup.test.ts` `exportar > inclui ciclos ativos e arquivados com tudo o que pende deles` | yes, loosely - `posicao`, Cartão `proximaRevisao`/`estado` and log `antes`/`depois` are only `expect.any(...)`; INSS faixas and etapas are not asserted (C23 covers the values) |
| C4 | `backup.test.ts` `exportar > omite cronômetro, sessões e dados da conta` | yes - the name is the e-mail in `cadastrar`, so the e-mail check covers it |
| C5 | `backup.test.ts` `exportar > não inclui ciclos de outro usuário` | yes |
| C6 | walk `sem sessão, /api/backup redireciona para /entrar` | yes - proxy redirects with no cookie; `exigirUsuario` redirects with no session |
| C7 | walk `Sidebar a 1440px e menu da conta a 390px levam a /backup` | yes - `ItemDeNavegacao` and `DropdownItem` in `navegacao.tsx`, `TITULOS["/backup"]` |
| C8 | walk `/backup mostra os dois cartões com os textos da spec` | yes - texts in `page.tsx` and `importar-backup.tsx` match the spec |
| C9 | walk `Importar backup sem arquivo mostra Escolha um arquivo.` | yes - client check, and the action checks again |
| C10 | walk `conta vazia importa direto; conta com 2 Ciclos mostra o AlertDialog` | yes - `totalDeCiclos` = ativos + arquivados; the N = 1 and N text match |
| C11 | walk `Cancelar fecha o diálogo e os Ciclos continuam na Sidebar` | yes - `onOpenChange` closes, `enviar` runs only on confirm |
| C12 | `backup.test.ts` `importar > substitui os ciclos da conta pelos do arquivo` | yes |
| C13 | walk `aviso Backup importado: 2 ciclos. e a Sidebar com os Ciclos do arquivo` | yes - `revalidatePath("/", "layout")` plus `Aviso` |
| C14 | `backup.test.ts` `importar > recalcula os cartões ignorando os do arquivo` | yes - tampered Cartão and an empty log still give the original |
| C15 | `backup.test.ts` `importar > mantém ciclos arquivados com a mesma data` | yes |
| C16 | `backup.test.ts` `importar > não toca os ciclos de outro usuário` | yes |
| C17 | `backup.test.ts` `recusar > recusa arquivo inválido sem alterar a conta` | yes for the 20 listed cases, but values the app rejects still get through, and an integer overflow escapes as a raw error (findings 2 and 3) |
| C18 | `backup.test.ts` `recusar > recusa versão desconhecida` | yes |
| C19 | `backup.test.ts` `recusar > recusa arquivo acima de 50 MB` | yes - exactly 50 MiB is accepted, one byte more is refused |
| C20 | `backup.test.ts` `recusar > recusa com cronômetro ativo` | yes |
| C21 | `backup.test.ts` `recusar > desfaz tudo quando a gravação falha no meio` | yes - fails on the second Ciclo after the first was written |
| C22 | walk `POST da action sem cookie é redirecionado para /entrar pelo proxy` | yes - and `importar` calls `exigirUsuario` first |
| C23 | `backup.test.ts` `ida e volta > reexportar dá o mesmo arquivo` | yes on the scenario, loosely - `semIds` drops every `*Id` key, so it does not check that Registros and Etapas point to the right Matéria or Tópico (C24 catches that); it fails for a Tópico name the app accepts (finding 1) |
| C24 | `backup.test.ts` `ida e volta > reproduz voltas, progresso, estatísticas e revisões` | yes |
| C25 | `backup.test.ts` `importar > lista vazia esvazia a conta` | yes |
| C26 | `backup.test.ts` `importar > importar duas vezes não duplica` | yes |
| C27 | `backup.test.ts` `importar > aceita registro sem tópico nem conteúdo livre` | yes |

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| The round trip breaks for a Tópico name the app accepts: a name of 100 emoji is created, exported, then refused as invalid on import (BKP-11) | `backup.ts:148` caps `texto(t.nome, LIMITES_DO_TOPICO.nomeMaximo)` with `x.length` (UTF-16 units). `topicos.ts:31` counts `[...nome].length` (characters). Throwaway test: `criarTopico` with `"😀".repeat(100)` succeeds, and `importarBackup` of its own export throws `INVALIDO` | count characters the way `topicos.ts` does, and add a round-trip test with a multi-unit name | `80785ef` - C23 (`ida e volta > aceita nomes no limite de caracteres do app`) |
| A number that overflows a Postgres `integer` escapes as a raw `DrizzleQueryError` instead of "O arquivo não é um backup válido do Estudo Livre." (BKP-09 AC 1). The action rethrows it, so the Usuário sees an error page | `inteiro()` allows up to `MAX_SAFE_INTEGER`, and only `23505` is mapped (`backup.ts:248`). Throwaway test: `etapas[0].posicao = 3000000000` gave `DrizzleQueryError: Failed query: insert into "etapa"...`. The rollback still leaves the account intact | bound `posicao`, `numero`, `cargaMinutos` and the other integer fields to the column range (or map `22003`), and add the case to C17's list | `80785ef` - C17 (case `posicao = 3_000_000_000`; Postgres classes 22/23 mapped to the invalid message) |
| The importer accepts values the app rejects, against BKP-09 AC 1 ("valor fora do que o app aceita") | Throwaway tests: `cargaMinutos: 700000` was accepted (app max is 600000, `cargaValida` in `ciclos.ts`). `acertos: 0` with `questoes: null` was accepted (`estudo.ts` refuses any `acertos` without `questoes`). A Registro with both `topicoId` and `conteudoLivre` is not checked (`estudo.ts` refuses it) | reuse `cargaValida` and the `validar` rules from `estudo.ts` in `lerBackup`, and add these cases to C17 | `80785ef` - C17 (cases `cargaMinutos 600_001`, `acertos` without `questoes`, `topicoId` + `conteudoLivre`, date without timezone) |
| An empty chosen file gets "Escolha um arquivo." instead of the invalid-file message | `acoes-backup.ts`: `arquivo.size === 0` returns "Escolha um arquivo.". The client only checks `!arquivo`, so an empty `.json` that the Usuário did choose reaches the action. BKP-09 AC 1 says a file that is not JSON is refused with the invalid message | check emptiness on the client (no file chosen) and let the action send an empty file to `importarBackup` | `80785ef` - C17 (case `""`); the action only answers "Escolha um arquivo." without a chosen file |
