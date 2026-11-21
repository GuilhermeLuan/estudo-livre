"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { ModalBody, ModalFooter, useModalClose } from "@/components/base/modal/modal";
import { Select, SelectItem } from "@/components/base/select/select";
import type { MateriaCopiavel } from "@/casos-de-uso";
import type { EstadoCiclo } from "./acoes-ciclos";

const NOVA = "nova";
const rotuloDaCopia = (m: MateriaCopiavel) => `${m.nome} · ${m.cicloNome}${m.arquivado ? " (arquivado)" : ""}`;

type Props = {
  acao: (estado: EstadoCiclo, dados: FormData) => Promise<EstadoCiclo>;
  botao: string;
  nome?: string;
  horas?: number;
  comCarga?: boolean;
  rotuloNome: string;
  /** Dentro de um modal: os botões ficam no rodapé e o modal fecha ao salvar. */
  emModal?: boolean;
  /** Matérias de outros Ciclos: com elas, o formulário oferece "Copiar de outro ciclo". */
  copiaveis?: MateriaCopiavel[];
};

/** Nome (e carga horária) de um Ciclo ou de uma Etapa. A server action responde `{}` quando salva. */
export function FormularioNome({ acao, botao, nome, horas, comCarga, rotuloNome, emModal, copiaveis = [] }: Props) {
  const [erro, setErro] = useState<string>();
  const [enviando, iniciar] = useTransition();
  const fechar = useModalClose();
  // Escolher uma origem preenche Nome e Carga; `chave` refaz os campos com os novos valores iniciais.
  const [origemId, setOrigemId] = useState(NOVA);
  const [inicial, setInicial] = useState({ nome, horas, chave: 0 });
  const copia = copiaveis.find((m) => m.id === origemId);

  function escolher(chave: string) {
    setOrigemId(chave);
    const m = copiaveis.find((c) => c.id === chave);
    if (m) setInicial((i) => ({ nome: m.nome, horas: m.cargaMinutos ? m.cargaMinutos / 60 : undefined, chave: i.chave + 1 }));
  }

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
      {copiaveis.length > 0 && (
        <Select label="Copiar de outro ciclo" name={copia ? "origemId" : undefined} selectedKey={origemId} onSelectionChange={(k) => escolher(String(k))} className="w-full" triggerClassName="w-full">
          <SelectItem id={NOVA} textValue="Nova matéria">
            Nova matéria
          </SelectItem>
          {copiaveis.map((m) => (
            <SelectItem key={m.id} id={m.id} textValue={rotuloDaCopia(m)}>
              {rotuloDaCopia(m)}
            </SelectItem>
          ))}
        </Select>
      )}
      <Input key={`n${inicial.chave}`} label={rotuloNome} name="nome" defaultValue={inicial.nome} isRequired maxLength={120} />
      {comCarga && (
        <Input key={`h${inicial.chave}`} label="Carga horária (h)" name="horas" inputMode="decimal" defaultValue={inicial.horas === undefined ? undefined : String(inicial.horas).replace(".", ",")} isRequired />
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
