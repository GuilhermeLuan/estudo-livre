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
import { useEffect, useState, useTransition } from "react";
import { excluirEtapa, moverEtapa, salvarEtapa } from "./acoes-ciclos";
import { FormularioNome } from "./formulario-ciclo";

export type EtapaItem = { id: string; nome: string; cargaMinutos: number };

function rotuloCarga(minutos: number) {
  return `${(minutos / 60).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} h`;
}

function Item({ etapa, posicao, aoRemover }: { etapa: EtapaItem; posicao: number; aoRemover: () => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: etapa.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-md border bg-surface-2 p-3 ${isDragging ? "relative z-10 border-accent shadow-[0_10px_30px_-10px_rgb(0_0_0/.6)]" : "border-line"}`}
    >
      <div className="flex items-center gap-3">
        <button
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reordenar ${etapa.nome}. Posição ${posicao}. Use espaço e as setas para mover.`}
          className="grid size-9 shrink-0 cursor-grab touch-none place-items-center rounded-md text-ink-2 hover:text-ink active:cursor-grabbing"
        >
          <svg width="14" height="18" viewBox="0 0 14 18" aria-hidden="true" fill="currentColor">
            {[3, 9, 15].flatMap((y) => [3, 11].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" />))}
          </svg>
        </button>
        <details className="min-w-0 flex-1">
          <summary className="flex cursor-pointer items-center gap-3 text-[.875rem]">
            <span className="w-5 text-ink-2 tabular-nums">{posicao}</span>
            <strong className="min-w-0 flex-1 truncate">{etapa.nome}</strong>
            <span className="text-ink-2 tabular-nums">{rotuloCarga(etapa.cargaMinutos)}</span>
            <span className="text-accent-ink">Editar</span>
          </summary>
          <div className="mt-3 grid gap-3">
            <FormularioNome
              acao={salvarEtapa.bind(null, etapa.id)}
              botao="Salvar etapa"
              nome={etapa.nome}
              horas={etapa.cargaMinutos / 60}
              comCarga
              rotuloNome="Nome da matéria"
            />
            <div>
              <button type="button" onClick={aoRemover} className="btn btn-quiet text-red" aria-label={`Remover ${etapa.nome}`}>
                Remover etapa
              </button>
            </div>
          </div>
        </details>
      </div>
    </li>
  );
}

export function ListaEtapas({ cicloId, etapas }: { cicloId: string; etapas: EtapaItem[] }) {
  const [itens, setItens] = useState(etapas);
  const [erro, setErro] = useState<string>();
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

  function remover(id: string) {
    setErro(undefined);
    iniciar(async () => {
      const estado = await excluirEtapa(id);
      if (estado.erro) setErro(estado.erro);
    });
  }

  if (itens.length === 0)
    return <p className="text-[.875rem] text-ink-2">Nenhuma etapa ainda. Adicione a primeira abaixo, com a matéria e as horas dela nesta etapa.</p>;

  return (
    <div className="grid gap-2">
      <p className="text-[.8125rem] text-ink-2">Arraste pela alça para mudar a ordem.</p>
      <DndContext sensors={sensores} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis, restrictToParentElement]} onDragEnd={aoSoltar}>
        <SortableContext items={itens.map((e) => e.id)} strategy={verticalListSortingStrategy}>
          <ol className="grid gap-2">
            {itens.map((e, i) => (
              <Item key={e.id} etapa={e} posicao={i + 1} aoRemover={() => remover(e.id)} />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
      {erro && (
        <p role="alert" className="text-[.8125rem] text-red">
          {erro}
        </p>
      )}
    </div>
  );
}
