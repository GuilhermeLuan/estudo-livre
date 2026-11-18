# Registros screens

**Verifier**: independent sub-agent (author != verifier)
**Round**: 2
**HEAD**: 6e8a893

| Screen | Compared with | Verdict | Finding |
| --- | --- | --- | --- |
| `captures/registrar-estudo.running.png` | `captures/registrar-estudo.png` | matches | none (round 2: both round-1 rows now same) |

### `captures/registrar-estudo.running.png`

Approved departures applied: title "Editar registro", button "Salvar", date without time, Horas and Minutos separate, no cronômetro line, no Nota da revisão (chip, segmented control, hint), no Próxima revisão estimada, sidebar without Revisões/Arquivados. Dimmed background and sample data are not compared.

| Element | Result | Picture draws |
| --- | --- | --- |
| modal centered over a dimmed page, white card, rounded corners | same | note: card is wider (about 640px against 580px) |
| header: title at top left, close button at top right | same | title `Editar registro` (departure); no cronômetro subtitle (departure) |
| `Matéria` label + full-width select with chevron | same | note: input fill is grey, the capture's is white |
| `Conteúdo` label + 3-segment control `Tópico` (selected, white) / `Conteúdo livre` / `Sem conteúdo` | same | |
| topic select with chevron under the segment control | same | |
| `Data` field on the left, duration on the right, same row | same | `Data`, `Horas`, `Minutos` on one row (departure) |
| date field text `dd/mm/aaaa` | same | round 2: native date input with calendar icon is the approved departure AD-007 |
| `Tipo de estudo` label + 5-segment control `Teoria`, `Exercícios` (selected), `Revisão`, `Videoaula`, `Leitura de lei` | same | note: track is paler than the capture's grey track |
| `Questões` and `Acertos` inputs, then `Acerto` readonly chip with percent, on one row | same | note: chip fill darker grey |
| `Nota da revisão` label, `Sugerida` chip, 4-segment control, hint sentence | same | absent (departure) |
| `Anotação` label + multi-line textarea | same | note: shows a native resize handle at the bottom right that the capture does not |
| footer separated from the body by a hairline divider | same | round 2: hairline now drawn above the footer |
| footer left: `Próxima revisão estimada` | same | absent (departure) |
| footer right: `Cancelar` (outlined) then primary `Salvar` with check icon | same | `Salvar` text (departure) |
| sidebar: logo, Hoje, Registros (active), Estatísticas, Ciclos list, Usuários, Sair, user card | same | no Revisões/Arquivados (departure); page behind is Registros (page data) |
| render: nothing overlapping, cut off or unreadable inside the modal | same | |
