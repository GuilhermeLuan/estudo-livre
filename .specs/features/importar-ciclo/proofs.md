# importar-ciclo proofs

**HEAD**: fa07d78
**Tree**: clean
**Shell**: /bin/sh
**Result**: 66 pass, 0 fail

| Check | Proof | Result |
| --- | --- | --- |
| C1 | `walk - /ciclos/novo mostra o cartão Importar ciclo com os textos da spec (a frase e a posição do botão passam ` | pass (Walked) |
| C2 | `walk - Importar ciclo sem arquivo mostra Escolha um arquivo.` | pass (Walked) |
| C3 | `walk - importar o exemplo leva a /ciclos/{id} do Ciclo "TRF 5 - Analista Judiciário"` | pass (Walked) |
| C4 | `run unit / ✓ tests/importar-ciclo.test.ts > importar ciclo > cria o ciclo com matérias, etapas e tópicos do ar` | pass |
| C5 | `run unit / ✓ tests/importar-ciclo.test.ts > importar ciclo > deixa dificuldade e questões da prova sem valor q` | pass |
| C6 | `run unit / ✓ tests/importar-ciclo.test.ts > importar ciclo > abre o ciclo na volta 1 sem registros e com faixa` | pass |
| C7 | `run unit / ✓ tests/importar-ciclo.test.ts > importar ciclo > mantém os ciclos que o usuário já tinha` | pass |
| C8 | `run unit / ✓ tests/importar-ciclo.test.ts > importar ciclo > grava só na conta do usuário da sessão` | pass |
| C9 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > desfaz tudo quando a gravação falha no meio` | pass |
| C10 | `walk - POST da action em /ciclos/novo sem cookie é redirecionado para /entrar` | pass (Walked) |
| C11 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa tamanho antes de JSON sem criar nada` | pass |
| C12 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > aceita arquivo de exatamente 1 MB` | pass |
| C13 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa arquivo que não é JSON sem criar nada` | pass |
| C14 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa raiz que não é objeto sem criar nada` | pass |
| C15 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa formato do backup sem criar nada` | pass |
| C16 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa versão desconhecida sem criar nada` | pass |
| C17 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa nome ausente sem criar nada` | pass |
| C18 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa nome vazio sem criar nada` | pass |
| C19 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa materias que não é lista sem criar nada` | pass |
| C20 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa etapas ausente sem criar nada` | pass |
| C21 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa matéria sem nome sem criar nada` | pass |
| C22 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa matéria repetida sem criar nada` | pass |
| C23 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa dificuldade inválida sem criar nada` | pass |
| C24 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa questões da prova fora do limite sem criar ` | pass |
| C25 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa questões da prova fracionárias sem criar na` | pass |
| C26 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa tópico vazio sem criar nada` | pass |
| C27 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa tópico longo demais sem criar nada` | pass |
| C28 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa tópico repetido sem criar nada` | pass |
| C29 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa matéria sem etapa nem tópico sem criar nada` | pass |
| C30 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa etapa com matéria desconhecida sem criar na` | pass |
| C31 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa carga zero sem criar nada` | pass |
| C32 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa carga acima do limite sem criar nada` | pass |
| C33 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa mais de 50 matérias sem criar nada` | pass |
| C34 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa mais de 200 etapas sem criar nada` | pass |
| C35 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa mais de 200 tópicos sem criar nada` | pass |
| C36 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa vários problemas, mostra o primeiro sem cri` | pass |
| C37 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa matéria antes de etapa sem criar nada` | pass |
| C38 | `run unit / ✓ tests/importar-ciclo.test.ts > importar ciclo > ignora chaves que o formato não define` | pass |
| C39 | `run unit / ✓ tests/instrucoes-para-ia.test.ts > instruções para a IA > tem as seções que a IA precisa` | pass |
| C40 | `run unit / ✓ tests/instrucoes-para-ia.test.ts > instruções para a IA > o exemplo importa sem erro` | pass |
| C41 | `run unit / ✓ tests/importar-ciclo.test.ts > importar ciclo > aceita listas vazias e cria o ciclo vazio` | pass |
| C42 | `run unit / ✓ tests/importar-ciclo.test.ts > importar ciclo > importar duas vezes cria dois ciclos de mesmo nom` | pass |
| C43 | `run unit / ✓ tests/importar-ciclo.test.ts > importar ciclo > cria matéria só com tópicos, sem etapa` | pass |
| C44 | `run unit / ✓ tests/importar-ciclo.test.ts > importar ciclo > liga a etapa à matéria sem diferenciar maiúsculas` | pass |
| C45 | `run unit / ✓ tests/importar-ciclo.test.ts > aceitar no limite > aceita tópico de 120 caracteres contados por c` | pass |
| C46 | `run unit / ✓ tests/importar-ciclo.test.ts > aceitar no limite > aceita carga de 1 e de 600.000 minutos` | pass |
| C47 | `run unit / ✓ tests/importar-ciclo.test.ts > aceitar no limite > aceita 50 matérias` | pass |
| C48 | `run unit / ✓ tests/importar-ciclo.test.ts > aceitar no limite > aceita 200 etapas` | pass |
| C49 | `run unit / ✓ tests/importar-ciclo.test.ts > aceitar no limite > aceita 200 tópicos numa matéria` | pass |
| C50 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa topicos que não é lista sem criar nada` | pass |
| C51 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa topicos nulo sem criar nada` | pass |
| C52 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa caractere nulo num texto sem criar nada` | pass |
| C53 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa matérias que o banco vê repetidas sem criar` | pass |
| C54 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa tópicos que o banco vê repetidos sem criar ` | pass |
| C55 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa versão em texto sem criar nada` | pass |
| C56 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa versão ausente sem criar nada` | pass |
| C57 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa matéria vazia antes de outra matéria sem cr` | pass |
| C58 | `run unit / ✓ tests/importar-ciclo.test.ts > recusar ciclo > recusa matéria vazia antes de etapa sem criar nada` | pass |
| C59 | `walk - /ciclos/novo a 1440 e 390 mostra o seletor e o botão no rodapé à direita` | pass (Walked) |
| C60 | `walk - escolher Colar JSON mostra a área JSON do ciclo e esconde Escolher arquivo` | pass (Walked) |
| C61 | `walk - colar o exemplo do documento leva à página de "TRF 5 - Analista Judiciário"` | pass (Walked) |
| C62 | `walk - colar o exemplo com a Etapa 3 em Direito Penal mostra a mensagem da Etapa 3` | pass (Walked) |
| C63 | `walk - Importar ciclo com a área vazia mostra Cole o JSON do ciclo.` | pass (Walked) |
| C64 | `walk - com um arquivo inválido escolhido, Colar JSON com o exemplo válido importa; voltar a Arquivo usa o arqu` | pass (Walked) |
| Build | `npm run typecheck` | pass |
| Build | `npm run build` | pass |

## Output

`Run unit` - exit 0

```

stderr | tests/importar-ciclo.test.ts > recusar ciclo > recusa tópicos que o banco vê repetidos sem criar nada
2026-11-25T23:54:09.741Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/importar-ciclo.test.ts > recusar ciclo > recusa tamanho antes de JSON sem criar nada
2026-11-25T23:54:09.867Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/importar-ciclo.test.ts > recusar ciclo > aceita arquivo de exatamente 1 MB
2026-11-25T23:54:09.989Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/importar-ciclo.test.ts > recusar ciclo > desfaz tudo quando a gravação falha no meio
2026-11-25T23:54:10.109Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.

stderr | tests/instrucoes-para-ia.test.ts > instruções para a IA > o exemplo importa sem erro
2026-11-25T23:54:11.145Z WARN [Better Auth]: [better-auth] Base URL is not set. Set the baseURL option or BETTER_AUTH_URL env, or use a dynamic baseURL with allowedHosts for multi-host setups. Without it the origin is derived from the incoming request, and callbacks and redirects may not work correctly.
```
