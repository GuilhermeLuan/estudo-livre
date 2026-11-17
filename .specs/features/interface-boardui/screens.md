# Interface no BoardUI screens

**Verifier**: independent sub-agent (author != verifier)
**Round**: 1
**HEAD**: 85ec926

Pictures were taken from the code at 30a75ec; the later commit only changed `.specs` files. Data differences (dates, names, numbers, Volta, which Matéria has horas extras, Rodando/Pausado, selected tab) are not copy errors. Rows removed by `## Differences from the source` are marked `same`.

| Screen | Compared with | Verdict | Finding |
| --- | --- | --- | --- |
| `captures/hoje-claro-suave.running.png` | `captures/hoje-claro-suave.png` | diverges | 2 rows differ |
| `captures/hoje-escuro.running.png` | `captures/hoje-escuro.png` | diverges | 2 rows differ |
| `captures/pwa-hoje.running.png` | `captures/pwa-hoje.png` | diverges | 1 row differs |
| `captures/ciclo.running.png` | `captures/ciclo.png` | diverges | 1 row differs |
| `captures/registrar-estudo.running.png` | `captures/registrar-estudo.png` | diverges | 4 rows differ |
| `captures/estatisticas.running.png` | `captures/estatisticas.png` | diverges | 3 rows differ |
| `captures/entrar.running.png` | `captures/entrar.png` | matches | 0 rows differ |

### `captures/hoje-claro-suave.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| Sidebar: logo + "Estudo Livre", Hoje selected (filled blue), section "Ciclos" with "+", one item per Ciclo (Revisões, Registros, Arquivados removed by AD-001) | same | Ciclo names are the full names, "TRT 2ª Região — Analista" |
| Sidebar: Cronômetro card with "Cronômetro", chip "Rodando", time, "<Matéria> · <Ciclo>", "Pausar" and "Parar" | same | description truncated by ellipsis (data) |
| Sidebar: Cronômetro card has no other control | differs | a small trash icon button beside the "Rodando" chip, not in the capture |
| Sidebar: Usuários, Sair, user card with avatar MC, name, e-mail, "Admin" chip | same | avatar a little larger (note) |
| Header: "Hoje" + date line; "Iniciar cronômetro" outlined and "Registrar estudo" filled with + on the right | same | |
| Indicator cards: icon tile, label, value, chip - Estudado hoje (+ chip), Questões hoje (blue chip "% de acerto"), Nesta semana (+ chip); "Revisões de hoje" removed by AD-003, cards fill the width | same | three cards across the full width |
| "Ciclos ativos" heading and "Novo ciclo" button with a + icon, at the right of the heading | differs | "Novo ciclo" is text only, no + icon, and sits at the far right of the full-width row |
| Ciclo card: flag, name, "Volta N" chip, arrow button at right | same | arrow button is white with a dark arrow; the capture's is a quieter ghost button (note) |
| Ciclo card: "Progresso da volta", bar, "<p>% · <feito> de <carga>" | same | |
| Próxima etapa block: label, "<n> · Matéria" (+ "+ extra" chip when the Matéria has extras), own bar + "1h10 de 2h00", "Registrar" outlined and "Iniciar" filled with play icon | same | no extra chip on these Etapas (data) |
| "Revisões de hoje" column and info note | same | removed by AD-003; Ciclos ativos takes the full width |
| Page background and panel tones (Claro suave) | same | |

### `captures/hoje-escuro.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| Dark theme state of Hoje: dark page, dark panels, same tokens as the light capture | same | |
| Sidebar: logo, Hoje selected, "Ciclos" with "+", Ciclo items (Revisões, Registros, Arquivados removed) | same | full Ciclo names |
| Sidebar: Cronômetro card, time, description, "Rodando" chip (green on dark), "Pausar" / "Parar" | same | |
| Sidebar: Cronômetro card has no other control | differs | a trash icon button beside the "Rodando" chip, not in the capture |
| Sidebar: Usuários, Sair, user card with "Admin" chip | same | |
| Header: title, date, "Iniciar cronômetro", "Registrar estudo" | same | |
| Indicator cards: Estudado hoje, Questões hoje, Nesta semana with chips (Revisões removed) | same | |
| "Ciclos ativos" + "Novo ciclo" button with + icon | differs | no + icon on "Novo ciclo" |
| Ciclo cards: name, Volta chip, arrow button, progress bar and numbers | same | |
| Próxima etapa block with bar, "Registrar", "Iniciar" | same | |
| "Revisões de hoje" column | same | removed by AD-003 |

