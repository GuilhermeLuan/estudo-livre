# Arquivar e reativar ciclo screens

**Verifier**: independent sub-agent (author != verifier)
**Round**: 2

| Screen | Compared with | Verdict | Finding |
| --- | --- | --- | --- |
| `captures/ciclo.running.png` | `captures/ciclo.png` | matches | no row differs |

### `captures/ciclo.running.png`

Picture retaken in round 2 by a fresh screens sub-agent: 1440x960, Claro suave, INSS archived through the screen first, then the TRT Ciclo opened.

| Element | Result | Picture draws |
| --- | --- | --- |
| Sidebar: logo "Estudo Livre", items Hoje, Registros, Estatísticas | same | "Revisões" absent (approved: AD-001) |
| Sidebar: section "Ciclos" with "+" | same | |
| Sidebar: Ciclo ativo "TRT 2ª Região" selecionado em azul, com ícone de bandeira | same | name shown as "TRT 2ª Região — Analista" (sample data) |
| Sidebar: item "Arquivados" com ícone e Counter "1" à direita, logo abaixo da lista de Ciclos | same | |
| Sidebar: outro Ciclo "INSS Técnico" na lista | same | not drawn: INSS is archived in this state, which is what produces the Counter "1" |
| Sidebar: cartão do Cronômetro "Rodando" (00:42:18, Pausar, Parar) | same | not drawn: no Cronômetro is running in this state; it lives in another state |
| Sidebar: Usuários, Sair, cartão da usuária com "Admin" | same | |
| Breadcrumb "Ciclos > TRT 2ª Região — Analista" | same | |
| Título do Ciclo | same | "Renomear" link next to it (approved) |
| Subtítulo "N etapas · N matérias · carga por volta" | same | sample-data values |
| Cabeçalho à direita: "Reiniciar volta", "Arquivar" (ícone de caixa), "Adicionar etapa" (azul) na mesma linha, nessa ordem | same | |
| Abas Etapas (ativa, sublinhada), Matérias, Voltas, Faixas de acerto | same | "Matérias" absent (approved: AD-001) |
| Cartão da Volta: "Volta N", legenda, % e horas, barra azul, "Faltam", "Horas extras" com valor | same | legenda "Primeira volta" (sample data) |
| Cartão da Volta: chip da Matéria (TI) ao lado do valor de Horas extras | same | valor "5h45" sem chip ao lado (approved: AD-027) |
| Tabela de Etapas: cabeçalho #, Matéria, Carga, Progresso na volta, Situação | same | |
| Tabela: alça de arrastar, número, nome, carga, barra com %, chip de situação, menu "⋮" por linha | same | chips Concluída, Próxima etapa (linha realçada), Em andamento, Não iniciada, "+ extra"; 8 linhas em vez de 9 (sample data) |
| Painel "Matérias" com "Tópicos estudados", nome + "N etapas · carga" por Matéria | same | contagem de tópicos e barra aparecem como "—" (Matérias sem Tópicos nos dados de exemplo) |
| Painel "Faixas de acerto": título, "Editar", quatro faixas Errei, Difícil, Bom, Fácil com limites, "Mínimo de questões 5" | same | |
| Arrangement: Sidebar à esquerda, conteúdo com tabela à esquerda e painéis Matérias/Faixas empilhados à direita | same | spacing slightly tighter than the capture (note only) |
