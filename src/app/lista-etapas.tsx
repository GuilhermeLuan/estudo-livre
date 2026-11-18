"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RiDraggable, RiMore2Fill } from "@remixicon/react";
import { useEffect, useState, useTransition } from "react";
import { Chip, type ChipColor } from "@/components/base/badges/chip";
import { Dropdown, DropdownItem, DropdownPopover, DropdownTrigger } from "@/components/base/dropdown/dropdown";
import { AlertDialog, Modal, ModalHeader } from "@/components/base/modal/modal";
import { ProgressTrack } from "@/components/base/progress/progress";
import { cx } from "@/utils/cx";
import { excluirEtapa, moverEtapa, salvarEtapa } from "./acoes-ciclos";
import { Aviso } from "./aviso";
import { FormularioNome } from "./formulario-ciclo";
import { situacaoDaEtapa, tempoHM } from "./formato";
import { AdicionarEtapa } from "./dialogos-do-ciclo";

export type EtapaItem = { id: string; nome: string; cargaMinutos: number; feitoMinutos: number; extraMinutos: number };

const COR_DA_SITUACAO: Record<string, ChipColor> = {
  "Concluída": "lime",
  "Próxima etapa": "blue",
  "Em andamento": "neutral",
  "Não iniciada": "neutral",
};
const corDaSituacao = (situacao: string): ChipColor => COR_DA_SITUACAO[situacao] ?? "purple";

