# Gestão de voltas screens

**Verifier**: independent sub-agent (author != verifier)
**Round**: 1
**HEAD**: f93fdc5

Picture taken by the verifier: 1440x960, 1x, light theme, `/ciclos/d096c67a-...`, tab "Etapas".

| Screen | Compared with | Verdict | Finding |
| --- | --- | --- | --- |
| `captures/ciclo.running.png` | `captures/ciclo.png` | diverges | 4 rows differ |

### `captures/ciclo.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| Sidebar: logo "Estudo Livre" | same | |
| Sidebar: "Hoje", "Registros", "Estatísticas" | same | |
| Sidebar: item "Revisões" with count | same | not drawn, approved (AD-001) |
| Sidebar: group "Ciclos" with "+" and the active Ciclo highlighted blue | same | other Ciclos are data |
| Sidebar: item "Arquivados" with count | same | not drawn, approved (AD-001) |
| Sidebar: Cronômetro card ("Cronômetro", chip "Rodando", time, "Pausar"/"Parar") | differs | no Cronômetro card; the space is empty (not in the approved differences) |
| Sidebar: "Usuários" link above "Sair" | differs | not drawn; only "Sair" (not in the approved differences) |
| Sidebar: "Sair" | same | |
| Sidebar: user card with avatar, name, e-mail | same | name/e-mail/role chip "Admin" are data; the Next dev "1 Issue" badge sits over it (dev overlay, not the product) |
| Header: breadcrumb "Ciclos › <nome>" | same | |
| Header: title with Ciclo name | same | |
| Header: "Renomear" link beside the title | differs | extra blue "Renomear" control next to the title; the capture has none |
| Header: subtitle "N etapas · N matérias · XhXX por volta" | same | |
| Header actions: "Reiniciar volta" (outline, icon) and "Adicionar etapa" (blue, +) on the right | same | |
| Header action: "Arquivar" | same | not drawn, approved (AD-001) |
| Tabs: "Etapas" selected with blue underline, "Voltas" | same | |
| Tabs: "Matérias", "Faixas de acerto" | same | not drawn, approved (AD-001) |
| Volta card: "Volta N", "Iniciada em <data> · <relativo>" | same | |
| Volta card: "NN% · XhXX de XhXX" and blue progress bar across | same | |
| Volta card: "Faltam XhXX" on the right | same | |
| Volta card: "Horas extras" with value (chip "TI" shown only with extra hours) | same | no chip, no extra hours in data |
| Arrangement: Volta card full width above the table + Matérias column | same | |
| Table: columns drag handle, #, Matéria, Carga, Progresso na volta, Situação, kebab | same | |
| Table: row number in a small chip, progress bar + percent, situation chips | same | |
| Table: next Etapa row highlighted light blue with chip "Próxima etapa" | same | |
| Table: rounded bordered card | same | |
| Matérias card: title "Matérias" and "Tópicos estudados" | same | |
| Matérias card: per row name, "N etapas · XhXX" | same | |
| Matérias card: per row count "x/y" with a mini progress bar | differs | shows "—" with no bar (data has no topics; the capture shows the count and bar) |
| Cartão "Faixas de acerto" below Matérias | same | not drawn, approved (AD-001) |
| Page background and margins | same | note: whole page is a gray tone and the content is about 4px left and 16px wider on the right than in the capture |

Rows that differ: Cronômetro card, "Usuários" link, "Renomear" link, Matérias per-row topic count and bar (the last may be data-only; the verifier could not tell, so counted as a row). Verdict counted above: the first three are structural; the Matérias row is listed for the author to confirm it is data.
