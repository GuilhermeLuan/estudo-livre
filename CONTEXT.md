# Estudo Livre

Aplicação self-hosted e multiusuário para organizar estudos para concursos em ciclos de estudo, registrar sessões de estudo e agendar revisões de tópicos com base no desempenho em questões.

## Linguagem

### Organização

**Usuário**:
Pessoa com conta na instância; todos os dados abaixo pertencem a um único usuário.
_Evitar_: Conta, aluno, estudante

**Admin**:
Usuário que administra a instância (cadastro aberto/fechado, redefinição de senhas). O primeiro usuário criado.
_Evitar_: Superusuário, dono

**Ciclo**:
Sequência ordenada de matérias com uma carga horária cada, estudada em voltas repetidas. Normalmente corresponde a um concurso.
_Evitar_: Plano, cronograma, concurso

**Ciclo arquivado**:
Ciclo fora de uso; seu histórico é mantido e suas revisões ficam suspensas até ser reativado.
_Evitar_: Ciclo excluído, ciclo inativo

**Matéria**:
Disciplina pertencente a exatamente um ciclo, com carga horária e posição na ordem do ciclo. Matérias de mesmo nome em ciclos diferentes são distintas.
_Evitar_: Disciplina, assunto

**Carga horária**:
Tempo de estudo que uma matéria precisa acumular para ser concluída em uma volta.
_Evitar_: Meta, peso

**Tópico**:
Item do conteúdo programático de uma matéria (ex.: "IA" em TI). Não tem subtópicos.
_Evitar_: Assunto, conteúdo, item do edital

**Tópico estudado**:
Tópico que já recebeu ao menos um registro de estudo (ou foi marcado manualmente).
_Evitar_: Tópico visto, tópico concluído

### Progresso

**Volta**:
Uma passagem completa pelo ciclo; termina quando todas as matérias atingem 100% da carga horária.
_Evitar_: Rodada, iteração

**Progresso da matéria**:
Fração da carga horária cumprida na volta atual, limitada a 100%; o excedente não passa para a volta seguinte.
_Evitar_: Saldo, crédito

**Próxima matéria**:
A primeira matéria, na ordem do ciclo, que ainda não atingiu 100% na volta atual. É uma sugestão, não uma obrigação.
_Evitar_: Matéria atual, matéria da vez

### Estudo

**Registro de estudo**:
Uma sessão de estudo de uma matéria, com data, duração, tipo, questões, acertos, anotação e, opcionalmente, um tópico ou um conteúdo livre.
_Evitar_: Sessão, lançamento, estudo

**Conteúdo livre**:
Texto digitado num registro de estudo quando ele não se refere a um tópico cadastrado.
_Evitar_: Tópico avulso

**Tipo de estudo**:
Natureza da sessão: Teoria, Exercícios, Revisão, Videoaula ou Leitura de lei.
_Evitar_: Modalidade, categoria

**Cronômetro**:
Medidor único por usuário, com pausa, que ao parar abre um registro de estudo com a duração preenchida.
_Evitar_: Timer, pomodoro

### Revisão

**Cartão de revisão**:
Estado de memorização de um tópico (estabilidade, dificuldade, próxima data), derivado de todos os registros de estudo do tópico.
_Evitar_: Flashcard, card

**Revisão**:
Momento em que um cartão de revisão vence. É cumprida por um registro de estudo do tópico com questões.
_Evitar_: Revisão agendada, tarefa de revisão

**Nota da revisão**:
Avaliação de um registro de estudo para o agendador: Errei, Difícil, Bom ou Fácil.
_Evitar_: Rating, avaliação, score

**Faixas de acerto**:
Limiares de porcentagem de acerto, definidos por ciclo, que convertem um registro em nota da revisão.
_Evitar_: Thresholds, critérios

**Mínimo de questões**:
Quantidade de questões abaixo da qual a nota da revisão é escolhida pelo usuário em vez de calculada.
_Evitar_: Amostra mínima
