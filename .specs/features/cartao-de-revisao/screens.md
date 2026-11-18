# Cartão de revisão screens

**Verifier**: independent sub-agent (author != verifier)
**Round**: 2

| Screen | Compared with | Verdict | Finding |
| --- | --- | --- | --- |
| `captures/registrar-estudo.running.png` | `captures/registrar-estudo.png` | matches | round 2: trash button is an approved difference (AD-006) |
| `captures/ciclo.running.png` | `captures/ciclo.png` | matches | round 2: trash button (AD-006) and "Renomear" link (AD-001) are approved differences |

Round 2 retook both pictures (same setup; Fácil limit of the Ciclo back to 90) and reopened only the rows that differed in round 1. All other rows are as judged in round 1.

Pictures taken by this verifier: Chromium headless, viewport 1440x960, 1x, app on :3100, user voltas@exemplo.com. The red/dark "N" Next.js dev badge (bottom-left) is dev tooling, not product, and is ignored.

### `captures/registrar-estudo.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| dimmed app behind the modal, Sidebar + header of Hoje | same | Sample data differs; Sidebar without Revisões/Arquivados/counter is listed in Differences |
| Sidebar timer card: "Cronômetro", "Rodando", time, Pausar, Parar | same | round 2: trash icon button right of "Rodando" is the approved difference (AD-006) |
| modal title "Registrar estudo" with close `×` top right | same | |
| subtitle "Duração preenchida pelo cronômetro" | same | not drawn: it belongs to the timer-prefilled state, which this walk does not enter (code has it) |
| Matéria select "Direito Constitucional · TRT 2ª Região — Analista" | same | |
| Conteúdo segment Tópico / Conteúdo livre / Sem conteúdo, Tópico selected | same | |
| Tópico select | same | "Tópico 1" |
| Data field with date and time "dd/mm/aaaa · hh:mm" | same | date only, native date input (Differences) |
| Duração "1h 10min" single field | same | Horas and Minutos fields (Differences) |
| Tipo de estudo segment of 5 options (Teoria ... Leitura de lei) | same | Teoria selected instead of Exercícios (data) |
| Questões and Acertos inputs plus read-only "Acerto 80%" tile on one row | same | |
| "Nota da revisão" label with chip "Sugerida: Bom" | same | |
| Nota segment Errei / Difícil / Bom / Fácil with Bom selected | same | |
| phrase under the segment "80% está na faixa 75–90% deste ciclo. Você pode trocar a nota antes de salvar." | same | "75–95%": Fácil limit of this Ciclo is 95 (data) |
| Anotação label and textarea | same | empty with placeholder "Opcional" (data) |
| footer left "Próxima revisão estimada: dd/mm" with refresh icon | same | 27/11 |
| footer right Cancelar and "Salvar registro" with check icon | same | |
| modal order top to bottom as above, nesting inside one card | same | |

### `captures/ciclo.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| Sidebar: logo, Hoje, Registros, Estatísticas, Ciclos list with the Ciclo highlighted, Sair, user card | same | Revisões, Arquivados, counters absent (Differences); "Usuários" is admin-only and the test user is not admin; sample data |
| Sidebar timer card with Rodando, time, Pausar, Parar | same | round 2: trash icon button right of "Rodando" is the approved difference (AD-006) |
| breadcrumb "Ciclos > TRT 2ª Região — Analista" | same | |
| page title with Ciclo name | same | round 2: blue "Renomear" link beside the title is the approved difference (AD-001) |
| subtitle "N etapas · N matérias · carga por volta" | same | |
| header actions: Reiniciar volta, Adicionar etapa | same | Arquivar absent (Differences) |
| tabs Etapas, Voltas, Faixas de acerto, Etapas active with underline | same | Matérias tab absent (Differences) |
| Volta card: "Volta N", "Iniciada em ... · hoje", percent, progress bar, "Faltam", "Horas extras" | same | |
| Etapas table: columns #, Matéria, Carga, Progresso na volta, Situação, row menu, drag handle | same | |
| Situação chips Concluída (green), Próxima etapa (blue, highlighted row), Não iniciada (grey) | same | |
| right column card "Matérias" with "Tópicos estudados" and per-Matéria lines | same | |
| right column card "Faixas de acerto" title with "Editar" button (pencil) | same | |
| four chips Errei < 60%, Difícil 60–75%, Bom 75–95%, Fácil ≥ 95% in a row, colours red/orange/blue/green | same | Fácil 95 instead of 90 (data) |
| "Mínimo de questões" label with value 5 on the right | same | |
| arrangement: table left, Matérias card above Faixas card on the right | same | |
