"use client";

import { RiPencilLine } from "@remixicon/react";
import { useState, useTransition } from "react";
import type { FaixasDoCiclo } from "@/casos-de-uso";
import { Chip, type ChipColor } from "@/components/base/badges/chip";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Modal, ModalBody, ModalFooter, ModalHeader, useModalClose } from "@/components/base/modal/modal";
import { NOTAS, textoDaFaixa, type Nota } from "@/revisao";
import { salvarFaixasDoCiclo, type EstadoFaixas } from "./acoes-revisao";

const COR_DA_NOTA: Record<Nota, ChipColor> = { Errei: "rose", Difícil: "orange", Bom: "blue", Fácil: "lime" };

const CAMPOS = [
  { nome: "erreiAte", rotulo: "Errei: abaixo de (%)" },
  { nome: "dificilAte", rotulo: "Difícil: abaixo de (%)" },
  { nome: "bomAte", rotulo: "Bom: abaixo de (%)" },
  { nome: "minimo", rotulo: "Mínimo de questões" },
] as const;

function FormularioDeFaixas({ cicloId, faixas, aoSalvar }: { cicloId: string; faixas: FaixasDoCiclo; aoSalvar: () => void }) {
  const fechar = useModalClose();
  const [estado, setEstado] = useState<EstadoFaixas>({});
  const [enviando, iniciar] = useTransition();

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    iniciar(async () => {
      const novo = await salvarFaixasDoCiclo(cicloId, estado, dados);
      setEstado(novo);
      if (!novo.erro) {
        aoSalvar();
        fechar();
      }
    });
  }

  const semCampo = estado.erro && !CAMPOS.some((c) => c.nome === estado.campo);
  return (
    <form onSubmit={enviar} onChange={() => estado.erro && setEstado({ enviado: estado.enviado })} className="flex min-h-0 flex-col gap-4">
      <ModalBody className="grid gap-4 py-2">
        <p className="text-body-regular text-text-secondary">Cada limite começa uma faixa nova. Fácil vale a partir do último. As notas já gravadas não mudam.</p>
        {CAMPOS.map(({ nome, rotulo }) => (
          <Input key={nome} label={rotulo} name={nome} type="number" inputMode="numeric" defaultValue={String(faixas[nome])} isRequired {...(estado.campo === nome ? { isInvalid: true, errorMessage: estado.erro } : {})} />
        ))}
        {semCampo && (
          <p role="alert" className="text-body-regular text-text-error-primary">
            {estado.erro}
          </p>
        )}
      </ModalBody>
      <ModalFooter>
        <Button type="button" variant="secondary" onClick={fechar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviando}>
          Salvar faixas
        </Button>
      </ModalFooter>
    </form>
  );
}

/** O cartão "Faixas de acerto" do Ciclo, com o modal para editar. */
export function FaixasDeAcerto({ cicloId, faixas }: { cicloId: string; faixas: FaixasDoCiclo }) {
  const [aberto, setAberto] = useState(false);
  const [abertura, setAbertura] = useState(0);
  return (
    <aside aria-label="Faixas de acerto" className="grid gap-4 rounded-3xl bg-background-secondary-default p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-title-3-medium text-text-primary">Faixas de acerto</h2>
        <Button
          variant="secondary"
          size="small"
          leadingIcon={RiPencilLine}
          onClick={() => {
            setAbertura((n) => n + 1);
            setAberto(true);
          }}
        >
          Editar
        </Button>
      </div>
      <ul className="grid grid-cols-4 gap-2">
        {NOTAS.map((nota) => (
          <li key={nota} className="grid justify-items-center gap-2 rounded-xl bg-background-primary-default px-1 py-3">
            <Chip variant="caption" color={COR_DA_NOTA[nota]}>
              {nota}
            </Chip>
            <span className="text-caption-1-regular text-text-secondary">{textoDaFaixa(nota, faixas)}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between gap-3">
        <span className="text-body-regular text-text-secondary">Mínimo de questões</span>
        <span className="text-body-medium text-text-primary">{faixas.minimo}</span>
      </div>
      <Modal isOpen={aberto} onOpenChange={setAberto} size="sm" aria-label="Editar faixas de acerto">
        <ModalHeader title="Editar faixas de acerto" closeLabel="Fechar" />
        <FormularioDeFaixas key={abertura} cicloId={cicloId} faixas={faixas} aoSalvar={() => setAberto(false)} />
      </Modal>
    </aside>
  );
}