function Linha({ etapa, posicao, proxima, aoEditar, aoRemover }: { etapa: EtapaItem; posicao: number; proxima: boolean; aoEditar: () => void; aoRemover: () => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: etapa.id });
  const percentual = Math.min(100, Math.round((etapa.feitoMinutos / etapa.cargaMinutos) * 100));
  const situacao = situacaoDaEtapa(etapa, { proxima, extraMinutos: etapa.extraMinutos });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cx(
        "grid grid-cols-[auto_28px_1fr_auto] items-center gap-x-3 gap-y-1 px-3 py-3 max-lg:grid-rows-[auto_auto] lg:grid-cols-[auto_28px_minmax(0,1fr)_64px_minmax(120px,200px)_44px_112px_auto]",
        proxima && "bg-accent-50",
        isDragging && "relative z-10 rounded-xl bg-background-primary-default shadow-md",
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Reordenar ${etapa.nome}. Posição ${posicao}. Use espaço e as setas para mover.`}
        className="grid size-7 cursor-grab touch-none place-items-center rounded-md text-foreground-icon-tertiary outline-none hover:text-foreground-icon-primary focus-visible:ring-2 focus-visible:ring-border-focus-ring active:cursor-grabbing"
      >
        <RiDraggable className="size-4" aria-hidden />
      </button>
      <span className="grid size-6 place-items-center rounded-md bg-background-secondary-default text-caption-1-medium text-text-secondary">{posicao}</span>
      <span className="min-w-0 truncate text-body-medium text-text-primary">{etapa.nome}</span>
      <span className="text-body-regular text-text-secondary tabular-nums max-lg:hidden">{tempoHM(etapa.cargaMinutos)}</span>
      <ProgressTrack percentage={percentual} size="sm" className={cx(percentual === 100 ? "text-chart-2" : "text-accent-500", "max-lg:col-start-3 max-lg:row-start-2")} />
      <span className="text-body-regular text-text-secondary tabular-nums max-lg:hidden">{percentual}%</span>
      <Chip variant="caption" color={corDaSituacao(situacao)} className="justify-self-start max-lg:hidden">
        {situacao}
      </Chip>
      <Dropdown>
        <DropdownTrigger className="grid size-8 place-items-center rounded-lg text-foreground-icon-secondary hover:bg-background-secondary-hover" aria-label={`Ações de ${etapa.nome}`}>
          <RiMore2Fill className="size-5" aria-hidden />
        </DropdownTrigger>
        <DropdownPopover aria-label={`Ações de ${etapa.nome}`} placement="bottom end">
          <DropdownItem onSelect={aoEditar}>Editar</DropdownItem>
          <DropdownItem onSelect={aoRemover}>Remover etapa</DropdownItem>
        </DropdownPopover>
      </Dropdown>
    </li>
  );
}

export function ListaEtapas({ cicloId, etapas, proximaId }: { cicloId: string; etapas: EtapaItem[]; proximaId?: string }) {
  const [itens, setItens] = useState(etapas);
  const [erro, setErro] = useState<string>();
  const [aviso, setAviso] = useState<string | null>(null);
  const [editando, setEditando] = useState<EtapaItem | null>(null);
  const [removendo, setRemovendo] = useState<EtapaItem | null>(null);
  const [, iniciar] = useTransition();
  useEffect(() => setItens(etapas), [etapas]);

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function aoSoltar({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const anteriores = itens;
    const novos = arrayMove(itens, itens.findIndex((e) => e.id === active.id), itens.findIndex((e) => e.id === over.id));
    setItens(novos);
    setErro(undefined);
    iniciar(async () => {
      const estado = await moverEtapa(cicloId, novos.map((e) => e.id));
      if (estado.erro) {
        setItens(anteriores);
        setErro(estado.erro);
      }
    });
  }

  if (itens.length === 0)
    return (
      <div className="grid justify-items-start gap-3 rounded-3xl bg-background-secondary-default p-6">
        <p className="text-body-regular text-text-secondary">Nenhuma etapa ainda. Adicione a primeira, com a matéria e as horas dela nesta etapa.</p>
        <AdicionarEtapa cicloId={cicloId} />
      </div>
    );

  return (
    <div className="overflow-hidden rounded-3xl border border-border-table bg-background-primary-default">
      <div className="grid grid-cols-[auto_28px_minmax(0,1fr)_64px_minmax(120px,200px)_44px_112px_auto] gap-x-3 border-b border-border-table px-3 py-2.5 text-caption-1-regular text-text-secondary max-lg:hidden" aria-hidden>
        <span className="w-7" />
        <span>#</span>
        <span>Matéria</span>
        <span>Carga</span>
        <span>Progresso na volta</span>
        <span />
        <span>Situação</span>
        <span className="w-8" />
      </div>
      <DndContext sensors={sensores} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis, restrictToParentElement]} onDragEnd={aoSoltar}>
        <SortableContext items={itens.map((e) => e.id)} strategy={verticalListSortingStrategy}>
          <ol className="divide-y divide-border-table">
            {itens.map((e, i) => (
              <Linha key={e.id} etapa={e} posicao={i + 1} proxima={e.id === proximaId} aoEditar={() => setEditando(e)} aoRemover={() => setRemovendo(e)} />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
      {erro && (
        <p role="alert" className="px-4 py-3 text-body-regular text-text-error-primary">
          {erro}
        </p>
      )}

      <Modal isOpen={!!editando} onOpenChange={(aberto) => !aberto && setEditando(null)} size="sm" aria-label="Editar etapa">
        {editando && (
          <>
            <ModalHeader title="Editar etapa" closeLabel="Fechar" />
            <FormularioNome emModal acao={async (anterior, dados) => {
              const estado = await salvarEtapa(editando.id, anterior, dados);
              if (estado.aviso) setAviso(estado.aviso);
              return estado;
            }} botao="Salvar etapa" nome={editando.nome} horas={editando.cargaMinutos / 60} comCarga rotuloNome="Nome da matéria" />
          </>
        )}
      </Modal>
      <AlertDialog
        isOpen={!!removendo}
        onOpenChange={(aberto) => !aberto && setRemovendo(null)}
        title="Remover etapa?"
        description={removendo ? `A etapa ${removendo.nome} sai do ciclo. Os registros de estudo continuam guardados.` : undefined}
        confirmLabel="Remover etapa"
        cancelLabel="Cancelar"
        onConfirm={async () => {
          const estado = removendo ? await excluirEtapa(removendo.id) : {};
          if (estado.erro) setErro(estado.erro);
          if (estado.aviso) setAviso(estado.aviso);
        }}
      />
      <Aviso texto={aviso} aoSumir={() => setAviso(null)} />
    </div>
  );
}
