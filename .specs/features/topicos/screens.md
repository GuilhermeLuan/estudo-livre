# Topicos screens

**Verifier**: independent sub-agent (author != verifier)
**Round**: 2
**HEAD**: ab9071f

| Screen | Compared with | Verdict | Finding |
| --- | --- | --- | --- |
| `captures/ciclo.running.png` | `captures/ciclo.png` | matches | 0 rows differ |
| `captures/registrar-estudo.running.png` | `captures/registrar-estudo.png` | matches | 0 rows differ |

### `captures/ciclo.running.png`

Approved departures applied: tabs, "Reiniciar volta", "Arquivar" and the "Faixas de acerto" card are absent. Sample data is not compared.

| Element | Result | Picture draws |
| --- | --- | --- |
| sidebar: logo "Estudo Livre", brand block on top | same | |
| sidebar nav: Hoje, Revisões (badge), Registros, Estatísticas | same | approved departure |
| sidebar "Ciclos" section with `+`, active cycle highlighted blue | same | |
| sidebar: INSS Técnico and Arquivados entries | same | sidebar entries are data |
| sidebar: Cronômetro card (Rodando, time, Pausar/Parar) | same | present only while a timer runs |
| sidebar footer: Usuários, Sair, user card with Admin chip | same | |
| breadcrumb `Ciclos > TRT 2ª Região — Analista` | same | breadcrumb uses `›`, smaller |
| title `TRT 2ª Região — Analista` | same | approved departure |
| subtitle `N etapas · N matérias · hhmm por volta` | same | |
| header action: blue "+ Adicionar etapa" on the right | same | |
| Volta card: title `Volta N`, caption under it | same | "Primeira volta", approved departure |
| Volta card: percent + `hhmm de hhmm`, blue progress bar, "Faltam" | same | |
| Volta card: "Horas extras" value at the right | same | the capture's `TI` chip is absent (data-dependent, 0h00) |
| table card: columns #, Matéria, Carga, Progresso na volta, Situação | same | |
| table rows: drag handle, number badge, name, carga, bar, percent, status pill, kebab | same | next-step row tinted blue as in the capture |
| status pills: Concluída, Próxima etapa, Em andamento, Não iniciada, +extra | same | colors match for the pills drawn |
| right card "Matérias" with caption "Tópicos estudados" on the right of the title | same | |
| right card row: name, then `N etapa · hhmm` below | same | |
| right card row: fraction `x/y` on the second line, right-aligned, bar below it as a short right-aligned bar | same | fraction right-aligned on the second line, bar short and right-aligned |
| right card row: bar drawn short, blue fill, grey track (0 shows an empty grey track) | same | short bar, grey track |
| "Faixas de acerto" card below Matérias | same | absent, approved departure |
| page background and surfaces | same | note: picture is a grey page ground and capture is white; shade only |

### `captures/registrar-estudo.running.png`

Approved departures applied: "Nota da revisão", "Sugerida" chip, scale, hint, "Próxima revisão estimada" and the time of the date are absent. Sample data is not compared.

| Element | Result | Picture draws |
| --- | --- | --- |
| dimmed Hoje page behind a centered modal | same | |
| modal title `Registrar estudo` at top left | same | |
| subtitle `Duração preenchida pelo cronômetro` with clock icon under the title | same | shown only when a timer fills the duration; not this state |
| close button on the top right | same | light rounded square with `×` |
| `Matéria` label + select `<matéria> · <ciclo>` with chevron | same | |
| `Conteúdo` label + segmented control Tópico / Conteúdo livre / Sem conteúdo, Tópico selected | same | |
| Tópico select with chevron, full width | same | at rest, chevron and white fill |
| `Data` field | same | date only, native `mm/dd/yyyy` with calendar icon; time omitted per AD-007 |
| `Duração` as one field (`1h 10min`) beside Data | same | Horas and Minutos, approved departure |
| `Tipo de estudo` segmented: Teoria, Exercícios, Revisão, Videoaula, Leitura de lei | same | |
| `Questões`, `Acertos` fields and `Acerto` percent tile on one row | same | tile is taller, shows `—` when empty |
| `Nota da revisão` row, hint sentence | same | absent, approved departure |
| `Anotação` label + multiline field | same | |
| footer: `Cancelar` outline and `Salvar registro` blue button with check, right-aligned | same | |
| footer: `Próxima revisão estimada` text on the left | same | absent, approved departure |
| footer divider line above the footer | same | note: picture draws no divider |
