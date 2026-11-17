# Interface no BoardUI

> Plan from this document. Each slice below carries its own shape - copy it, do not re-derive it.
> Status: confirmed by Guilherme, 2026-11-16

## Situation

- Project: em construção ativa; um único Usuário (o próprio Admin) usa a instância.
- Decision: committed by Guilherme, 2026-11-16, nesta conversa: as telas existentes passam a seguir o arquivo Figma "Estudo Livre — BoardUI".
- In flight: as issues abertas de interface (#5, #6, #7, #8, #10, #11, #12) ficam fora e passam a nascer no visual novo; o comportamento das telas atuais (casos de uso, server actions, arrastar etapas) é o precedente e não muda.
- At stake: barato de errar - só interface, sem dados, revertível; o custo real é cada issue de interface aberta ser feita duas vezes enquanto a troca não acontece.

## Problem

Construção. O visual atual (`docs/design-system.md` + `prototype/index.html`: escuro por padrão, Geist, barra superior, disco do ciclo) deixou de ser o que o projeto quer, e o Figma em BoardUI passou a ser a referência. Enquanto as telas existentes não forem trocadas, toda tela nova fica sem um padrão coerente: ou segue o protótipo (que a regra do `AGENTS.md` ainda manda seguir) e será refeita, ou segue o Figma e convive com telas no visual antigo. Por isso agora, antes das próximas issues de interface. Não há número a medir: é um app de uma pessoa, e a pessoa decidiu.

## Success

- Worked if: as 9 rotas existentes reproduzem os frames do Figma no claro e no escuro, e nenhum token antigo (`paper`, `ink`, `surface`, `line`, `--r-*`) resta no código.
- Going wrong: a primeira issue de interface depois da troca precisa inventar um componente que o BoardUI já tem, ou pede uma exceção visual ao design system.
- Review: ao fechar a primeira issue de interface depois da troca - Guilherme.

## Boundary

In: as telas que já existem (`/`, `/ciclos/[id]`, `/ciclos/novo`, `/estatisticas`, `/usuarios`, `/entrar`, `/cadastrar`, `/esqueci-senha`, `/redefinir-senha`), o Cronômetro, o formulário de Registro de estudo, a navegação, o tema e os documentos que definem a interface.

Out: Revisões, histórico de Registros, Tópicos, Ciclo arquivado e Faixas de acerto, que estão no Figma - entram pelas issues próprias (#5, #7, #10, #11, #12) já no visual novo. Telas novas para celular além da Hoje - o Figma só desenha a Hoje no PWA.

Unchanged: o schema, as rotas, as server actions, o manifest do PWA e o arrastar de etapas (dnd-kit). A troca não muda nenhum dado nem nenhuma regra de domínio; `src/casos-de-uso` só ganha leituras novas (indicadores da Hoje, progresso por etapa no Ciclo, variação semanal), decididas em `.specs/STATE.md` AD-003 a AD-005.

## Shape

O BoardUI entra no repositório como código-fonte nosso: os tokens, a tipografia e os componentes gratuitos instalados pelo MCP, sobre o Tailwind v4 que o projeto já usa. Cada tela é reescrita com esses componentes e com os componentes do produto desenhados no Figma (Sidebar, StatCard, EtapaRow, RevisaoItem). A porta é a fonte da verdade: depois da troca, o `AGENTS.md` aponta para o Figma, e voltar atrás significa refazer as telas de novo.

A alternativa mais pesada seria reescrever os componentes à mão só com os tokens, sem as dependências do BoardUI (`react-aria-components`, `@remixicon/react`). Ela só ganharia se o projeto quisesse zero JavaScript de cliente nos formulários, e ele já tem componentes de cliente (Cronômetro, lista de etapas).

## Key decisions

1. **O arquivo Figma "Estudo Livre — BoardUI" é a referência visual; o protótipo é apagado e o `docs/design-system.md` é reescrito a partir do BoardUI.** A regra de interface do `AGENTS.md` passa a dizer "Figma vence, o documento é corrigido". Manter o protótipo no repositório faria o próximo agente seguir o visual antigo, porque a regra atual diz que ele vence.
2. **Só os tokens semânticos do BoardUI existem; os tokens antigos são apagados, não mapeados.** Nada de `paper`→`background-full` como apelido: um apelido é a convivência de dois design systems que a troca existe para acabar.
3. **Os componentes do BoardUI ficam no repositório como código nosso, e os componentes do produto são construídos sobre eles.** Button, Input, Select, SegmentedControl, Checkbox, Chip, Counter, Avatar, Modal, Progress, Tabs, Table e ThemeToggle vêm do BoardUI. Sidebar, StatCard, EtapaRow e RevisaoItem são do produto e seguem o Figma.
4. **O tema segue o sistema operacional, com troca manual guardada no aparelho, e o claro é o "Claro suave" do Figma (AD-002).** O ThemeToggle do BoardUI, por padrão, ignora a preferência do sistema; não copie esse padrão.
5. **O disco do ciclo sai.** O progresso da volta é uma barra (Progress) e a lista de etapas; `DiscoDoCiclo` deixa de existir.
6. **No computador a navegação é a Sidebar; no celular é uma barra de abas inferior com o botão central de Registrar estudo.** As duas só mostram rotas que existem: Hoje, Estatísticas, os Ciclos ativos, Usuários (só para o Admin) e Sair.

## Work

| Slice | Delivers | Status |
|---|---|---|
| [Fundação BoardUI](#fundação-boardui) | tokens, Inter, tema do sistema e componentes base no repositório | clear |
| [Sidebar](#sidebar) | estrutura do app com Sidebar no computador e barra de abas no celular, com o Cronômetro | open — 2 defaults taken |
| [Hoje](#hoje) | `/` como no Figma, nas versões de computador e PWA | clear |
| [Ciclo](#ciclo) | `/ciclos/[id]` e `/ciclos/novo` sem o disco | open — 1 default taken |
| [Registro de estudo](#registro-de-estudo) | o formulário de registro como o modal do Figma | clear |
| [Estatísticas](#estatísticas) | `/estatisticas` como no Figma | clear |
| [Conta](#conta) | `/entrar`, `/cadastrar`, `/esqueci-senha`, `/redefinir-senha` e `/usuarios` | open — 1 default taken |
| [Design system](#design-system) | `docs/design-system.md` reescrito, protótipo removido, `AGENTS.md` atualizado | clear |

Order: Fundação BoardUI → Sidebar → Hoje → Registro de estudo → Ciclo → Estatísticas → Conta → Design system. As fatias são entregues juntas: com um único Usuário, não há período em que telas antigas e novas convivam em produção.

Already handled by existing code: mensagens de erro e validação dos formulários → as server actions atuais; Cronômetro que sobrevive a fechar a aba → o estado guardado no servidor; ordem das etapas → o arrastar atual.

Derivable from the repository, left to the plan: textos em pt-BR no vocabulário do `CONTEXT.md`, como as telas atuais já fazem; formatação de horas (`1h10`) e porcentagens, como `formato.ts` faz; ícones Remix escolhidos nos frames do Figma.

### Fundação BoardUI

**Delivers** os tokens semânticos, a escala de texto e os componentes base do BoardUI no repositório, com Inter como fonte. **Status: clear.** É a porta: as outras fatias dependem dela (Key decisions 2, 3 e 4).

| State | What should happen |
|---|---|
| Primeira visita, sistema em modo claro | Tema claro |
| Primeira visita, sistema em modo escuro | Tema escuro, sem piscar o claro antes de carregar |
| Usuário troca o tema manualmente | A escolha vale naquele aparelho e sobrepõe a preferência do sistema |
| Usuário volta a seguir o sistema | Remove a escolha manual |
| PWA instalado | A cor da barra do aparelho acompanha o tema |

Alternatives considered: tema claro fixo como padrão - ganharia se o Figma fosse desenhado só no claro, mas o modo Dark já existe nas variáveis do arquivo.

### Sidebar

**Delivers** o layout de `(app)`: a Sidebar flutuante no computador e a barra de abas no celular, com o Cronômetro dentro. **Status: open — 2 defaults taken.** Key decision 6.

| State | What should happen |
|---|---|
| Computador, Cronômetro parado | A Sidebar não mostra o card do Cronômetro |
| Computador, Cronômetro rodando ou pausado | Card do Cronômetro na Sidebar, com tempo, matéria e as ações Pausar/Retomar e Parar |
| Celular, Cronômetro rodando, na Hoje | Card grande do Cronômetro no topo da Hoje |
| Celular, Cronômetro rodando, fora da Hoje | Faixa compacta acima da barra de abas |
| Usuário que não é Admin | Sem o link Usuários |
| Sem Ciclos | A seção Ciclos da Sidebar mostra só "Novo ciclo" |
| Rota atual | O item correspondente fica selecionado (NavItem selecionado) |

1. Em que largura a Sidebar vira barra de abas - padrão: abaixo de 1024px.
2. O Cronômetro fora da Hoje no celular - padrão: faixa compacta acima da barra de abas, como no comportamento atual.

### Hoje

**Delivers** a rota `/` como os frames "Hoje" e "PWA — Hoje" do Figma: indicadores, Ciclos ativos com progresso da volta e Próxima etapa. **Status: clear.** Key decision 5.

| State | What should happen |
|---|---|
| Sem Ciclos | Estado vazio com "Criar ciclo"; sem indicadores zerados |
| Ciclo com volta recém-iniciada | Barra em 0% e Próxima etapa = primeira etapa |
| Etapa com horas extras | Chip "+Xh extra" na matéria |
| Todas as etapas a 100% | Não ocorre na tela: a volta fecha e a próxima começa |

Fora da Hoje enquanto as issues não existirem: o card "Revisões de hoje" do Figma (#12) e o indicador de revisões.

### Ciclo

**Delivers** `/ciclos/[id]` como o frame "Ciclo — Etapas" (cabeçalho, volta atual, lista de etapas com EtapaRow e a lateral de Matérias) e `/ciclos/novo` no padrão de formulário do BoardUI. **Status: open — 1 default taken.** Key decision 5.

| State | What should happen |
|---|---|
| Ciclo sem etapas | Estado vazio com "Adicionar etapa" |
| Arrastando uma etapa | A EtapaRow arrastada fica destacada e a ordem é salva ao soltar, como hoje |
| Próxima etapa | A linha fica realçada com o chip "Próxima etapa" |
| Etapa concluída | Barra verde (chart/2) e chip "Concluída" |
| Celular | A lateral de Matérias desce para baixo da lista de etapas |

1. As abas Matérias, Voltas e Faixas de acerto do Figma - padrão: não aparecem até as issues delas (#6, #10) existirem.

### Registro de estudo

**Delivers** o formulário de Registro de estudo como o modal "Registrar estudo" do Figma, aberto pelo botão "Registrar estudo" e pelo "Parar" do Cronômetro. **Status: clear.**

| State | What should happen |
|---|---|
| Aberto pelo "Parar" do Cronômetro | Duração preenchida, com a nota "Duração preenchida pelo cronômetro" |
| Aberto pela Próxima etapa | Matéria já escolhida |
| Celular | O modal ocupa a tela como uma folha que sobe de baixo |
| Erro de validação (acertos > questões) | Mensagem no campo, no estilo de erro do Input |

Os campos que o Figma mostra e que o formulário ainda não tem (Tópico, Nota da revisão) entram com as issues deles (#7, #10).

### Estatísticas

**Delivers** `/estatisticas` como o frame do Figma: StatCards, horas por semana, acerto por matéria e horas por matéria. **Status: clear.**

| State | What should happen |
|---|---|
| Sem registros | Estado vazio com "Registrar estudo"; sem gráficos zerados |
| Matéria sem questões | Aparece em horas e fica fora de acerto por matéria |
| Celular | Os cards se empilham em uma coluna |

### Conta

**Delivers** as rotas de `(conta)` no AuthCard do frame "Entrar", e `/usuarios` com a Table do BoardUI. **Status: open — 1 default taken.**

| State | What should happen |
|---|---|
| Sem SMTP | Sem "Esqueci minha senha", como hoje |
| Cadastro fechado | `/cadastrar` mostra o aviso no AuthCard, como hoje |
| Admin redefine senha | Formulário inline na linha do Usuário |

1. Cadastrar, Esqueci senha, Redefinir senha e Usuários não têm frame no Figma - padrão: seguem o AuthCard da tela Entrar e a Table das tabelas do Figma, e o frame é acrescentado ao arquivo depois.

### Design system

**Delivers** o `docs/design-system.md` reescrito com os tokens e componentes do BoardUI, a regra de interface do `AGENTS.md` apontando para o Figma, e `prototype/` removido. **Status: clear.** Key decision 1.

| State | What should happen |
|---|---|
| Uma tela nova precisa de algo que o Figma não tem | Segue os princípios do documento, e o frame é acrescentado ao Figma |
| Figma e documento divergem | O Figma vence; o documento é corrigido no mesmo PR |

## Sources

- Figma "Estudo Livre — BoardUI" (https://www.figma.com/design/ig7Pq2uPxPWjeWuCKmTuBW) - frames de referência: Hoje, Hoje (dark), PWA — Hoje, Ciclo — Etapas, Registrar estudo (modal), Revisões, Registros, Matéria — Tópicos, Entrar, Estatísticas.
- BoardUI (https://www.boardui.com) - tokens, tipografia e componentes gratuitos.
- `docs/design-system.md` e `prototype/index.html` - o visual que esta troca substitui.
- Issue #1 (Spec do MVP) e `CONTEXT.md` - vocabulário e escopo das telas.
