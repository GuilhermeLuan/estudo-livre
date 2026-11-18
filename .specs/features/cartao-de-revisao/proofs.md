# cartao-de-revisao proofs

**HEAD**: 6e5022c
**Tree**: clean
**Shell**: /bin/sh
**Result**: 42 pass, 0 fail

| Check | Proof | Result |
| --- | --- | --- |
| C1 | `run unit / ✓ tests/cartoes.test.ts > cartão > o primeiro registro de um Tópico cria o Cartão` | pass |
| C2 | `run unit / ✓ tests/cartoes.test.ts > cartão > primeiro registro sem questões cria o Cartão sem data` | pass |
| C3 | `run unit / ✓ tests/revisao.test.ts > faixas e nota > conversão de nota pelas Faixas padrão` | pass |
| C4 | `run unit / ✓ tests/cartoes.test.ts > nota > questões no mínimo sugerem a nota das Faixas e aceitam a escolhida` | pass |
| C5 | `run unit / ✓ tests/cartoes.test.ts > nota > abaixo do mínimo vale a nota escolhida` | pass |
| C6 | `run unit / ✓ tests/cartoes.test.ts > nota > abaixo do mínimo sem nota recusa e não grava nada` | pass |
| C7 | `run unit / ✓ tests/cartoes.test.ts > cartão > registro sem questões não altera o Cartão` | pass |
| C8 | `run unit / ✓ tests/cartoes.test.ts > cartão > a nota é aplicada na data do registro` | pass |
| C9 | `run unit / ✓ tests/cartoes.test.ts > recálculo > criar, editar e excluir dão o Cartão do recálculo do zero` | pass |
| C10 | `run unit / ✓ tests/cartoes.test.ts > recálculo > trocar Matéria ou Tópico recalcula os dois Cartões` | pass |
| C11 | `run unit / ✓ tests/cartoes.test.ts > recálculo > registro retroativo entra na ordem cronológica` | pass |
| C12 | `run unit / ✓ tests/cartoes.test.ts > recálculo > excluir o último registro remove o Cartão e o log` | pass |
| C13 | `run unit / ✓ tests/cartoes.test.ts > recálculo > editar para sem questões apaga a nota` | pass |
| C14 | `run unit / ✓ tests/cartoes.test.ts > log > um item por registro com nota` | pass |
| C15 | `run unit / ✓ tests/cartoes.test.ts > recálculo > excluir o Tópico remove Cartão e log e mantém os Registros` | pass |
| C16 | `run unit / ✓ tests/migracao-cartoes.test.ts > migração para Cartões > cria os Cartões dos Registros que já exi` | pass |
| C17 | `run unit / ✓ tests/cartoes.test.ts > recálculo > Cartão e Registros de outro Usuário não mudam` | pass |
| C18 | `browser captures/registrar-estudo.running.png` | pass |
| C19 | `run unit / ✓ tests/revisao.test.ts > faixas e nota > a frase da faixa traz a porcentagem e a faixa` | pass |
| C20 | `run unit / ✓ tests/revisao.test.ts > faixas e nota > abaixo do Mínimo não há sugestão e a frase pede a nota` | pass |
| C21 | `walk - no modal com 20 questões e 16 acertos, escolher Fácil marca Fácil; salvar e abrir "Editar registro" mos` | pass (Walked) |
| C22 | `walk - no modal, mudar os acertos de 16 para 20 troca "Sugerida: Bom" por "Sugerida: Fácil" e a nota marcada; ` | pass (Walked) |
| C23 | `run unit / ✓ tests/cartoes.test.ts > estimativa > a data estimada é a do Cartão depois de salvar` | pass |
| C24 | `run unit / ✓ tests/cartoes.test.ts > estimativa > sem Tópico ou sem data não há estimativa` | pass |
| C25 | `walk - no modal, trocar o segmento Conteúdo para "Conteúdo livre" e para "Sem conteúdo" esconde "Nota da revis` | pass (Walked) |
| C26 | `run unit / ✓ tests/cartoes.test.ts > nota > o histórico devolve a nota gravada do Registro` | pass |
| C27 | `walk - no modal com Tópico e 2 questões, salvar sem escolher nota mostra "Escolha a nota da revisão." sob o co` | pass (Walked) |
| C28 | `browser captures/ciclo.running.png` | pass |
| C29 | `run unit / ✓ tests/faixas.test.ts > faixas > todo Ciclo tem as Faixas 60, 75 e 90 e o Mínimo 5` | pass |
| C30 | `walk - em um Ciclo, "Editar" no cartão abre "Editar faixas de acerto" com 60, 75, 90 e 5 preenchidos` | pass (Walked) |
| C31 | `run unit / ✓ tests/faixas.test.ts > faixas > salvar valores válidos grava` | pass |
| C32 | `run unit / ✓ tests/faixas.test.ts > faixas > valores inválidos são recusados e os gravados ficam` | pass |
| C33 | `run unit / ✓ tests/faixas.test.ts > faixas > mudar as Faixas só vale para os Registros seguintes` | pass |
| C34 | `walk - na tela do Ciclo, a aba "Faixas de acerto" mostra o cartão com Chips, Mínimo e "Editar"` | pass (Walked) |
| C35 | `run unit / ✓ tests/faixas.test.ts > faixas > o Ciclo de outro Usuário não aparece nem muda` | pass |
| C36 | `run unit / ✓ tests/formato.test.ts > Próxima revisão > texto com a data` | pass |
| C37 | `run unit / ✓ tests/formato.test.ts > Próxima revisão > sem data` | pass |
| C38 | `walk - registrar estudo de um Tópico com questões e ver a data na lista de Tópicos da Matéria` | pass (Walked) |
| C40 | `walk - em /registros, "Editar" num Registro com nota Fácil abre o modal com Fácil marcada e o chip "Sugerida: ` | pass (Walked) |
| C39 | `run unit / ✓ tests/topicos.test.ts > próxima revisão > a Matéria traz a data de cada Tópico` | pass |
| Build | `npm run typecheck` | pass |
| Build | `npm run build` | pass |

## Output

`Run unit` - exit 0

```

stderr | tests/conta.test.ts > conta e instância > com o cadastro desligado, não é possível criar conta
2026-11-18T19:49:26.538Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/conta.test.ts > conta e instância > com o cadastro desligado, não é possível criar conta
2026-11-18T19:49:26.588Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/conta.test.ts > conta e instância > com o cadastro desligado, o primeiro Usuário ainda pode se cadastrar
2026-11-18T19:49:26.650Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/volta-do-ciclo.test.ts > progresso na tela do Ciclo > cada Etapa traz o feito, e o Ciclo traz a Volta, os totais e as Matérias com progresso
2026-11-18T19:49:32.331Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/volta-do-ciclo.test.ts > progresso na tela do Ciclo > depois de fechar a Volta, mostra a Volta 2 com o instante em que abriu e soma as horas extras
2026-11-18T19:49:32.463Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.
```
