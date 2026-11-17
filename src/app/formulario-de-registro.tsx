"use client";

import { RiCheckLine, RiTimerLine } from "@remixicon/react";
import { useEffect, useState, useTransition } from "react";
import type { SugestaoDeRegistro } from "@/casos-de-uso";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Modal, ModalBody, ModalFooter, ModalHeader, useModalClose } from "@/components/base/modal/modal";
import { Select, SelectItem } from "@/components/base/select/select";
import { SegmentedControl, SegmentedControlItem } from "@/components/base/segmented-control/segmented-control";
import { Textarea } from "@/components/base/textarea/textarea";
import { hojeEmBrasilia } from "@/dia";
import { LIMITES_DO_REGISTRO, percentualDeAcerto, TIPOS_DE_ESTUDO, type TipoDeEstudo } from "@/dominio";
import { CAMPO_CRONOMETRO } from "./campos-do-registro";
import { registrar, type EstadoRegistro } from "./acoes-estudo";

const { duracaoMaximaMinutos, questoesMaximas, anotacaoMaxima, conteudoLivreMaximo } = LIMITES_DO_REGISTRO;

/** Uma Matéria que se pode escolher, com o Ciclo dela. */
export type MateriaParaRegistro = { id: string; nome: string; ciclo: string };

/** A mensagem do servidor fica sob o campo a que se refere; sem campo reconhecível, abaixo dos campos. */
function campoDoErro(erro: string | undefined) {
  if (!erro) return null;
  if (/acerto/i.test(erro)) return "acertos";
  if (/quest/i.test(erro)) return "questoes";
  if (/dura|hora|minuto/i.test(erro)) return "duracao";
  if (/data/i.test(erro)) return "data";
  if (/conte/i.test(erro)) return "conteudo";
  if (/anota/i.test(erro)) return "anotacao";
  return null;
}

function Formulario({
  materias,
  materiaInicial,
  sessaoCronometrada,
  aoSalvar,
}: {
  materias: MateriaParaRegistro[];
  materiaInicial: string;
  sessaoCronometrada?: SugestaoDeRegistro;
  aoSalvar: (aviso: string) => void;
}) {
  const fechar = useModalClose();
  const [materiaId, setMateriaId] = useState(materiaInicial);
  const [tipo, setTipo] = useState<TipoDeEstudo>("Teoria");
  const [questoes, setQuestoes] = useState("");
  const [acertos, setAcertos] = useState("");
  const cronometrado = !!sessaoCronometrada;
  const duracaoInicial = sessaoCronometrada?.duracaoMinutos ?? 60;
  const [estado, setEstado] = useState<EstadoRegistro>({});
  const [enviando, iniciar] = useTransition();

  // Sem `<form action>`: o React 19 limparia os campos depois de um envio recusado.
  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    iniciar(async () => setEstado(await registrar(estado, dados)));
  }

  useEffect(() => {
    if (estado.aviso) aoSalvar(estado.aviso);
    // Só reage a um novo envio bem-sucedido.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado.enviado]);

  const acerto = percentualDeAcerto(acertos === "" ? null : Number(acertos), Number(questoes));
  const campo = campoDoErro(estado.erro);
  const erroDe = (nome: string) => (campo === nome ? { isInvalid: true, errorMessage: estado.erro } : {});

  // Editar qualquer campo limpa o erro do servidor: um campo inválido não deixaria o navegador reenviar.
  return (
    <form onSubmit={enviar} onChange={() => estado.erro && setEstado({ enviado: estado.enviado })} className="flex min-h-0 flex-col gap-4">
      <ModalHeader
        title="Registrar estudo"
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
          onSelectionChange={(chave) => setMateriaId(String(chave))}
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

        <Input label="Conteúdo" name="conteudoLivre" maxLength={conteudoLivreMaximo} placeholder="Opcional. Ex.: crase antes de horas" {...erroDe("conteudo")} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Data" name="data" type="date" defaultValue={hojeEmBrasilia()} isRequired {...erroDe("data")} />
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
          <SegmentedControl aria-labelledby="rotulo-tipo" selectedKeys={[tipo]} onSelectionChange={(chaves) => setTipo([...chaves][0] as TipoDeEstudo)} className="max-w-full overflow-x-auto">
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

        <Textarea label="Anotação" name="anotacao" maxLength={anotacaoMaxima} placeholder="Opcional" {...erroDe("anotacao")} />

        {estado.erro && !campo && (
          <p role="alert" className="text-body-regular text-text-error-primary">
            {estado.erro}
          </p>
        )}
      </ModalBody>
      <ModalFooter>
        <Button type="button" variant="secondary" onClick={fechar}>
          Cancelar
        </Button>
        <Button type="submit" leadingIcon={RiCheckLine} disabled={enviando}>
          Salvar registro
        </Button>
      </ModalFooter>
    </form>
  );
}

type Props = {
  aberto: boolean;
  aoMudar: (aberto: boolean) => void;
  materias: MateriaParaRegistro[];
  materiaInicial: string;
  sessaoCronometrada?: SugestaoDeRegistro;
  /** Muda a cada abertura: o formulário é remontado e começa limpo. */
  abertura: number;
  aoSalvar: (aviso: string) => void;
};

/** O modal "Registrar estudo": folha colada ao rodapé abaixo de 1024px. */
export function RegistroDeEstudo({ aberto, aoMudar, abertura, ...resto }: Props) {
  return (
    <Modal isOpen={aberto} onOpenChange={aoMudar} size="lg" sheetOnMobile aria-label="Registrar estudo">
      <Formulario key={abertura} {...resto} />
    </Modal>
  );
}
