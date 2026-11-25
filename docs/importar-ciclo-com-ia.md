# Importar ciclo: instruções para a IA

Este documento é para uma IA ler. Ele explica como montar o arquivo JSON que o Estudo Livre importa em **Novo ciclo → Importar ciclo**. O Usuário entrega este documento e o edital (ou uma descrição do concurso) à IA, e a IA devolve o JSON.

## Objetivo

Transformar o edital de um concurso num **Ciclo** de estudos: as Matérias da prova, os Tópicos do conteúdo programático de cada uma e a sequência de Etapas com a carga horária de cada uma. O app cria o Ciclo zerado, na Volta 1, sem nenhum estudo registrado.

## Vocabulário

- **Ciclo**: sequência ordenada de Etapas, estudada em voltas repetidas. Normalmente corresponde a um concurso.
- **Matéria**: disciplina da prova (ex.: Português, Direito Constitucional). Aparece uma só vez no Ciclo, mesmo que tenha várias Etapas.
- **Etapa**: uma visita do Ciclo a uma Matéria, com posição na ordem e carga horária própria. Uma Matéria pode ter várias Etapas, espalhadas pelo Ciclo.
- **Carga horária**: tempo de estudo que uma Etapa precisa acumular para ser concluída numa volta. No arquivo, em minutos.
- **Tópico**: item do conteúdo programático de uma Matéria (ex.: "Crase" em Português). Não tem subtópicos.
- **Dificuldade**: a dificuldade do Usuário na Matéria: `facil`, `media` ou `dificil`.
- **Questões da prova**: quantas questões a prova dedica à Matéria. Não é a quantidade de questões que o Usuário resolve.

## Formato do arquivo

Um único objeto JSON:

| Campo | Tipo | Obrigatório | Regras |
| --- | --- | --- | --- |
| `formato` | texto | sim | Sempre `"estudo-livre-ciclo"` |
| `versao` | número | sim | Sempre `1` |
| `nome` | texto | sim | Nome do Ciclo, não vazio (ex.: `"TRF 5 - Analista Judiciário"`) |
| `materias` | lista de Matérias | sim | Até 50. Pode ser vazia |
| `etapas` | lista de Etapas | sim | Até 200. A ordem da lista é a ordem do Ciclo. Pode ser vazia |

Cada Matéria em `materias`:

| Campo | Tipo | Obrigatório | Regras |
| --- | --- | --- | --- |
| `nome` | texto | sim | Não vazio; único no arquivo, sem diferenciar maiúsculas |
| `dificuldade` | texto ou `null` | não | `"facil"`, `"media"` ou `"dificil"` |
| `questoesDaProva` | inteiro ou `null` | não | De 1 a 10000 |
| `topicos` | lista de textos | não | Até 200; cada um com 1 a 120 caracteres; únicos na Matéria, sem diferenciar maiúsculas |

Cada Etapa em `etapas`:

| Campo | Tipo | Obrigatório | Regras |
| --- | --- | --- | --- |
| `materia` | texto | sim | Igual ao `nome` de uma Matéria de `materias` (maiúsculas não importam) |
| `cargaMinutos` | inteiro | sim | De 1 a 600000 (minutos; 60 = 1 hora) |

Campos fora destas tabelas são ignorados. Não invente outros: eles não têm efeito.

## Regras que fazem o app recusar o arquivo

O app recusa o arquivo inteiro, sem criar nada, e mostra o primeiro problema que encontrar. Evite:

1. Arquivo maior que 1 MB.
2. Texto que não é JSON (comentários `//`, vírgula sobrando, aspas simples, bloco de texto antes ou depois).
3. `formato` diferente de `"estudo-livre-ciclo"` ou `versao` diferente de `1`.
4. `nome` ausente ou vazio; `materias` ou `etapas` ausente ou que não é lista.
5. Matéria sem `nome`, ou duas Matérias com o mesmo nome (ex.: "Português" e "PORTUGUÊS").
6. `dificuldade` com outro valor (ex.: `"Média"`, `"alta"`); `questoesDaProva` fracionário, zero ou acima de 10000.
7. Tópico vazio, com mais de 120 caracteres, ou repetido na mesma Matéria.
8. Matéria sem nenhuma Etapa e sem nenhum Tópico.
9. Etapa cuja `materia` não está em `materias` (confira a grafia, inclusive acentos).
10. `cargaMinutos` que não é inteiro de 1 a 600000 (ex.: `1.5`, `"60"`, `0`).
11. Mais de 50 Matérias, mais de 200 Etapas ou mais de 200 Tópicos numa Matéria.

## Como montar Matérias e Tópicos

