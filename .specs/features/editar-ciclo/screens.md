# Editar ciclo screens

**Verifier**: independent sub-agent (author != verifier)
**Round**: 1
**Pictures**: retaken by this sub-agent (Playwright 1.49.1 Chromium, `http://100.83.47.57:3100`, `walk3@exemplo.com`), state reached as the `**Walked:**` line says: `/ciclos/novo` with "TESTE", duração 1, "Portugues" 12 Média → "Criar ciclo" → "Editar ciclo" on the Ciclo page. `captures/editar-ciclo.running.png` was saved over the author's at a 1860x1143 window, 1x. The capture is a 2x high-DPI crop of the content area only (no sidebar; text and controls about twice the picture's size), so the same state was also taken at a 1200x700 window with deviceScaleFactor 2 to compare at the capture's scale; both pictures draw the same layout, and the content card is about 720 CSS px wide in both, matching the capture's ~1437 px at 2x. Scale and the sidebar are not judged.

| Screen | Compared with | Verdict | Finding |
| --- | --- | --- | --- |
| `captures/editar-ciclo.running.png` | `captures/editar-ciclo.png` | matches | 0 rows differ |

### `captures/editar-ciclo.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| page title, top left of the content column: `Novo ciclo` → `Editar ciclo` (Differences from the source) | same | "Editar ciclo" |
| first card (rounded, bordered panel) holding two fields on one row | same | |
| field `Nome do ciclo`: label above a wide text input, value `TESTE` | same | note: the capture shows the input focused (darker border, caret); the picture shows it unfocused |
| field `Duração da etapa (h)`: label above a narrower input on the right, value `1` | same | |
| second card `Matérias`, below the first, same width | same | |
| card heading `Matérias` | same | |
| description `Informe as questões da prova e a sua dificuldade em cada matéria para receber a sugestão de etapas.` without `Sem matérias, o ciclo nasce vazio.` (Differences from the source) | same | the sentence ends at "etapas."; wraps after "sugestão de" as in the capture |
| table header row: `Matéria` (left, wide), `Questões`, `Dificuldade` in muted small text | same | column starts at the same proportions of the card (~50% and ~69%) |
| row `Portugues`: name as plain text (not an input) on the left | same | |
| row: `Questões` input with `12` | same | |
| row: `Dificuldade` select showing `Média` with a chevron on the right | same | |
| row: square bordered trash-icon button at the end of the row | same | |
| add row: `Nome da matéria` placeholder input spanning most of the width | same | |
| add row: bordered button `+ Adicionar matéria` on the right | same | |
| action row below the cards, aligned to the right edge of the cards: secondary `Visualizar ciclo` then primary blue button | same | |
| primary button `Criar ciclo` → `Gerar ciclo` (Differences from the source) | same | "Gerar ciclo", blue filled |
| nothing else in the content area below the actions | same | |
