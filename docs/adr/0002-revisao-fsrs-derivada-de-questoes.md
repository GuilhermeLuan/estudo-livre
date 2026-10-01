# Revisão por FSRS, guiada por questões e derivada dos registros

As revisões usam FSRS (`ts-fsrs`) com um cartão por tópico. A nota da revisão vem da porcentagem de acerto do registro de estudo, convertida pelas faixas de acerto do ciclo; abaixo do mínimo de questões (padrão 5), o usuário escolhe a nota. Registros sem questões não alteram o cartão, exceto o primeiro registro do tópico, que o cria. Não há um "fazer revisão" separado: revisar é registrar estudo, e as horas contam no ciclo.

O cartão é um valor derivado: ao criar, editar ou excluir um registro (inclusive retroativo), o cartão do tópico é recalculado do zero reaplicando os registros em ordem cronológica. Isso mantém o cartão consistente com o histórico, ao custo de reprocessar algumas dezenas de registros.

## Consequências

- FSRS foi feito para flashcards; usar a % de questões é uma heurística. A nota sugerida pode ser trocada antes de salvar.
- O log de revisões é mantido para permitir, no futuro, otimizar os parâmetros do FSRS por usuário.
