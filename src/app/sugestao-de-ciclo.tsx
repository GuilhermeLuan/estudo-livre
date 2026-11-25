"use client";

import { useState, useTransition } from "react";
import { RiAddLine, RiDeleteBinLine, RiRefreshLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { AlertDialog } from "@/components/base/modal/modal";
import { Select, SelectItem } from "@/components/base/select/select";
import {
  CARGA_INVALIDA,
  cargaEmLimites,
  DIFICULDADES,
  erroDaNovaMateria,
  minutosDeHoras,
  QUESTOES_INVALIDAS,
  questoesDaProvaValidas,
  questoesDeTexto,
  ROTULO_DA_DIFICULDADE,
  sugerirEtapas,
  type Dificuldade,
  type MateriaParaSugerir,
} from "@/dominio";
import type { EstadoCiclo } from "./acoes-ciclos";
import { tempo } from "./formato";

type Linha = { chave: number; nome: string; questoes: string; dificuldade: Dificuldade };

const grade = "grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 lg:grid-cols-[minmax(0,1fr)_7.5rem_10rem_2.25rem]";

/** Valores com que a tela abre: na edição, o Ciclo como `obterSugestaoDoCiclo` o devolve. */
export type InicialDaSugestao = { nome: string; horas: string; materias: { nome: string; questoes: string; dificuldade: Dificuldade }[] };

type Props = {
  acao: (estado: EstadoCiclo, dados: FormData) => Promise<EstadoCiclo>;
  /** Edição de um Ciclo existente (AD-042, AD-043): "Gerar ciclo" com confirmação e lista vazia recusada. */
  edicao?: boolean;
  inicial?: InicialDaSugestao;
};

/**
 * Nome do ciclo e, opcionalmente, a Sugestão de ciclo: as Matérias com Questões da prova e Dificuldade viram Etapas.
 * A prévia usa a mesma função do domínio que o servidor roda ao criar; sem Matérias, cria o Ciclo vazio.
 */
export function SugestaoDeCiclo({ acao, edicao = false, inicial }: Props) {
  const [nome, setNome] = useState(inicial?.nome ?? "");
  const [horas, setHoras] = useState(inicial?.horas ?? "1");
  const [linhas, setLinhas] = useState<Linha[]>(() => (inicial?.materias ?? []).map((m, chave) => ({ chave, ...m })));
  const [novaMateria, setNovaMateria] = useState("");
  const [erroDaNova, setErroDaNova] = useState<string>();
  const [conferir, setConferir] = useState(false);
  const [previa, setPrevia] = useState(false);
  const [erro, setErro] = useState<string>();
  const [proxima, setProxima] = useState(inicial?.materias.length ?? 0);
  const [confirmar, setConfirmar] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [enviando, iniciar] = useTransition();

  const duracao = minutosDeHoras(horas);
  const erroDaDuracao = cargaEmLimites(duracao) ? undefined : CARGA_INVALIDA;
  const erroDasQuestoes = (l: Linha) => (questoesDaProvaValidas(questoesDeTexto(l.questoes)) ? undefined : QUESTOES_INVALIDAS);
  const valido = !erroDaDuracao && linhas.every((l) => !erroDasQuestoes(l));

  function adicionar() {
    const falha = erroDaNovaMateria(linhas.map((l) => l.nome), novaMateria);
    setErroDaNova(falha ?? undefined);
    if (falha) return;
    setLinhas((atuais) => [...atuais, { chave: proxima, nome: novaMateria.trim(), questoes: "", dificuldade: "media" }]);
    setProxima((n) => n + 1);
    setNovaMateria("");
  }

  const mudar = (chave: number, parte: Partial<Linha>) => setLinhas((atuais) => atuais.map((l) => (l.chave === chave ? { ...l, ...parte } : l)));
  const remover = (chave: number) => setLinhas((atuais) => atuais.filter((l) => l.chave !== chave));

  const sugeridas = previa
    ? sugerirEtapas(linhas.map((l): MateriaParaSugerir => ({ nome: l.nome, questoesDaProva: questoesDeTexto(l.questoes), dificuldade: l.dificuldade })))
    : [];

  function visualizar() {
    setConferir(true);
    setErro(undefined);
    if (valido && linhas.length) setPrevia(true);
  }

  function criar() {
    setConferir(true);
    setErro(undefined);
    if (!valido) {
      setPrevia(false);
      return;
    }
    if (edicao) setConfirmar(true);
    else iniciar(enviar);
  }

  async function enviar() {
    const dados = new FormData();
    dados.set("nome", nome);
    dados.set("horas", horas);
    dados.set("materias", JSON.stringify(linhas.map((l) => ({ nome: l.nome, questoesDaProva: questoesDeTexto(l.questoes), dificuldade: l.dificuldade }))));
    const estado = await acao({}, dados);
    if (estado.erro) setErro(estado.erro);
  }

  async function gerar() {
    setGerando(true);
    try {
      await enviar();
    } finally {
      setGerando(false);
    }
  }

  const ocupado = enviando || gerando;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-3xl border border-separator-border bg-background-primary-default p-5 shadow-xs sm:grid-cols-[minmax(0,1fr)_11rem]">
        <Input label="Nome do ciclo" name="nome" value={nome} onChange={setNome} isRequired maxLength={120} />
        <Input
          label="Duração da etapa (h)"
          name="horas"
          inputMode="decimal"
          value={horas}
          onChange={(v) => {
            setHoras(v);
            setPrevia(false);
          }}
          {...(conferir && erroDaDuracao ? { isInvalid: true, errorMessage: erroDaDuracao } : {})}
        />
      </div>

      <section aria-labelledby="h-materias" className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-3xl border border-separator-border bg-background-primary-default p-5 shadow-xs">
        <div className="grid gap-1">
          <h2 id="h-materias" className="text-title-3-medium text-text-primary">
            Matérias
          </h2>
          <p className="text-body-regular text-text-secondary">
            Informe as questões da prova e a sua dificuldade em cada matéria para receber a sugestão de etapas.{edicao ? "" : " Sem matérias, o ciclo nasce vazio."}
          </p>
        </div>

        {previa ? (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
            <p className="text-body-medium text-text-primary">
              {sugeridas.length} etapas de {tempo(duracao)} · total {tempo(sugeridas.length * duracao)}
            </p>
            <ol aria-label="Etapas sugeridas" className="divide-y divide-separator-border rounded-xl border border-separator-border">
              {sugeridas.map((e, i) => (
                <li key={i} className="flex items-center justify-between gap-3 px-3 py-2 text-body-regular text-text-primary">
                  <span className="min-w-0 truncate">
                    <span className="tabular-nums text-text-secondary">{i + 1}. </span>
                    {e.nome}
                  </span>
                  <span className="tabular-nums text-text-secondary">{tempo(duracao)}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <>
            {linhas.length > 0 && (
              <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:gap-3">
                <div aria-hidden className={`${grade} hidden text-caption-1-regular text-text-secondary lg:grid`}>
                  <span>Matéria</span>
                  <span>Questões</span>
                  <span>Dificuldade</span>
                  <span />
                </div>
                <ul className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:gap-3">
                  {linhas.map((l) => (
                    <li key={l.chave} className={`${grade} items-start border-t border-separator-border pt-4 first:border-t-0 first:pt-0 lg:border-t-0 lg:pt-0`}>
                      <span className="col-start-1 row-start-1 min-w-0 self-center truncate text-body-medium text-text-primary lg:col-auto lg:row-auto">{l.nome}</span>
                      <div className="col-span-2 row-start-2 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 lg:contents">
                        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-1">
                          <span className="text-caption-1-regular text-text-secondary lg:sr-only">Questões</span>
                          <Input
                            aria-label={`Questões da prova de ${l.nome}`}
                            inputMode="numeric"
                            value={l.questoes}
                            onChange={(v) => {
                              mudar(l.chave, { questoes: v });
                              setPrevia(false);
                            }}
                            {...(conferir && erroDasQuestoes(l) ? { isInvalid: true, errorMessage: QUESTOES_INVALIDAS } : {})}
                          />
                        </div>
                        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-1">
                          <span className="text-caption-1-regular text-text-secondary lg:sr-only">Dificuldade</span>
                          <Select
                            aria-label={`Dificuldade de ${l.nome}`}
                            selectedKey={l.dificuldade}
                            onSelectionChange={(k) => {
                              mudar(l.chave, { dificuldade: String(k) as Dificuldade });
                              setPrevia(false);
                            }}
                            className="w-full"
                            triggerClassName="w-full"
                          >
                            {DIFICULDADES.map((d) => (
                              <SelectItem key={d} id={d} textValue={ROTULO_DA_DIFICULDADE[d]}>
                                {ROTULO_DA_DIFICULDADE[d]}
                              </SelectItem>
                            ))}
                          </Select>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        iconOnly
                        leadingIcon={RiDeleteBinLine}
                        aria-label={`Remover ${l.nome}`}
                        className="col-start-2 row-start-1 lg:col-auto lg:row-auto"
                        onClick={() => {
                          remover(l.chave);
                          setPrevia(false);
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-[minmax(0,1fr)] gap-2">
              <div className="flex items-start gap-3">
                <Input
                  aria-label="Matéria"
                  placeholder="Nome da matéria"
                  value={novaMateria}
                  onChange={(v) => {
                    setNovaMateria(v);
                    setErroDaNova(undefined);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      adicionar();
                    }
                  }}
                  maxLength={120}
                  className="min-w-0 flex-1"
                  {...(erroDaNova ? { isInvalid: true, errorMessage: erroDaNova } : {})}
                />
                <Button type="button" variant="secondary" leadingIcon={RiAddLine} onClick={adicionar}>
                  Adicionar matéria
                </Button>
              </div>
            </div>
          </>
        )}
      </section>

      {erro && (
        <p role="alert" className="text-body-regular text-text-error-primary">
          {erro}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-3">
        {previa ? (
          <Button type="button" variant="secondary" onClick={() => setPrevia(false)}>
            Voltar
          </Button>
        ) : (
          <Button type="button" variant="secondary" disabled={!linhas.length || ocupado} onClick={visualizar}>
            Visualizar ciclo
          </Button>
        )}
        <Button type="button" disabled={ocupado || (edicao && !linhas.length)} onClick={criar}>
          {edicao ? "Gerar ciclo" : "Criar ciclo"}
        </Button>
      </div>

      {edicao && (
        <AlertDialog
          isOpen={confirmar}
          onOpenChange={setConfirmar}
          variant="default"
          icon={RiRefreshLine}
          title="Gerar ciclo?"
          description="As etapas atuais serão substituídas pelas da sugestão. Registros, tópicos e voltas continuam."
          confirmLabel="Gerar ciclo"
          cancelLabel="Cancelar"
          onConfirm={gerar}
        />
      )}
    </div>
  );
}
