"use client";

import { RiCheckLine, RiLoopRightLine, RiTimerLine } from "@remixicon/react";
import { useEffect, useRef, useState, useTransition } from "react";
import type { SugestaoDeRegistro } from "@/casos-de-uso";
import { Chip, type ChipColor } from "@/components/base/badges/chip";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Modal, ModalBody, ModalFooter, ModalHeader, useModalClose } from "@/components/base/modal/modal";
import { Select, SelectItem } from "@/components/base/select/select";
import { SegmentedControl, SegmentedControlItem } from "@/components/base/segmented-control/segmented-control";
import { Textarea } from "@/components/base/textarea/textarea";
import { hojeEmBrasilia } from "@/dia";
import { LIMITES_DO_REGISTRO, percentualDeAcerto, TIPOS_DE_ESTUDO, type TipoDeEstudo } from "@/dominio";
import { fraseDaNota, NOTAS, sugerirNota, type Faixas, type Nota } from "@/revisao";
import { CAMPO_CRONOMETRO, type ModoDoConteudo } from "./campos-do-registro";
import { estimarRevisao } from "./acoes-revisao";
import { diaMes } from "./formato";
import { registrar, type EstadoRegistro } from "./acoes-estudo";
import { editar } from "./acoes-registros";

const COR_DA_NOTA: Record<Nota, ChipColor> = { Errei: "rose", Difícil: "orange", Bom: "blue", Fácil: "lime" };

const { duracaoMaximaMinutos, questoesMaximas, anotacaoMaxima, conteudoLivreMaximo } = LIMITES_DO_REGISTRO;

/** Uma Matéria que se pode escolher, com o Ciclo dele e as Faixas de acerto e o Mínimo de questões dele. */
export type MateriaParaRegistro = { id: string; nome: string; ciclo: string; faixas: Faixas; minimo: number; topicos: { id: string; nome: string }[] };

/** Um Registro existente, como o modal de edição o recebe. */
export type RegistroParaEdicao = {
  id: string;
  materiaId: string;
  tipo: TipoDeEstudo;
  duracaoMinutos: number;
  dia: string;
  questoes: number | null;
  acertos: number | null;
  nota: Nota | null;
  anotacao: string | null;
  conteudoLivre: string | null;
  topicoId: string | null;
};

/** A mensagem do servidor fica sob o campo a que se refere; sem campo reconhecível, abaixo dos campos. */
function campoDoErro(erro: string | undefined) {
  if (!erro) return null;
  if (/nota/i.test(erro)) return "nota";
  if (/acerto/i.test(erro)) return "acertos";
  if (/quest/i.test(erro)) return "questoes";
  if (/dura|hora|minuto/i.test(erro)) return "duracao";
  if (/data/i.test(erro)) return "data";
  if (/t[óo]pico|conte/i.test(erro)) return "conteudo";
  if (/anota/i.test(erro)) return "anotacao";
  return null;
}

