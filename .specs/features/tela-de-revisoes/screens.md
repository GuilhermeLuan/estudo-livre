# Tela de revisões screens

**Verifier**: independent sub-agent (author != verifier)
**Round**: 2
**Note**: passada extra autorizada pelo Usuário depois da rodada 2

Pictures taken by the verifier at the capture size (1x, pt-BR, America/Sao_Paulo), signed in as `marina@exemplo.com`. The seeded database differs from the capture's data (other names, dates, quantities, no running Cronômetro); that is not a divergence.

| Screen | Compared with | Verdict | Finding |
| --- | --- | --- | --- |
| `captures/hoje.running.png` | `captures/hoje.png` | matches | 0 rows differ |
| `captures/revisoes.running.png` | `captures/revisoes.png` | matches | 0 rows differ |
| `captures/pwa-hoje.running.png` | `captures/pwa-hoje.png` | matches | 0 rows differ |

### `captures/hoje.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| Sidebar: logo "Estudo Livre", Hoje (selected), Revisões with Counter, Registros, Estatísticas | same | |
| Sidebar: "Ciclos" with "+", two Ciclos, Arquivados with Counter | same | |
| Sidebar: Cronômetro card (Rodando, 00:42:18, Pausar, Parar) | same | not drawn: no Cronômetro exists in this state (another state) |
| Sidebar footer: Usuários, Sair, user card with Admin chip | same | |
| Header: title "Hoje", date subtitle, "Iniciar cronômetro" and "Registrar estudo" on the right | same | |
| Four indicators in a row: Estudado hoje, Revisões de hoje (2nd), Questões hoje, Nesta semana | same | Revisões de hoje 8 with no chip |
| "Ciclos ativos" heading with "Novo ciclo" button | same | |
| Ciclo cards: name, Volta chip, arrow button, Progresso da volta bar, Próxima etapa with Registrar and Iniciar | same | other data, no "extra" chip |
| Right column card "Revisões de hoje" with Counter, to the right of Ciclos ativos | same | |
| Card header: title and Counter with the filter Todos / TRT / INSS on the same row, to the right of the title | same | extra pass: filter on the title row and inside the card's right edge; Ciclo names cut with ellipsis ("TRT ...", "INSS ...") by the Usuário's decision |
| Revisão rows: Tópico, "Matéria · Ciclo", chip (Atrasada Nd rosa / Hoje amarelo), Registrar | same | 6 rows; subtitle truncated more |
| Link "Ver todas as revisões" with arrow, centered | same | |
| Info notice "Uma revisão é cumprida por um registro de estudo do tópico com questões." | same | |

### `captures/revisoes.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| Sidebar with "Revisões" selected, between Hoje and Registros, Counter 8 | same | |
| Sidebar: Cronômetro card | same | not drawn: no Cronômetro in this state |
| Header: title "Revisões", subtitle "N vencidas · M nos próximos 7 dias" | same | "8 vencidas · 4 nos próximos 7 dias" (data) |
| Filter at top right: Todos os ciclos / TRT / INSS | same | |
| Table card with header row: Tópico, Matéria, Ciclo, Vencimento, Última nota, Acerto | same | |
| Section "Vencidas" with Counter | same | |
| Vencidas rows: Tópico, Matéria, Ciclo, chip, nota chip, acerto, Registrar (blue) and ▶ | same | "—" in both columns for the Tópico without nota; ▶ icon larger/darker (note) |
| Section "Próximos 7 dias" with Counter | same | 4 rows instead of 5 (data) |
| Próximos rows: chip Amanhã / dd/mm gray, nota, acerto, neutral Registrar only | same | |
| Notice "Uma revisão é cumprida por um registro de estudo do tópico com questões." | same | listed in Differences from the source (capture has none) |

### `captures/pwa-hoje.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| Header: app icon, title "Hoje", avatar MC | same | |
| Date subtitle | same | |
| Cronômetro card (Rodando, time, Pausar, Parar e registrar) | same | not drawn: no Cronômetro in this state |
| Indicators in the order Hoje, Revisões, third | same | third is "Questões" (listed in Differences from the source) |
| No "Revisões de hoje" card | same | |
| "Próximas etapas" with "N ciclos" | same | |
| Ciclo cards with progress, Volta, Próxima etapa row and ▶ | same | |
| Tab bar: Hoje (selected), Revisões, central "+", Registros, Estatísticas | same | |
