# Etapas separadas de matérias

Dentro de um ciclo, a matéria aparece uma só vez e o ciclo é uma sequência de etapas, cada uma apontando para uma matéria e com carga horária própria. Uma matéria como TI pode ter várias etapas no mesmo ciclo (1h, 0:50, 1:05…), mas seus registros, tópicos e cartões de revisão são únicos. Escolhemos isso porque o ciclo intercala a mesma disciplina com outras para espaçar o estudo, e tratar cada aparição como matéria distinta fragmentava gráficos, tópicos e revisões. Complementa a ADR 0001: a matéria continua pertencendo a um único ciclo.

O registro de estudo aponta para a matéria, e suas horas preenchem em ordem as etapas incompletas dela, mesmo fora da ordem do ciclo. Horas além da soma das etapas na volta são horas extras: aparecem na interface, não aumentam o progresso além de 100% e não passam para a volta seguinte.

## Opções consideradas

- **Agrupar por nome nos gráficos**: mais simples, mas faz do nome a identidade da matéria e deixa tópicos e revisões fragmentados.
- **Escolher a etapa em cada registro**: controle explícito, mas atrapalha o cronômetro e o registro rápido.