### `captures/pwa-hoje.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| Top bar: logo, "Hoje", avatar MC at top right | same | avatar larger (note); the capture's phone status bar is device frame, not app |
| Date line under the title | same | |
| Large Cronômetro card: label, "Rodando" chip, big time, "<Matéria> · <Ciclo>", "Pausar" and "Parar e registrar" | same | |
| Cronômetro card has no other control | differs | a trash icon button beside the "Rodando" chip |
| Indicators Hoje, Questões, Semana in three small cards (AD-003 replaces Revisões/Acerto) | same | |
| "Próximas etapas" + "N ciclos" | same | |
| Ciclo cards: flag, name, "Volta N · p%", bar, Etapa row with name, mini bar, "1h10 de 2h00", blue play button | same | |
| Bottom tab bar: Hoje, central raised "+", Estatísticas (Revisões and Registros removed) | same | |

### `captures/ciclo.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| Sidebar: Ciclo item selected (filled blue), rest as in Hoje | same | |
| Sidebar: Cronômetro card without extra controls | differs | a trash icon button beside the "Rodando" chip |
| Breadcrumb "Ciclos > <name>", title, "Renomear" next to the name (AD-001) | same | |
| Subtitle "<n> etapas · <m> matérias · <carga> por volta" | same | |
| Header actions: "Adicionar etapa" filled with + (Reiniciar volta, Arquivar removed) | same | |
| Tabs and "Faixas de acerto" card, "Tópicos estudados" | same | removed by AD-001 |
| Volta card: "Volta N", start line ("Primeira volta"), "<p>% · feito de carga", bar, "Faltam", "Horas extras <tempo>" | same | no matéria chip beside "Horas extras" value (note; the plan lists only the time) |
| Table header: drag, #, Matéria, Carga, Progresso na volta, Situação | same | |
| EtapaRow: handle, position badge, Matéria, carga, bar with percent, Situação chip, ⋮; Próxima etapa row highlighted | same | chips Concluída / +extra / Próxima etapa / Em andamento / Não iniciada all drawn |
| Matérias card at the right: "<Matéria>, n etapas · carga" and a progress bar | same | bar runs full width below each Matéria instead of a short bar beside a topics count (note; the count was removed by AD-001) |

### `captures/registrar-estudo.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| Modal over a dimmed page, title "Registrar estudo", "×" at the right | same | modal narrower (note) |
| Note "Duração preenchida pelo cronômetro" under the title | same | |
| Matéria select | same | text drawn greyed, like a placeholder (note) |
| Conteúdo: single free-text field (Tópico, Conteúdo livre, Sem conteúdo removed by AD-001) | same | |
| Data field: text field "dd/mm/aaaa · hh:mm" | differs | native browser date input with its calendar glyph, date only, no time |
| Duração: Horas and Minutos side by side (AD-001) | same | |
| Tipo de estudo: five equal segments filling the row, selected one a white pill | differs | segments packed to the left at natural width, not filling the row |
| Questões, Acertos, "Acerto" read-only tile | same | "—" while empty |
| Nota da revisão, "Sugerida" chip, hint line | same | removed by AD-001 |
| Anotação textarea | same | shows a native resize handle (note) |
| Footer: "Cancelar" and "Salvar registro" with check, right-aligned (estimated review removed) | same | no divider above the footer (note) |
| Background Sidebar: Cronômetro card without extra controls | differs | a trash icon button beside the Pausado chip |

### `captures/estatisticas.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| Sidebar: Estatísticas selected | same | |
| Sidebar: Cronômetro card without extra controls | differs | a trash icon button beside the "Rodando" chip |
| Header: title, subtitle, segmented control at the right ("Todos os ciclos" + one per Ciclo) | same | selected segment differs and Ciclo names are full (data) |
| Cards: Horas estudadas, Nesta semana with chip, Acerto geral, Questões; no variation on the last three (AD-004) | same | |
| "Horas por semana" card: "Últimas 8 semanas", big total, chip "vs. semana anterior", 8 bars, last one highlighted, value above each bar, date under each | same | |
| Week-axis labels | differs | "28/9", "5/10", "9/11" without zero padding; capture draws "22/09", "06/10", "03/11" |
| "Acerto por matéria" card: Matéria, "n questões", percent, band-coloured bar; header "Questões" | same | card ends at the height of its content, not stretched to match the Horas por semana card (note) |
| Acerto por matéria labels | differs | "<Matéria> · <Ciclo>" with truncation; capture shows the Matéria name only |
| "Horas por matéria" card: "<h> no total", stacked bar, legend dots | same | |
| Horas por matéria legend entries | differs | "<Matéria> · <Ciclo> <tempo>" and zero-hour entries with grey dots; capture legend is "<Matéria> <tempo>" |

### `captures/entrar.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| Centred card on the page background, blue logo tile on top | same | card is the soft tone of Claro suave, not white (note) |
| Title "Entrar no Estudo Livre" and subtitle | same | |
| "E-mail" label and field | same | |
| "Senha" label and field | same | field drawn focused, longer dots (data/state) |
| "Esqueci minha senha" link right-aligned | same | absent: allowed when SMTP is not configured (criterion 50) |
| Filled full-width "Entrar" button | same | |
| Divider and "Não tem conta? Criar conta" | same | |
| Footer "Instância self-hosted · seus dados ficam no seu servidor" | same | |
