"use client";

import { RiAddLine } from "@remixicon/react";
import { useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { LinkButton } from "@/components/base/buttons/link-button";
import { Modal, ModalHeader } from "@/components/base/modal/modal";
import type { MateriaCopiavel } from "@/casos-de-uso";
import { novaEtapa, renomear } from "./acoes-ciclos";
import { Aviso } from "./aviso";
import { FormularioNome } from "./formulario-ciclo";

/** "Adicionar etapa": abre o modal com Matéria e carga horária; a nova Etapa entra no fim da lista. */
export function AdicionarEtapa({ cicloId, copiaveis = [] }: { cicloId: string; copiaveis?: MateriaCopiavel[] }) {
  const [aberto, setAberto] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  return (
    <>
      <Button leadingIcon={RiAddLine} onClick={() => setAberto(true)}>
        Adicionar etapa
      </Button>
      <Modal isOpen={aberto} onOpenChange={setAberto} size="sm" aria-label="Adicionar etapa">
        <ModalHeader title="Adicionar etapa" closeLabel="Fechar" />
        <FormularioNome emModal acao={async (anterior, dados) => {
            const estado = await novaEtapa(cicloId, anterior, dados);
            if (estado.aviso) setAviso(estado.aviso);
            return estado;
          }} botao="Adicionar etapa" comCarga copiaveis={copiaveis} rotuloNome="Nome da matéria" />
      </Modal>
      <Aviso texto={aviso} aoSumir={() => setAviso(null)} />
    </>
  );
}

/** "Renomear" ao lado do nome do Ciclo. */
export function RenomearCiclo({ cicloId, nome }: { cicloId: string; nome: string }) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <LinkButton size="small" onClick={() => setAberto(true)}>
        Renomear
      </LinkButton>
      <Modal isOpen={aberto} onOpenChange={setAberto} size="sm" aria-label="Renomear ciclo">
        <ModalHeader title="Renomear ciclo" closeLabel="Fechar" />
        <FormularioNome emModal acao={renomear.bind(null, cicloId)} botao="Renomear ciclo" nome={nome} rotuloNome="Nome do ciclo" />
      </Modal>
    </>
  );
}