- Uma Matéria por disciplina do edital, com o nome como o edital escreve, sem o número do item.
- `questoesDaProva`: quantas questões o edital atribui à disciplina. Se o edital agrupa disciplinas num bloco, reparta as questões do bloco pelo tamanho do conteúdo de cada uma, ou deixe `null` se não houver como saber.
- `dificuldade`: use o que o Usuário disser. Se ele não disser, deixe `null`.
- `topicos`: um item por assunto do conteúdo programático, na ordem do edital. O app não tem subtópicos: quando o edital tem "1.2.3 Crase", escreva só "Crase"; quando um item é longo, resuma em até 120 caracteres sem perder o assunto. Não repita assuntos dentro da mesma Matéria.

## Como repartir a carga em Etapas

Se o Usuário disser como quer as Etapas, siga o que ele disser. Se não disser, use esta regra (é a mesma da Sugestão de ciclo do app):

1. Peso da Matéria = `questoesDaProva` × fator da dificuldade (Fácil 1; Média 1,5; Difícil 2). Sem dificuldade, use Média; sem `questoesDaProva`, use a menor quantidade das outras Matérias.
2. Número de Etapas da Matéria = peso ÷ menor peso entre as Matérias, arredondado, no mínimo 1 e no máximo 8.
3. Cada Etapa com `cargaMinutos` de 60 (1 hora), salvo se o Usuário pedir outra duração.
4. Ordem: em rodadas. Em cada rodada, uma Etapa de cada Matéria que ainda tem Etapas a distribuir, da Matéria de maior peso para a de menor. Assim as Matérias se alternam e nenhuma fica com todas as Etapas seguidas.

Toda Matéria deve ter ao menos uma Etapa, salvo se o Usuário pedir uma Matéria só para guardar Tópicos.

## Como responder

Responda somente com o JSON, dentro de um único bloco de código `json`, sem texto antes ou depois. O Usuário vai salvar o conteúdo num arquivo `.json` e importá-lo. Se faltar uma informação essencial (por exemplo, o edital não diz quantas questões cada disciplina tem), pergunte antes de gerar o JSON, ou use `null` nos campos opcionais.

Se o Usuário colar uma mensagem de erro do app (ex.: `Etapa 3: a matéria "Direito Penal" não está em materias.`), corrija só o que o erro aponta e devolva o JSON inteiro de novo.

## Exemplo completo

Português (15 questões, Média, peso 22,5), Direito Constitucional (20 questões, Difícil, peso 40) e Informática (10 questões, Fácil, peso 10). Menor peso: 10. Etapas: Português 2, Direito Constitucional 4, Informática 1.

```json
{
  "formato": "estudo-livre-ciclo",
  "versao": 1,
  "nome": "TRF 5 - Analista Judiciário",
  "materias": [
    {
      "nome": "Português",
      "dificuldade": "media",
      "questoesDaProva": 15,
      "topicos": ["Compreensão e interpretação de textos", "Ortografia oficial", "Crase", "Concordância verbal e nominal", "Regência verbal e nominal"]
    },
    {
      "nome": "Direito Constitucional",
      "dificuldade": "dificil",
      "questoesDaProva": 20,
      "topicos": ["Princípios fundamentais", "Direitos e garantias fundamentais", "Organização do Estado", "Poder Judiciário"]
    },
    {
      "nome": "Informática",
      "dificuldade": "facil",
      "questoesDaProva": 10,
      "topicos": ["Sistemas operacionais", "Segurança da informação"]
    }
  ],
  "etapas": [
    { "materia": "Direito Constitucional", "cargaMinutos": 60 },
    { "materia": "Português", "cargaMinutos": 60 },
    { "materia": "Informática", "cargaMinutos": 60 },
    { "materia": "Direito Constitucional", "cargaMinutos": 60 },
    { "materia": "Português", "cargaMinutos": 60 },
    { "materia": "Direito Constitucional", "cargaMinutos": 60 },
    { "materia": "Direito Constitucional", "cargaMinutos": 60 }
  ]
}
```

## Prompt para colar na conversa

O Usuário anexa este documento e o edital e cola o texto abaixo, ajustando o que está entre colchetes:

```text
Leia o documento "Importar ciclo: instruções para a IA" e monte o JSON de um ciclo do Estudo Livre para o concurso do edital anexado.

- Nome do ciclo: [ex.: TRF 5 - Analista Judiciário]
- Minha dificuldade em cada matéria: [ex.: Português média, Direito Constitucional difícil, Informática fácil; ou "não informar"]
- Duração de cada etapa: [ex.: 1 hora]
- Observações: [ex.: deixar de fora a prova discursiva]

Siga as regras do documento e responda somente com o JSON.
```
