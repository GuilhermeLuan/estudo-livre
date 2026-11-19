"use client";

import { RiAddLine, RiFileUploadLine } from "@remixicon/react";
import { useState, useTransition } from "react";
import { Button } from "@/components/base/buttons/button";
import { LinkButton } from "@/components/base/buttons/link-button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { AlertDialog, Modal, ModalBody, ModalFooter, ModalHeader, useModalClose } from "@/components/base/modal/modal";
import { Textarea } from "@/components/base/textarea/textarea";
import { excluirTopicoDaMateria, importarTopicosDaMateria, marcarTopicoEstudado, novoTopico, renomearTopicoDaMateria, type EstadoTopico } from "./acoes-topicos";
import { FormularioNome } from "./formulario-ciclo";
import { textoDaProximaRevisao } from "./formato";

export type TopicoItem = { id: string; nome: string; estudado: boolean; registros: number; proximaRevisao: string | null };

function FormularioImportacao({ materiaId, aoImportar }: { materiaId: string; aoImportar: (aviso: string) => void }) {
  const fechar = useModalClose();
  const [erro, setErro] = useState<string>();
  const [enviando, iniciar] = useTransition();

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    setErro(undefined);
    iniciar(async () => {
      const estado = await importarTopicosDaMateria(materiaId, {}, dados);
      if (estado.erro) return setErro(estado.erro);
      aoImportar(estado.aviso ?? "");
      fechar();
    });
  }

  return (
    <form onSubmit={enviar} className="flex min-h-0 flex-col gap-4">
      <ModalBody className="grid gap-4 py-2">
        <Textarea label="Tópicos" name="texto" rows={8} placeholder={"Um tópico por linha\nLinhas vazias e repetidas são ignoradas"} isRequired />
        {erro && (
          <p role="alert" className="text-body-regular text-text-error-primary">
            {erro}
          </p>
        )}
      </ModalBody>
      <ModalFooter>
        <Button type="button" variant="secondary" onClick={fechar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviando}>
          Importar tópicos
        </Button>
      </ModalFooter>
    </form>
  );
}

/** A lista de Tópicos da Matéria: marcar, renomear, excluir, criar e importar. */
export function ListaDeTopicos({ materiaId, topicos, somenteLeitura = false }: { materiaId: string; topicos: TopicoItem[]; somenteLeitura?: boolean }) {
  const [novo, setNovo] = useState(false);
  const [importando, setImportando] = useState(false);
  const [editando, setEditando] = useState<TopicoItem | null>(null);
  const [excluindo, setExcluindo] = useState<TopicoItem | null>(null);
  const [aviso, setAviso] = useState<string>();
  const [erro, setErro] = useState<string>();
  const [, iniciar] = useTransition();

  function marcar(topico: TopicoItem, estudado: boolean) {
    setErro(undefined);
    iniciar(async () => {
      const estado: EstadoTopico = await marcarTopicoEstudado(topico.id, estudado);
      if (estado.erro) setErro(estado.erro);
    });
  }

  return (
    <div className="grid gap-4">
      {!somenteLeitura && <div className="flex flex-wrap items-center gap-2">
        <Button leadingIcon={RiAddLine} onClick={() => setNovo(true)}>
          Novo tópico
        </Button>
        <Button variant="secondary" leadingIcon={RiFileUploadLine} onClick={() => setImportando(true)}>
          Importar tópicos
        </Button>
        <p role="status" className="text-body-regular text-text-secondary">
          {aviso}
        </p>
      </div>}

      {topicos.length === 0 ? (
        <p className="rounded-3xl border border-border-button-default px-4 py-8 text-center text-body-regular text-text-secondary">Nenhum tópico ainda</p>
      ) : (
        <ul className="divide-y divide-separator-border rounded-3xl border border-border-button-default">
          {topicos.map((t) => (
            <li key={t.id} className="flex items-center gap-3 px-4 py-3">
              <Checkbox isDisabled={somenteLeitura} isSelected={t.estudado} onChange={(marcado) => marcar(t, marcado)} aria-label={`Estudado: ${t.nome}`} className="shrink-0" />
              <div className="grid min-w-0 flex-1">
                <span className="break-words text-body-medium text-text-primary">{t.nome}</span>
                <span className="text-caption-1-regular text-text-secondary">{textoDaProximaRevisao(t.proximaRevisao)}</span>
              </div>
              {!somenteLeitura && (
                <>
                  <LinkButton size="small" onClick={() => setEditando(t)} aria-label={`Renomear ${t.nome}`}>
                    Renomear
                  </LinkButton>
                  <LinkButton size="small" onClick={() => setExcluindo(t)} aria-label={`Excluir ${t.nome}`}>
                    Excluir
                  </LinkButton>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {erro && (
        <p role="alert" className="text-body-regular text-text-error-primary">
          {erro}
        </p>
      )}

      <Modal isOpen={novo} onOpenChange={setNovo} size="sm" aria-label="Novo tópico">
        <ModalHeader title="Novo tópico" closeLabel="Fechar" />
        <FormularioNome emModal acao={novoTopico.bind(null, materiaId)} botao="Criar tópico" rotuloNome="Nome do tópico" />
      </Modal>
      <Modal isOpen={importando} onOpenChange={setImportando} size="md" aria-label="Importar tópicos">
        <ModalHeader title="Importar tópicos" closeLabel="Fechar" />
        <FormularioImportacao materiaId={materiaId} aoImportar={setAviso} />
      </Modal>
      <Modal isOpen={!!editando} onOpenChange={(aberto) => !aberto && setEditando(null)} size="sm" aria-label="Renomear tópico">
        {editando && (
          <>
            <ModalHeader title="Renomear tópico" closeLabel="Fechar" />
            <FormularioNome emModal acao={renomearTopicoDaMateria.bind(null, editando.id)} botao="Renomear tópico" nome={editando.nome} rotuloNome="Nome do tópico" />
          </>
        )}
      </Modal>
      <AlertDialog
        isOpen={!!excluindo}
        onOpenChange={(aberto) => !aberto && setExcluindo(null)}
        title={excluindo ? `Excluir o tópico “${excluindo.nome}”?` : ""}
        description={
          excluindo && excluindo.registros > 0
            ? excluindo.registros === 1
              ? "O registro de estudo dele continua, sem conteúdo."
              : `Os ${excluindo.registros} registros de estudo dele continuam, sem conteúdo.`
            : undefined
        }
        confirmLabel="Excluir tópico"
        cancelLabel="Cancelar"
        onConfirm={async () => {
          const estado = excluindo ? await excluirTopicoDaMateria(excluindo.id) : {};
          if (estado.erro) setErro(estado.erro);
        }}
      />
    </div>
  );
}
