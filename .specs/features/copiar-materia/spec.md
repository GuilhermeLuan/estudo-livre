# Copiar matéria de outro ciclo Specification

**Approved**: 2026-11-21 - user: "Aprovado"

## Problem Statement

Concursos diferentes têm conteúdos programáticos parecidos, e o Usuário redigita a Matéria e todos os Tópicos em cada Ciclo. A issue #8 pede copiar uma Matéria de outro Ciclo ao adicionar uma Etapa, levando nome, carga horária e Tópicos (ADR-0001), sem trazer histórico.

## Goals

- [ ] O Usuário cria, no modal "Adicionar etapa", uma Matéria nova a partir de outra de um Ciclo seu, com nome, carga horária e todos os Tópicos, em um passo.
- [ ] A origem nunca muda e a cópia não herda Registros, Tópico estudado nem Cartões de revisão.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Copiar as Etapas da origem como estão (várias, com ordem relativa) | Decidido: a cópia cria uma só Etapa com a carga somada, editável |
| Mesclar na Matéria de mesmo nome do destino | Decidido: nome repetido é recusado |
| Copiar Registros, Cartões, Faixas de acerto ou o estado de Tópico estudado | A issue e o ADR-0001 excluem |
| Copiar um Ciclo inteiro | Não pedido |
| Manter vínculo entre a cópia e a origem | A cópia é independente |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Nome repetido no destino | Recusa com "Este ciclo já tem a matéria “<nome>”." e nada é copiado | Pergunta "Se o Ciclo de destino já tem uma Matéria com o mesmo nome...?" - opção "Recusar com erro (Recommended)" | y - user answered the question |
| Carga horária da cópia | Uma Etapa no fim do Ciclo; "Carga horária (h)" vem preenchida com a soma das Etapas da origem e é editável; sem Etapas na origem, vem vazia | Pergunta "Como entra a carga horária na cópia?" - opção "Uma Etapa, carga editável (Recommended)" | y - user answered the question |
| Origens | Matérias de todos os outros Ciclos do Usuário, ativos e arquivados | Pergunta "Quais Matérias aparecem no seletor?" - opção "Também de Ciclos arquivados (Recommended)"; copiar só lê a origem | y - user answered the question |
| Ordem do seletor | Por Ciclo (mais recente primeiro), Matérias em ordem alfabética | Padrão do código; não é decisão de produto | y - default of the code |
| Volta aberta | Seguem as regras de adicionar Etapa: a Etapa nova entra sem progresso, e o aviso de Volta concluída aparece quando ela fechar a Volta (AD-018) | Reaproveita `adicionarEtapa` | y - default of the code |
| Ciclo de destino arquivado | O botão "Adicionar etapa" não existe; o caso de uso recusa com "Ciclo arquivado. Reative para alterar." (AD-024) | Guarda existente | y - default of the code |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Copiar uma Matéria de outro Ciclo ⭐ MVP

**User Story**: Como Usuário, quero copiar uma Matéria de outro Ciclo ao adicionar uma Etapa para não redigitar nome, carga e Tópicos.

**Why P1**: É a issue inteira.

**Acceptance Criteria**:

1. WHILE algum outro Ciclo do Usuário tem Matérias, WHEN o Usuário abre "Adicionar etapa" THEN the system SHALL mostrar o seletor "Copiar de outro ciclo" com cada Matéria desses Ciclos rotulada "<Matéria> · <Ciclo>", e os arquivados com "(arquivado)" depois do nome do Ciclo
2. WHEN o Usuário escolhe uma Matéria no seletor THEN the system SHALL preencher "Nome da matéria" com o nome dela e "Carga horária (h)" com a soma das cargas das Etapas dela, em horas, ambos editáveis
3. IF a Matéria escolhida não tem Etapas THEN the system SHALL deixar "Carga horária (h)" vazio
4. WHEN o Usuário envia "Adicionar etapa" com uma Matéria de origem escolhida THEN the system SHALL criar no Ciclo de destino uma Matéria nova com o nome do campo, uma Etapa no fim do Ciclo com a carga do campo, e uma cópia de cada Tópico da origem com o mesmo nome e a mesma ordem
5. The system SHALL criar os Tópicos copiados como não estudados, sem Registros de estudo e sem Cartão de revisão
6. WHEN a cópia é criada THEN the system SHALL manter inalterados a Matéria de origem, as Etapas, os Tópicos, o estado de estudado, os Registros e os Cartões dela
7. WHEN o Usuário renomeia, exclui ou marca um Tópico da cópia, acrescenta Tópico, edita ou remove a Etapa dela, ou registra estudo nela THEN the system SHALL manter a origem inalterada
8. WHEN o Usuário escolhe a opção "Nova matéria" do seletor THEN the system SHALL manter os campos como estão e não copiar nada
9. WHILE nenhum outro Ciclo do Usuário tem Matérias the system SHALL abrir "Adicionar etapa" sem o seletor, como hoje
10. WHEN o Usuário envia "Adicionar etapa" sem origem escolhida THEN the system SHALL criar a Etapa como hoje, reaproveitando a Matéria de mesmo nome do Ciclo, se houver

