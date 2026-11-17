# Interface no BoardUI screens

**Verifier**: independent sub-agent (author != verifier)
**Round**: 2
**HEAD**: 15f4cb4

Round 2: pictures re-saved at 15f4cb4; the rows marked `differs` in round 1 were reopened and nothing else was re-judged. AD-006 (trash button on the Cronômetro card) and AD-007 (native date input, date only) are now in the plan's differences table. Data differences (dates, names, numbers, Volta, Rodando/Pausado, selected tab) are not copy errors.

| Screen | Compared with | Verdict | Finding |
| --- | --- | --- | --- |
| `captures/hoje-claro-suave.running.png` | `captures/hoje-claro-suave.png` | matches | 0 rows differ |
| `captures/hoje-escuro.running.png` | `captures/hoje-escuro.png` | matches | 0 rows differ |
| `captures/pwa-hoje.running.png` | `captures/pwa-hoje.png` | matches | 0 rows differ |
| `captures/ciclo.running.png` | `captures/ciclo.png` | matches | 0 rows differ |
| `captures/registrar-estudo.running.png` | `captures/registrar-estudo.png` | matches | 0 rows differ |
| `captures/estatisticas.running.png` | `captures/estatisticas.png` | matches | 0 rows differ |
| `captures/entrar.running.png` | `captures/entrar.png` | matches | 0 rows differ |

Round-1 rows that differed, with the round-2 result (all other rows stayed `same`):

### `captures/hoje-claro-suave.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| Sidebar: Cronômetro card has no other control | same | trash button kept, AD-006 |
| "Novo ciclo" button with a + icon | same | + icon now drawn |

### `captures/hoje-escuro.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| Sidebar: Cronômetro card has no other control | same | trash button kept, AD-006 |
| "Novo ciclo" button with a + icon | same | + icon now drawn |

### `captures/pwa-hoje.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| Cronômetro card has no other control | same | trash button kept, AD-006 |

### `captures/ciclo.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| Sidebar: Cronômetro card without extra controls | same | trash button kept, AD-006 |

### `captures/registrar-estudo.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| Data field "dd/mm/aaaa · hh:mm" | same | native date input, date only, AD-007 |
| Tipo de estudo: five equal segments filling the row | same | segments now fill the row, selected one a white pill |
| Background Sidebar: Cronômetro card without extra controls | same | trash button kept, AD-006 |

### `captures/estatisticas.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| Sidebar: Cronômetro card without extra controls | same | trash button kept, AD-006 |
| Week-axis labels "22/09" style | same | "28/09", "05/10", "02/11", zero padded |
| "Acerto por matéria" labels: Matéria name only | same | Matéria names only |
| "Horas por matéria" legend "<Matéria> <tempo>" | same | Matéria and time only, no Ciclo suffix, no zero-hour entries |

### `captures/entrar.running.png`

No row differed in round 1; not re-judged.