function Formulario({
  materias,
  materiaInicial,
  sessaoCronometrada,
  edicao,
  aoSalvar,
}: {
  materias: MateriaParaRegistro[];
  materiaInicial: string;
  sessaoCronometrada?: SugestaoDeRegistro;
  edicao?: RegistroParaEdicao;
  aoSalvar: (aviso: string) => void;
}) {
  const fechar = useModalClose();
  const [materiaId, setMateriaId] = useState(materiaInicial);
  const [tipo, setTipo] = useState<TipoDeEstudo>(edicao?.tipo ?? "Teoria");
  const topicos = materias.find((m) => m.id === materiaId)?.topicos ?? [];
  const [modo, setModo] = useState<ModoDoConteudo>(
    edicao ? (edicao.topicoId && topicos.some((t) => t.id === edicao.topicoId) ? "topico" : edicao.conteudoLivre ? "livre" : "nenhum") : topicos.length ? "topico" : "livre",
  );
  const [topicoId, setTopicoId] = useState(edicao?.topicoId ?? "");
  const [questoes, setQuestoes] = useState(edicao?.questoes?.toString() ?? "");
  const [acertos, setAcertos] = useState(edicao?.acertos?.toString() ?? "");
  // A nota escolhida à mão vale no lugar da sugerida; sem escolha, vale a sugestão das Faixas.
  const [notaEscolhida, setNotaEscolhida] = useState<Nota | null>(edicao?.nota ?? null);
  const [proxima, setProxima] = useState<string | null>(null);
  const [alterado, setAlterado] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const cronometrado = !!sessaoCronometrada;
  const duracaoInicial = edicao?.duracaoMinutos ?? sessaoCronometrada?.duracaoMinutos ?? 60;
  const [estado, setEstado] = useState<EstadoRegistro>({});
  const [enviando, iniciar] = useTransition();

  // Sem `<form action>`: o React 19 limparia os campos depois de um envio recusado.
  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    iniciar(async () => setEstado(await (edicao ? editar : registrar)(estado, dados)));
  }

  useEffect(() => {
    if (estado.aviso) aoSalvar(estado.aviso);
    // Só reage a um novo envio bem-sucedido.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado.enviado]);

  const acerto = percentualDeAcerto(acertos === "" ? null : Number(acertos), Number(questoes));
  const campo = campoDoErro(estado.erro);
  const { faixas, minimo } = materias.find((m) => m.id === materiaId)!;
  const comNota = modo === "topico" && !!topicoId && Number(questoes) > 0;
  const sugerida = comNota ? sugerirNota(acertos === "" ? null : Number(acertos), Number(questoes), faixas, minimo) : null;
  const nota = notaEscolhida ?? sugerida;

  // A data estimada vem do servidor, com um pequeno atraso para não perguntar a cada tecla.
  useEffect(() => {
    if (!comNota || !formRef.current) return setProxima(null);
    const dados = new FormData(formRef.current);
    let valido = true;
    const espera = setTimeout(async () => {
      const dia = await estimarRevisao(dados);
      if (valido) setProxima(dia);
    }, 300);
    return () => {
      valido = false;
      clearTimeout(espera);
    };
  }, [comNota, materiaId, topicoId, alterado, nota]);
  const erroDe = (nome: string) => (campo === nome ? { isInvalid: true, errorMessage: estado.erro } : {});

  // Editar qualquer campo limpa o erro do servidor: um campo inválido não deixaria o navegador reenviar.
  return (
    <form ref={formRef} onSubmit={enviar} onChange={() => { setAlterado((n) => n + 1); if (estado.erro) setEstado({ enviado: estado.enviado }); }} className="flex min-h-0 flex-col gap-4">
      <ModalHeader
        title={edicao ? "Editar registro" : "Registrar estudo"}
        description={
          cronometrado ? (
            <span className="inline-flex items-center gap-1.5">
              <RiTimerLine className="size-4" aria-hidden />
              Duração preenchida pelo cronômetro
            </span>
          ) : undefined
        }
        closeLabel="Fechar"
      />
      <ModalBody className="grid grid-cols-[minmax(0,1fr)] gap-4 py-2">
        {edicao && <input type="hidden" name="registroId" value={edicao.id} />}
        {cronometrado && (
          <>
            <input type="hidden" name="materiaId" value={materiaId} />
            <input type="hidden" name={CAMPO_CRONOMETRO} value="sim" />
          </>
        )}
        <Select
          label="Matéria"
          name={cronometrado ? undefined : "materiaId"}
          selectedKey={materiaId}
          onSelectionChange={(chave) => {
            const nova = String(chave);
            setMateriaId(nova);
            setTopicoId("");
            if (modo === "topico" && !materias.find((m) => m.id === nova)?.topicos.length) setModo("livre");
          }}
          isDisabled={cronometrado}
          className="w-full"
          triggerClassName="w-full"
        >
          {materias.map((m) => (
            <SelectItem key={m.id} id={m.id} textValue={`${m.nome} · ${m.ciclo}`}>
              {m.nome} · {m.ciclo}
            </SelectItem>
          ))}
        </Select>

        <div className="grid gap-1">
          <span className="text-body-medium text-text-primary" id="rotulo-conteudo">
            Conteúdo
          </span>
          <SegmentedControl aria-labelledby="rotulo-conteudo" selectedKeys={[modo]} onSelectionChange={(chaves) => chaves.size && setModo([...chaves][0] as ModoDoConteudo)} className="w-full [&>*]:flex-1">
            <SegmentedControlItem id="topico" isDisabled={topicos.length === 0}>
              Tópico
            </SegmentedControlItem>
            <SegmentedControlItem id="livre">Conteúdo livre</SegmentedControlItem>
            <SegmentedControlItem id="nenhum">Sem conteúdo</SegmentedControlItem>
          </SegmentedControl>
          <input type="hidden" name="conteudo" value={modo} />
          {topicos.length === 0 && <p className="text-caption-1-regular text-text-secondary">Esta matéria ainda não tem tópicos.</p>}
        </div>
        {modo === "topico" && (
          <Select aria-label="Tópico" name="topicoId" placeholder="Escolha um tópico" selectedKey={topicoId || null} onSelectionChange={(chave) => setTopicoId(chave ? String(chave) : "")} className="w-full" triggerClassName="w-full">
            {topicos.map((t) => (
              <SelectItem key={t.id} id={t.id} textValue={t.nome}>
                {t.nome}
              </SelectItem>
            ))}
          </Select>
        )}
        {modo !== "livre" && campo === "conteudo" && (
          <p role="alert" className="-mt-2 text-caption-1-medium text-text-error-primary">
            {estado.erro}
          </p>
        )}
        {modo === "livre" && <Input aria-label="Conteúdo livre" name="conteudoLivre" defaultValue={edicao?.conteudoLivre ?? ""} maxLength={conteudoLivreMaximo} placeholder="Opcional. Ex.: crase antes de horas" {...erroDe("conteudo")} />}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Data" name="data" type="date" defaultValue={edicao?.dia ?? hojeEmBrasilia()} isRequired {...erroDe("data")} />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Horas" name="horas" type="number" inputMode="numeric" defaultValue={String(Math.floor(duracaoInicial / 60))} {...erroDe("duracao")} />
            <Input label="Minutos" name="minutos" type="number" inputMode="numeric" defaultValue={String(duracaoInicial % 60)} />
          </div>
        </div>
        {sessaoCronometrada?.passouDoLimite && (
          <p className="-mt-2 text-caption-1-medium text-text-secondary">O cronômetro passou de {duracaoMaximaMinutos / 60} horas. Ajuste a duração se precisar.</p>
        )}

        <div className="grid gap-1">
          <span className="text-body-medium text-text-primary" id="rotulo-tipo">
            Tipo de estudo
          </span>
          <SegmentedControl aria-labelledby="rotulo-tipo" selectedKeys={[tipo]} onSelectionChange={(chaves) => setTipo([...chaves][0] as TipoDeEstudo)} className="w-full [&>*]:flex-1">
            {TIPOS_DE_ESTUDO.map((t) => (
              <SegmentedControlItem key={t} id={t}>
                {t}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
          <input type="hidden" name="tipo" value={tipo} />
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-start gap-3">
          <Input label="Questões" name="questoes" type="number" inputMode="numeric" placeholder="Opcional" value={questoes} onChange={setQuestoes} {...erroDe("questoes")} />
          <Input label="Acertos" name="acertos" type="number" inputMode="numeric" placeholder="Opcional" value={acertos} onChange={setAcertos} {...erroDe("acertos")} />
          <div className="mt-6 grid h-14 min-w-20 content-center rounded-xl bg-background-secondary-default px-3" aria-live="polite">
            <span className="text-caption-1-regular text-text-secondary">Acerto</span>
            <span className="text-headline-medium text-text-primary">{acerto === null ? "—" : `${acerto}%`}</span>
          </div>
        </div>

        {comNota && (
          <div className="grid gap-1">
            <div className="flex items-center gap-2">
              <span className="text-body-medium text-text-primary" id="rotulo-nota">
                Nota da revisão
              </span>
              {sugerida && (
                <Chip variant="caption" color={COR_DA_NOTA[sugerida]}>
                  Sugerida: {sugerida}
                </Chip>
              )}
            </div>
            <SegmentedControl aria-labelledby="rotulo-nota" selectedKeys={nota ? [nota] : []} onSelectionChange={(chaves) => chaves.size && setNotaEscolhida([...chaves][0] as Nota)} className="w-full [&>*]:flex-1">
              {NOTAS.map((n) => (
                <SegmentedControlItem key={n} id={n}>
                  {n}
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
            {nota && <input type="hidden" name="nota" value={nota} />}
            {campo === "nota" ? (
              <p role="alert" className="text-caption-1-medium text-text-error-primary">
                {estado.erro}
              </p>
            ) : (
              <p className="text-caption-1-regular text-text-secondary">{fraseDaNota(acertos === "" ? null : Number(acertos), Number(questoes), faixas, minimo)}</p>
            )}
          </div>
        )}

        <Textarea label="Anotação" name="anotacao" defaultValue={edicao?.anotacao ?? ""} maxLength={anotacaoMaxima} placeholder="Opcional" {...erroDe("anotacao")} />

        {estado.erro && !campo && (
          <p role="alert" className="text-body-regular text-text-error-primary">
            {estado.erro}
          </p>
        )}
      </ModalBody>
      <div className="border-t border-separator-border pt-4">
        <ModalFooter>
          {proxima && (
            <p className="me-auto inline-flex items-center gap-1.5 text-caption-1-regular text-text-secondary" aria-live="polite">
              <RiLoopRightLine className="size-4" aria-hidden />
              Próxima revisão estimada: {diaMes(proxima)}
            </p>
          )}
          <Button type="button" variant="secondary" onClick={fechar}>
            Cancelar
          </Button>
          <Button type="submit" leadingIcon={RiCheckLine} disabled={enviando}>
            {edicao ? "Salvar" : "Salvar registro"}
          </Button>
        </ModalFooter>
      </div>
    </form>
  );
}

type Props = {
  aberto: boolean;
  aoMudar: (aberto: boolean) => void;
  materias: MateriaParaRegistro[];
  materiaInicial: string;
  sessaoCronometrada?: SugestaoDeRegistro;
  edicao?: RegistroParaEdicao;
  /** Muda a cada abertura: o formulário é remontado e começa limpo. */
  abertura: number;
  aoSalvar: (aviso: string) => void;
};

/** O modal "Registrar estudo": folha colada ao rodapé abaixo de 1024px. */
export function RegistroDeEstudo({ aberto, aoMudar, abertura, ...resto }: Props) {
  return (
    <Modal isOpen={aberto} onOpenChange={aoMudar} size="lg" sheetOnMobile aria-label={resto.edicao ? "Editar registro" : "Registrar estudo"}>
      <Formulario key={abertura} {...resto} />
    </Modal>
  );
}
