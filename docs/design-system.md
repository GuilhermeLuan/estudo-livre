# Design System

Referência visual: o arquivo Figma **Estudo Livre — BoardUI** (`ig7Pq2uPxPWjeWuCKmTuBW`). Quando o Figma e este documento divergirem, o Figma vence e o documento é corrigido no mesmo PR.

O app usa o **BoardUI** como código-fonte do repositório: tokens e tipografia em `src/styles/`, componentes em `src/components/`, mesclagem de classes com `cx()` de `src/utils/cx.ts`. As regras de uso (tokens semânticos, tipografia composta, ícones Remix) estão no bloco BoardUI do `AGENTS.md`.

## Princípios

- Interface calma e densa de informação: cartões arredondados sobre um fundo neutro, uma única cor de ação (azul).
- Só tokens semânticos. Nada de hex, de paleta crua (`text-gray-500`) nem de `dark:` com cor literal: o escuro vem da troca dos tokens pela classe `dark`.
- Textos em pt-BR, com o vocabulário do `CONTEXT.md`. Sentence case.
- Toda ação nomeia o que faz ("Salvar registro", não "Enviar"), e o aviso depois dela usa o mesmo verbo.

## Tema

Dois temas, escolhidos pelo sistema operacional na primeira visita e trocáveis à mão (Claro, Escuro, Sistema). A classe `dark` no `<html>` é decidida por um script no `<head>`, antes da primeira pintura. A escolha manual fica no `localStorage` do aparelho, chave `tema`, com `"claro"` ou `"escuro"`; sem a chave, o app segue `prefers-color-scheme`, inclusive quando o sistema muda com a página aberta. O `theme-color` do PWA acompanha o fundo do tema ativo.

## Tokens

O modo claro é o **Claro suave** do Figma (o "Light" original do BoardUI não é usado).

| Token | Claro suave | Escuro |
| --- | --- | --- |
| `background-full` (fundo da página) | `#ebebe8` | `#121212` |
| `background-secondary-default` (cartões, Sidebar) | `#e2e2df` | `neutral-900` |
| `background-primary-default` (cartão interno, botão secundário) | `#f5f5f3` | `neutral-800` |
| `background-tertiary-default` (trilho do Segmented) | `#d9d9d6` | `neutral-800` |
| `text-primary` | `#1c1c1b` | `neutral-50` |
| `text-secondary` | `neutral-500` | do tema escuro |
| `border-button-default`, `separator-border`, `border-table` | `#dcdcd8` | do tema escuro |
| ação (`bg-button-primary`, `accent-500`) | azul BoardUI | azul BoardUI |
| gráficos | `chart-1` a `chart-9` | idem |

Tokens de estado (`status-*` nos Chips, `state-success-*`, `text-error-primary`) vêm do BoardUI. Os valores completos estão em `src/styles/theme.css`; o bloco `:root` guarda o Claro suave e `.dark` o Escuro.

## Tipografia

Inter (`next/font/google`, variável `--font-inter`). Só as classes compostas de `src/styles/typography.css`, que fixam tamanho, peso, entrelinha e espaçamento juntos: `text-title-1-medium` (título da tela), `text-title-2-medium`, `text-title-3-medium` (título de cartão), `text-headline-medium`, `text-body-regular`/`-medium`/`-semibold` (texto corrente), `text-caption-1-regular` (apoio) e `text-caption-2-regular` (rótulos de gráfico). Números que mudam usam `tabular-nums`.

## Forma e espaço

Cartões e painéis em `rounded-3xl`; campos e linhas de menu em `rounded-xl`; chips em `rounded-md`; avatar e barras em `rounded-full`. Espaçamento na escala do Tailwind (`gap-3`, `p-4`).

## Layout

Um único ponto de quebra: **1024px**.

- **A partir de 1024px**: Sidebar flutuante de 260px à esquerda e conteúdo centralizado no espaço ao lado, com no máximo 1160px (1440px a partir de 1920px, para telas 4K não ficarem com metade vazia).
- **Abaixo de 1024px**: Sidebar oculta; cabeçalho com a marca, o título e o avatar (menu com Ciclos, Novo ciclo, Arquivados, Backup, Usuários, tema e Sair); barra de abas inferior com Hoje, o botão central "+" e Estatísticas. Os cartões das telas empilham em uma coluna.

