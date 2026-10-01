# Design System

Fonte da verdade visual do Estudo Livre. Derivado do protótipo em `prototype/index.html`: quando este documento e o protótipo divergirem, o protótipo vence e este documento deve ser corrigido.

Vocabulário de domínio segue o `CONTEXT.md` (Ciclo, Matéria, Volta, Registro de estudo, Revisão…).

## Princípios

1. **O ciclo é o centro.** O disco do ciclo (fatias proporcionais à carga horária, preenchidas pelo progresso da volta) é o único elemento visual "forte". Todo o resto é discreto.
2. **Escuro por padrão.** O tema escuro é o padrão; o claro é alternativa via `data-theme="light"` no `<html>`.
3. **Densidade de painel.** Texto pequeno (15px base, 13–14px em listas), cards com borda fina, pouca sombra.
4. **Cor tem significado.** Azul = ação/progresso/atual; verde = concluído; vermelho = atrasado/erro/acerto baixo. Nunca usar cor só para decorar.
5. **Escrita direta, pt-BR, em sentence case.** Botões dizem o que acontece ("Salvar registro", "Iniciar cronômetro"). Mensagens de vazio dizem o que fazer.

## Tokens

Definidos como variáveis CSS em `:root`. Em código (Tailwind), mapeie estes nomes para o tema; não use cores literais nos componentes.

### Cores

| Token | Escuro (padrão) | Claro | Uso |
|---|---|---|---|
| `--paper` | `#0B0F19` | `#F4F6FA` | Fundo da página, fundo de inputs |
| `--surface` | `#121826` | `#FFFFFF` | Cards, painéis, diálogos |
| `--surface-2` | `#182033` | `#F0F3F8` | Superfície secundária: botões neutros, métricas, painel do disco |
| `--ink` | `#F1F4F9` | `#0F172A` | Texto principal |
| `--ink-2` | `#A7B0C0` | `#4B5568` | Texto secundário, rótulos |
| `--line` | `#222B3D` | `#E2E7EF` | Bordas, divisores, trilho de barras e do disco |
| `--accent` | `#2F6BFF` | `#2457E6` | Botão primário, progresso, item ativo |
| `--accent-ink` | `#6E9BFF` | `#2457E6` | Texto/links em azul sobre fundo escuro |
| `--accent-soft` | `#172447` | `#E6EDFF` | Fundo de pílula azul, aba ativa, foco de input |
| `--green` / `--green-soft` | `#34D27B` / `#12301F` | `#138A4B` / `#E2F5EA` | Matéria concluída na volta |
| `--red` / `--red-soft` | `#FF6B6B` / `#3A1A1F` | `#C83A3A` / `#FBE7E7` | Revisão atrasada, erro, acerto baixo, nota "Errei" |
| `--on-accent` | `#FFFFFF` | `#FFFFFF` | Texto e ícones sobre `--accent` |
| `--focus` | `#6E9BFF` | `#2457E6` | Anel de foco |
| `--scrim` | `rgba(3,6,12,.7)` | `rgba(15,23,42,.45)` | Fundo atrás do diálogo |
| `--shadow-float` | `0 12px 30px -10px rgba(0,0,0,.6)` | `0 12px 30px -10px rgba(15,23,42,.25)` | Sombra de elementos flutuantes (toast) |

Texto sobre `--accent` é branco. Texto sobre `--red` sólido usa `--paper`. Contraste mínimo: 4.5:1 para texto, mire 7:1 no texto principal.

### Tipografia

- **Geist** (400–700) para toda a interface; **Geist Mono** apenas para o tempo do cronômetro.
- Escala: `h1` 22px/600 · `h2` 16px/600 · corpo 15px · listas e formulários 14px · meta 13px · pílulas 11–12px/600.
- `letter-spacing: -0.015em` em títulos. Números de tempo e contagem com `font-variant-numeric: tabular-nums`.
- Sem caixa alta em rótulos, sem itálico de destaque.

### Forma e espaço

- Raios: `--r-sm` 6px (pílulas, itens de lista) · `--r-control` 8px (botões, inputs, chips) · `--r-md` 10px (blocos internos) · `--r-lg` 14px (cards, diálogo).
- Espaçamento base 4px; gaps comuns 6, 8, 12, 16, 24. Padding de card 18px (14px no mobile).
- Bordas 1px `--line`. Sombra só em elementos flutuantes (cronômetro, toast, botão primário com brilho azul).

## Layout

- **Desktop:** barra superior fixa (marca à esquerda, navegação: Hoje, Ciclos, Revisões, Estatísticas; tema e avatar à direita). Conteúdo centralizado, `max-width: 1220px`.
- **Tela Hoje:** grade `1fr 340px`. Coluna principal: card do ciclo atual + "Outros ciclos". Coluna lateral: sequência de dias e "Revisões de hoje".
- **≤ 960px:** a coluna lateral desce abaixo da principal.
- **≤ 760px (celular):** navegação vira barra inferior com ícones; o disco vai para o topo do card do ciclo; cronômetro flutua acima da barra inferior. Nunca pode haver rolagem horizontal (testar em 298–375px).

## Componentes