**Independent Test**: Num Ciclo A com a Matéria "Português" (2 Etapas somando 3 h, 4 Tópicos, 1 estudado, com Registros), abrir "Adicionar etapa" no Ciclo B, escolher "Português · A", enviar, e ver "Português" no B com 3 h, 4 Tópicos não estudados e sem Registros, e o A igual a antes.

---

### P1: Recusas ⭐ MVP

**User Story**: Como Usuário, quero que uma cópia inválida seja recusada inteira, sem deixar Matéria pela metade.

**Why P1**: A cópia grava Matéria, Etapa e Tópicos juntos.

**Acceptance Criteria**:

1. IF o Ciclo de destino já tem uma Matéria com o nome do campo, sem diferenciar maiúsculas THEN the system SHALL recusar com "Este ciclo já tem a matéria “<nome>”." sob o formulário e não criar Matéria, Etapa nem Tópicos
2. IF a carga do campo não é maior que zero ou passa de 10.000 horas THEN the system SHALL recusar com "A carga horária precisa ser maior que zero e no máximo 10.000 horas." e não criar nada
3. IF o nome do campo está vazio THEN the system SHALL recusar com "Informe o nome da matéria." e não criar nada
4. IF a Matéria de origem não existe, é de outro Usuário ou é do próprio Ciclo de destino THEN the system SHALL recusar a cópia sem criar nada
5. IF o Ciclo de destino está arquivado THEN the system SHALL recusar com "Ciclo arquivado. Reative para alterar." sem criar nada
6. IF qualquer gravação da cópia falha THEN the system SHALL desfazer tudo, sem Matéria, Etapa nem Tópico novos

**Independent Test**: Copiar "Português" para um Ciclo que já tem "português" e ver o erro, sem Etapa nova.

---

## Edge Cases

- IF a origem tem Matéria sem Tópicos THEN the system SHALL criar a cópia sem Tópicos
- IF o Usuário muda o nome no campo antes de enviar THEN the system SHALL criar a cópia com o nome do campo
- WHEN a mesma cópia é enviada duas vezes seguidas THEN the system SHALL criar a primeira e recusar a segunda por nome repetido

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| COPIA-01 | P1: Copiar (critérios 1-3, 8-10) | Tasks | Pending |
| COPIA-02 | P1: Copiar (critérios 4-5) | Tasks | Pending |
| COPIA-03 | P1: Copiar (critérios 6-7) | Tasks | Pending |
| COPIA-04 | P1: Recusas (critérios 1-6) | Tasks | Pending |

**Coverage:** 4 total, 0 mapped to tasks, 4 unmapped ⚠️

---

## Sources

- Issue #8 (`GuilhermeLuan/estudo-livre`) - critérios: Matéria nova com nome, carga e Tópicos; Registros, estudado e Cartões não copiados; cópia independente
- `docs/adr/0001-materias-pertencem-a-um-unico-ciclo.md` - a cópia leva nome, carga e Tópicos, nunca Registros nem Cartões
- Figma "Estudo Livre — BoardUI" (`ig7Pq2uPxPWjeWuCKmTuBW`), frame do modal "Adicionar etapa" - o modal mantém a composição atual; o seletor "Copiar de outro ciclo" não é desenhado e segue o design system (`Select`, `Modal`, `Button`)

---

## Success Criteria

- [ ] Copiar uma Matéria com N Tópicos cria Matéria, Etapa e N Tópicos no destino em uma única ação
- [ ] Nenhuma tabela da origem muda em nenhuma cópia