## Componentes do BoardUI

Instalados de `list_components` do MCP do BoardUI: Button, IconButton, LinkButton, Input, Textarea, Select, SegmentedControl, Chip, Counter, Avatar, Modal e AlertDialog, Progress, Table, Dropdown, CloseButton. Antes de escrever um elemento à mão, procure-o em `src/components/`; se faltar, instale-o em vez de imitá-lo.

- Chip: `lime` = positivo ou concluído, `rose` = queda, `blue` = informação, `purple` = horas extras, `yellow` = pausado, `neutral` = sem estado.
- Progress: trilho `ProgressTrack`; azul no andamento, `text-chart-2` (verde) quando a etapa fecha 100%.
- Modal: no computador centralizado; abaixo de 1024px abre como folha colada ao rodapé (`sheetOnMobile`).

## Componentes do produto

- **Sidebar** (`src/app/navegacao.tsx`): marca, Hoje, Estatísticas, a seção Ciclos (um item por Ciclo e um "+" para `/ciclos/novo`), o cartão do Cronômetro, Backup, Usuários (só Admin), Sair e o cartão do usuário (abre o seletor de tema). O item da rota atual usa o gradiente do botão primário e `aria-current="page"`.
- **Cronômetro** (`src/app/cronometro.tsx`): o provedor guarda o estado e o modal de registro; `CartaoDoCronometro` desenha o cartão da Sidebar, o cartão grande da Hoje no celular e a faixa compacta acima da barra de abas.
- **StatCard** (`src/app/cartao-de-indicador.tsx`): ícone, rótulo, valor e Chip de variação. Na Hoje, abaixo de 1024px vira o cartão pequeno só com rótulo curto e valor.
- **EtapaRow** (`src/app/lista-etapas.tsx`): alça de arrastar, posição, Matéria, carga, barra com percentual e um Chip de Situação (Concluída, Próxima etapa com a linha realçada, Em andamento, Não iniciada ou "+<tempo> extra"), mais o menu ⋮ com Editar e Remover etapa.
- **Cartão do Ciclo** (`src/app/cartao-do-ciclo.tsx`): nome, Volta, progresso da Volta e o bloco da Próxima etapa com "Registrar" e "Iniciar".
- **Registrar estudo** (`src/app/formulario-de-registro.tsx`): Matéria, Conteúdo, Data, Duração (Horas e Minutos), Tipo de estudo, Questões, Acertos, o campo calculado Acerto e Anotação; o erro do servidor aparece sob o campo a que se refere.
- **Telas de conta**: cartão central de 420px com a marca, título, descrição, campos, botão de largura total e o link para a tela irmã.
- **Estados vazios**: cartão com título, uma frase que diz o que fazer e o botão da ação ("Criar ciclo", "Adicionar etapa", "Registrar estudo"). Sem gráficos zerados.
- **Backup** (`src/app/(app)/backup/page.tsx`, sem frame no Figma): título "Backup" e dois cartões `rounded-3xl` com borda, lado a lado a partir de 1024px e empilhados abaixo. "Exportar" tem uma frase e o `ButtonLink` primário "Exportar backup" (`RiDownload2Line`). "Importar" tem uma frase sobre a substituição, o campo de arquivo e o `Button` primário "Importar backup". O campo (`src/app/importar-backup.tsx`) é um `<input type="file">` oculto, aberto pelo `Button` secundário "Escolher arquivo", com o nome do arquivo ao lado e o erro sob ele. A confirmação usa o `AlertDialog` e o resultado, o Aviso. O `file-upload` do BoardUI não é usado porque simula o envio com uma barra de progresso falsa.
- **Aviso** (`src/app/aviso.tsx`): passageiro, no topo, some em 5s.

## Acessibilidade e movimento

Foco visível em tudo que se opera (`focus-visible:ring-2 ring-border-focus-ring`), alvos de toque de pelo menos 36px, `aria-current="page"` na navegação, rótulos acessíveis nos botões só com ícone. As animações do BoardUI respeitam `prefers-reduced-motion`.