### Disco do ciclo
SVG, um arco por Matéria com comprimento proporcional à carga horária, separados por pequeno espaço. Trilho em `--line`, preenchimento em `--accent` proporcional ao Progresso da matéria (máx. 100%). A Próxima matéria recebe um arco externo fino em `--ink`. Centro: "Volta N", tempo que falta (grande, 600) e "para fechar". Passar o mouse/focar uma matéria na lista esmaece as outras fatias. Precisa de `aria-label` descrevendo o progresso de cada matéria. Os textos do centro são desenhados em unidades do `viewBox` 260×260 (rótulos 15, tempo 34/600) e escalam com o disco, por isso ficam fora da escala tipográfica em px.

### Card do ciclo (hero)
Padding de 22px (como o card de login) e nome do ciclo em 22px/600, como o `h1`. Duas colunas: à esquerda pílulas (Volta, nº de matérias, concluídas), nome do ciclo, "Próxima matéria", meta de tempo/tópicos, ações (primário "Iniciar cronômetro", secundário "Registrar estudo") e a lista de matérias com barras; à direita o disco sobre `--surface-2` com um leve brilho azul radial no canto.

### Lista de matérias / barras
Linha com nome, `feito / carga` e barra de 5px. Matéria concluída: barra verde, nome em `--ink-2`. Próxima matéria: pílula "próxima" azul ao lado do nome.

### Card de ciclo compacto
Iniciais em quadrado `--accent-soft` (36px), nome, "Volta N. Próxima: X", barra com porcentagem. Clicar torna o ciclo o principal.

### Botões
- **Primário:** fundo `--accent`, texto branco, brilho azul. Uma ação primária por área.
- **Secundário:** `--surface-2` com borda `--line`.
- **Discreto (link):** sem borda, texto `--accent-ink` ("Ver todas").
- Altura 38px (32px dentro de listas). Nada de setas no texto.

### Pílulas e chips
- **Pílula** (informação): 11–12px/600, raio 6px; variantes neutra, azul, verde, vermelha.
- **Chip** (seleção, `aria-pressed`): borda `--line`; selecionado com borda e texto azul sobre `--accent-soft`.

### Lista de revisões
Tópico em 600, pílula de prazo ("vence hoje" azul, "atrasada há N dias" vermelha), linha meta com matéria, ciclo e último desempenho, botão "Revisar" à direita.

### Formulário de registro (diálogo)
Rótulos 13px `--ink-2`, inputs 40px em `--paper`, foco com borda azul + halo `--accent-soft`. Bloco "Nota da revisão" em `--surface-2` com quatro botões (Errei, Difícil, Bom, Fácil); selecionado em azul, "Errei" selecionado em vermelho. A dica abaixo explica a sugestão ("80% de acerto sugere Bom, pela faixa do ciclo"), o caso de menos de 5 questões e o caso sem questões.

### Cronômetro
Card flutuante no canto inferior direito (desktop) ou acima da navegação (mobile), borda azul e halo. Tempo em Geist Mono azul; matéria e ciclo ao lado; ações "Pausar/Retomar", "Parar e registrar" (primário), "Descartar" (discreto). Pausado: tempo com opacidade reduzida.

### Telas de conta (Entrar, Criar conta)
Sem barra de navegação. Marca no topo e um card (`--surface`, padding 22px) centralizado, largura máx. 400px, com título `h1`, campos no padrão do formulário e um único botão primário de largura total. Erro em `--red` 13px acima do botão (`role="alert"`). Link discreto para a outra tela no rodapé; "Criar conta" some quando o cadastro está fechado.

### Estado vazio
Painel com `h2` dizendo o que falta e uma linha em `--ink-2` dizendo o que fazer ("Nenhum ciclo ainda" / "Crie um ciclo…").

### Toast
Topo central, `--surface-2` com borda; confirma a ação com o mesmo verbo do botão, é global (renderizado no `body`, nunca dentro de um card com `overflow: hidden`) e some sozinho em 5s ("Estudo registrado.", "Cronômetro descartado. Nada foi registrado.").

### Métricas e estatísticas
Blocos de métrica em `--surface-2` (rótulo 13px, valor 20px/600). Barras semanais em `--accent-soft` com a semana atual em `--accent`. Acerto por matéria com barras azuis; abaixo de 60% em vermelho.

**Tela Estatísticas** (`/estatisticas`): título, subtítulo com o ciclo filtrado ("Todos os ciclos" por padrão) e, abaixo, chips de filtro por ciclo ("Todos" + um por ciclo; navegação por link, o selecionado leva `aria-current="true"` e o estilo do chip pressionado). Grade de duas colunas (uma em ≤ 760px) com "Horas por semana" (8 semanas, de segunda a domingo em Brasília; rótulo `d/m`, a atual "esta"; média no cabeçalho) e "Acerto por matéria" (só registros com questões). Um terceiro painel de largura total, "Horas por matéria" (todas as voltas), usa a mesma lista de barras do acerto, com a barra proporcional à matéria mais estudada. Com mais de um ciclo e sem filtro, o nome do ciclo aparece sob a matéria. A altura das barras semanais é proporcional à maior semana, com escala mínima de 1h (o protótipo usa 20h fixas). Painéis sem dados mostram uma linha em `--ink-2` dizendo o que registrar.

## Acessibilidade e movimento

- Foco visível sempre (`--focus`, 2px). Alvos de toque ≥ 38px.
- Estados de seleção via `aria-pressed`/`aria-current`, não só por cor.
- Movimento só em resposta a ação (abrir diálogo, barra/disco atualizando). Respeitar `prefers-reduced-motion`.
