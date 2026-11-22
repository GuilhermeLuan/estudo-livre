# Exportar e importar backup em JSON Specification

**Approved**: 2026-11-22 - user: "aprovado, pode implementar"

## Problem Statement

Numa instância self-hosted, o Usuário só tem os próprios dados enquanto o banco existe e enquanto alguém com acesso a ele faz backup. Ele precisa guardar tudo o que estudou num arquivo legível e versionado e restaurar esse arquivo depois, na mesma conta, em outra conta ou em outra instância (issue #33).

## Goals

- [ ] O Usuário baixa, com um clique, um arquivo `.json` com todos os seus Ciclos e o que pende deles.
- [ ] Importar esse arquivo numa conta reproduz o mesmo estado: horas, Voltas, progresso das Etapas e próximas revisões.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Backup da instância inteira pelo Admin | A issue deixa fora: aqui é por Usuário |
| Somar o backup aos Ciclos existentes, ou importar só alguns Ciclos | AD-032: importar substitui tudo |
| Exportar ou importar o Cronômetro, sessões, senha, e-mail, nome ou o papel de Admin | Critério da issue: credenciais e estado efêmero ficam fora |
| Importar formatos de outros apps (planilha, CSV) | Não pedido |
| Backup automático ou agendado | Não pedido |
| Frame no Figma para a página | A issue diz que não há; a página segue o design system e o documento é atualizado no mesmo PR |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Nome do arquivo exportado | `estudo-livre-backup-AAAA-MM-DD.json`, com a data de hoje em Brasília | Legível e ordenável; o app já usa o dia de Brasília (`hojeEmBrasilia`) | n |
| Identificadores na importação | Todo Ciclo, Matéria, Etapa, Volta, Tópico e Registro recebe um id novo; os ids do arquivo só ligam as partes entre si | Importar em outra conta da mesma instância colidiria com os ids originais | y - fato do schema (chaves primárias globais) |
| Datas no arquivo | Instantes em ISO 8601 com fuso (UTC, `Z`) | Formato legível e sem ambiguidade de fuso | n |
| Mensagem de arquivo inválido | Uma só: "O arquivo não é um backup válido do Estudo Livre." para JSON malformado, formato errado, campo faltando ou referência quebrada | O Usuário não conserta o arquivo à mão; um texto claro basta | n |
| Aviso após importar | Aviso de sucesso "Backup importado: N ciclos." na própria página | A issue pede `Aviso` para o resultado | n |
| Exportar com conta vazia | Permitido: baixa um arquivo com a lista de Ciclos vazia | Simples e coerente; importar esse arquivo esvazia a conta (AD-032) | n |
| Ordem das chaves e dos itens no arquivo | Ciclos pela data de criação; Etapas por posição; Voltas por número; Tópicos por posição; Registros por data e hora | Duas exportações do mesmo estado saem iguais, o que permite comparar | n |

**Open questions:** none - todas resolvidas acima ou nas AD-032 a AD-036.

---

## User Stories

### P1: Exportar ⭐ MVP

**User Story**: Como Usuário, quero baixar todos os meus dados num arquivo JSON para guardar um backup que não depende do banco.

**Why P1**: Sem exportar não há o que importar.

**Acceptance Criteria**:

1. The system SHALL mostrar na Sidebar, no bloco Conta, o item "Backup" ligado a `/backup`, e no menu da conta do celular (< 1024px) o item "Backup"
2. WHEN o Usuário abre `/backup` THEN the system SHALL mostrar o título "Backup", um cartão "Exportar" com o texto "Baixe um arquivo JSON com seus ciclos, registros e revisões." e o botão "Exportar backup", e um cartão "Importar" (BKP-05)
3. WHEN o Usuário usa "Exportar backup" THEN the system SHALL baixar o arquivo `estudo-livre-backup-<AAAA-MM-DD>.json`, com a data de hoje em Brasília
4. The system SHALL gravar no arquivo exportado `"formato": "estudo-livre"`, `"versao": 1` e `"exportadoEm"` com o instante da exportação
5. The system SHALL incluir no arquivo exportado cada Ciclo do Usuário, ativo ou arquivado, com nome, data de criação, data de arquivamento (nula se ativo), Faixas de acerto e Mínimo de questões, e dentro dele suas Matérias, Etapas (carga e posição), Voltas (número, início e fim), Tópicos (nome, posição e Tópico estudado), Registros de estudo (todos os campos, inclusive a data de criação), Cartões de revisão e o log de revisões
6. The system SHALL omitir do arquivo exportado o Cronômetro, as sessões, a senha, o e-mail, o nome do Usuário e o papel de Admin
7. The system SHALL exportar só os Ciclos do Usuário da sessão, nunca os de outro Usuário
8. IF quem pede a exportação não tem sessão THEN the system SHALL responder sem dados e levar à tela de entrar

**Independent Test**: Criar um Ciclo com Registros, usar "Exportar backup" e ler no arquivo a versão, a data e os Registros.

---

### P1: Importar ⭐ MVP

**User Story**: Como Usuário, quero carregar um backup exportado para restaurar meus dados nesta conta.

**Why P1**: É a outra metade do backup.

**Acceptance Criteria**:

1. WHEN o Usuário abre `/backup` THEN the system SHALL mostrar no cartão "Importar" o texto "Os ciclos do arquivo substituem todos os ciclos desta conta.", um campo de arquivo que aceita `.json` e o botão "Importar backup"
2. IF o Usuário usa "Importar backup" sem escolher arquivo THEN the system SHALL mostrar "Escolha um arquivo." sob o campo e não alterar nada
3. WHILE a conta do Usuário não tem nenhum Ciclo, WHEN ele usa "Importar backup" com um arquivo THEN the system SHALL importar sem pedir confirmação
4. WHILE a conta do Usuário tem N ≥ 1 Ciclos (ativos ou arquivados), WHEN ele usa "Importar backup" com um arquivo THEN the system SHALL abrir um AlertDialog com o título "Substituir seus dados?", o texto "Os N ciclos desta conta, com registros e revisões, serão apagados e trocados pelos do arquivo. Isso não pode ser desfeito." (com N = 1, "O ciclo desta conta, com registros e revisões, será apagado e trocado pelos do arquivo. Isso não pode ser desfeito.") e os botões "Cancelar" e "Substituir"
5. WHEN o Usuário usa "Cancelar" no AlertDialog THEN the system SHALL fechar o diálogo e não alterar nada
6. WHEN a importação é concluída THEN the system SHALL apagar todos os Ciclos do Usuário (e o que pende deles) e criar os Ciclos do arquivo na conta do Usuário da sessão, numa única transação
7. WHEN a importação é concluída THEN the system SHALL mostrar o aviso de sucesso "Backup importado: N ciclos." (com N = 1, "Backup importado: 1 ciclo."), com N = quantidade de Ciclos do arquivo, e a Sidebar passa a mostrar os Ciclos importados
8. The system SHALL recalcular, na importação, o Cartão de revisão e o log de cada Tópico a partir dos Registros importados, ignorando os Cartões e o log do arquivo (AD-035)
9. The system SHALL importar os Ciclos arquivados do arquivo como arquivados, com a mesma data de arquivamento
10. The system SHALL gravar os dados importados só na conta do Usuário da sessão

**Independent Test**: Exportar uma conta com dois Ciclos, importar o arquivo numa conta vazia e ver os mesmos Ciclos na Sidebar.

---

### P1: Recusa sem alterar nada ⭐ MVP

**User Story**: Como Usuário, quero que um arquivo ruim seja recusado sem estragar o que já tenho.

**Why P1**: A importação apaga tudo (AD-032); um erro no meio não pode deixar a conta pela metade.

**Acceptance Criteria**:

1. IF o arquivo não é JSON, não tem `"formato": "estudo-livre"`, falta um campo obrigatório, tem um campo com tipo ou valor fora do que o app aceita, ou uma referência a Matéria ou Tópico que não existe no arquivo THEN the system SHALL recusar com "O arquivo não é um backup válido do Estudo Livre." e não alterar nada
2. IF o arquivo tem `"formato": "estudo-livre"` e uma `"versao"` diferente de 1 THEN the system SHALL recusar com "Versão de backup desconhecida: <versao>." e não alterar nada
3. IF o arquivo passa de 50 MB THEN the system SHALL recusar com "O arquivo passa de 50 MB." e não alterar nada (AD-034)
4. IF o Usuário tem Cronômetro ativo THEN the system SHALL recusar com "Pare ou descarte o cronômetro antes de importar." e não alterar nada (AD-036)
5. IF a gravação falha no meio da importação THEN the system SHALL desfazer tudo e deixar os Ciclos do Usuário como estavam antes
6. IF quem pede a importação não tem sessão THEN the system SHALL recusar sem alterar nada

**Independent Test**: Importar um arquivo com `"versao": 2` numa conta com Ciclos e ver a mensagem e os Ciclos intactos.

---

### P1: Ida e volta fiel ⭐ MVP

**User Story**: Como Usuário, quero que restaurar um backup me devolva exatamente o estado de quando exportei.

**Why P1**: É o que faz do arquivo um backup.

**Acceptance Criteria**:

1. WHEN um arquivo exportado da conta A é importado na conta B e B é exportada THEN the system SHALL produzir um arquivo igual ao de A, exceto pelos ids e por `exportadoEm`
2. WHEN um arquivo exportado é importado THEN the system SHALL mostrar, para cada Ciclo, a mesma Volta atual, o mesmo Progresso da etapa em cada Etapa, as mesmas Horas extras, os mesmos totais de horas nas Estatísticas e a mesma data de próxima revisão em cada Tópico que a conta de origem mostrava

**Independent Test**: Exportar, importar numa conta vazia, comparar a tela do Ciclo e as Estatísticas das duas contas.

---

## Edge Cases

- WHEN o arquivo tem a lista de Ciclos vazia THEN the system SHALL apagar os Ciclos da conta (depois da confirmação) e mostrar "Backup importado: 0 ciclos."
- WHEN o Usuário importa o mesmo arquivo duas vezes THEN the system SHALL deixar a conta com os Ciclos do arquivo uma só vez
- IF um Registro do arquivo não tem Tópico nem conteúdo livre THEN the system SHALL importá-lo assim (é um Registro válido)

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| BKP-01 | P1: Exportar (Sidebar, celular, página /backup) | Specify | Pending |
| BKP-02 | P1: Exportar (arquivo, nome, versão e data) | Specify | Pending |
| BKP-03 | P1: Exportar (conteúdo e o que fica fora) | Specify | Pending |
| BKP-04 | P1: Exportar (só o próprio Usuário, sessão) | Specify | Pending |
| BKP-05 | P1: Importar (cartão, campo, sem arquivo) | Specify | Pending |
| BKP-06 | P1: Importar (confirmação, cancelar) | Specify | Pending |
| BKP-07 | P1: Importar (substitui, aviso, arquivados) | Specify | Pending |
| BKP-08 | P1: Importar (Cartões recalculados) | Specify | Pending |
| BKP-09 | P1: Recusa (inválido, versão, tamanho) | Specify | Pending |
| BKP-10 | P1: Recusa (Cronômetro, falha, sessão) | Specify | Pending |
| BKP-11 | P1: Ida e volta fiel | Specify | Pending |

**Coverage:** 11 total, 0 mapped to tasks, 11 unmapped ⚠️

---

## Sources

- Issue #33 (https://github.com/GuilhermeLuan/estudo-livre/issues/33) - o que construir, critérios e componentes (`Button`, `AlertDialog`, `Aviso`, campo de arquivo)
- ADR-0002 - Cartão e log são derivados dos Registros
- AD-032 a AD-036 em `.specs/STATE.md`
- Sem frame no Figma: a página segue `docs/design-system.md`, atualizado no mesmo PR

---

## Success Criteria

- [ ] Exportar, importar numa conta vazia e exportar de novo dá o mesmo arquivo, fora ids e data.
- [ ] Nenhum arquivo recusado muda um só dado da conta.
