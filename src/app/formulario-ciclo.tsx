"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { ModalBody, ModalFooter, useModalClose } from "@/components/base/modal/modal";
import type { EstadoCiclo } from "./acoes-ciclos";

type Props = {
  acao: (estado: EstadoCiclo, dados: FormData) => Promise<EstadoCiclo>;
  botao: string;
  nome?: string;
  horas?: number;
  comCarga?: boolean;
  rotuloNome: string;
  /** Dentro de um modal: os botões ficam no rodapé e o modal fecha ao salvar. */
  emModal?: boolean;
};

/** Nome (e carga horária) de um Ciclo ou de uma Etapa. A server action responde `{}` quando salva. */
export function FormularioNome({ acao, botao, nome, horas, comCarga, rotuloNome, emModal }: Props) {
  const [erro, setErro] = useState<string>();
  const [enviando, iniciar] = useTransition();
  const fechar = useModalClose();

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    setErro(undefined);
    iniciar(async () => {
      const estado = await acao({}, dados);
      if (estado.erro) setErro(estado.erro);
      else if (emModal) fechar();
    });
  }

  const campos = (
    <>
      <Input label={rotuloNome} name="nome" defaultValue={nome} isRequired maxLength={120} />
      {comCarga && (
        <Input label="Carga horária (h)" name="horas" inputMode="decimal" defaultValue={horas === undefined ? undefined : String(horas)} isRequired />
      )}
      {erro && (
        <p role="alert" className="text-body-regular text-text-error-primary">
          {erro}
        </p>
      )}
    </>
  );

  return emModal ? (
    <form onSubmit={enviar} className="flex min-h-0 flex-col gap-4">
      <ModalBody className="grid gap-4 py-2">{campos}</ModalBody>
      <ModalFooter>
        <Button type="button" variant="secondary" onClick={fechar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviando}>
          {botao}
        </Button>
      </ModalFooter>
    </form>
  ) : (
    <form onSubmit={enviar} className="grid gap-4">
      {campos}
      <div>
        <Button type="submit" disabled={enviando}>
          {botao}
        </Button>
      </div>
    </form>
  );
}
