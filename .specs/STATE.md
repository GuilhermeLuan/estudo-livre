# Project state

## Decisions

| ID | Decision | Rationale | Status | Date |
| --- | --- | --- | --- | --- |
| AD-001 | A troca para o BoardUI só reestiliza o que já existe: o que o Figma desenha e o app não tem (Revisões, Registros, Tópicos, Arquivados, Faixas de acerto, Reiniciar volta, Arquivar, Nota da revisão, Próxima revisão estimada, abas do Ciclo, Tópicos estudados) não aparece, e o que o app tem e o Figma não desenha (renomear ciclo, editar e remover etapa, Horas e Minutos separados) continua | tlc-discover, pergunta 3 "Escopo é só reestilizar as telas existentes? As features só do Figma entram pelas issues delas" - user: "Concordo"; a Sidebar e a barra de abas só mostram links que funcionam | active | 2026-11-16 |
| AD-002 | O tema claro do app é o "Claro suave" do Figma; o "Light" original do BoardUI não é usado | pergunta "O Claro suave substitui o claro original, ou vira uma terceira opção?" - opção "Substitui o claro (Recommended)" | active | 2026-11-16 |
| AD-003 | Os indicadores da Hoje são Estudado hoje, Questões hoje e Nesta semana; "Revisões de hoje" sai até a issue #12 | pergunta "O que fazer com a linha de indicadores?" - opção "Calcular 3, tirar Revisões (Recommended)" | active | 2026-11-16 |
| AD-004 | Nas Estatísticas, só "Nesta semana" mostra variação (contra a semana anterior); Horas estudadas, Acerto geral e Questões aparecem sem variação | pergunta "O que fazer com as variações?" - opção "Só a das horas (Recommended)" | active | 2026-11-16 |
| AD-005 | Na tela do Ciclo, "Iniciada em <data> · há N dias" aparece da Volta 2 em diante; na Volta 1 aparece "Primeira volta" | pergunta "Como mostrar o início da volta?" - opção "Mostrar quando houver (Recommended)" | active | 2026-11-16 |
| AD-006 | O cartão do Cronômetro mantém o botão de lixeira "Descartar cronômetro", que o Figma não desenha | pergunta "O que faço com a lixeira que o Figma não desenha?" - opção "Manter a lixeira (Recommended)"; AD-001 já mantém o que o app tem e o Figma não desenha | active | 2026-11-17 |
| AD-007 | O campo Data do modal de registro é a entrada de data do navegador, sem hora; o Figma desenha "dd/mm/aaaa · hh:mm" | pergunta "Como fica o campo Data?" - opção "Data do navegador, sem hora (Recommended)"; o app só guarda o dia | active | 2026-11-17 |
