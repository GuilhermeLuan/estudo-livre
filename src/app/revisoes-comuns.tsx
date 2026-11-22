"use client";

import { RiInformationFill } from "@remixicon/react";
import { useRouter } from "next/navigation";
import { Chip, type ChipColor } from "@/components/base/badges/chip";
import { SegmentedControl, SegmentedControlItem } from "@/components/base/segmented-control/segmented-control";
import type { Nota } from "@/revisao";
import { vencimentoDaRevisao } from "./formato";

/** O que cumpre uma Revisão: a mesma frase na Hoje e na página Revisões (AD-031). */
export const AVISO_DA_REVISAO = "Uma revisão é cumprida por um registro de estudo do tópico com questões.";

/** "Todos" mais um segmento por Ciclo ativo; a escolha vai para `?ciclo=` de `base`, e a página filtra no servidor. */
export function FiltroDeRevisoes({ base, ciclos, escolhido, rotuloTodos = "Todos" }: { base: string; ciclos: { id: string; nome: string }[]; escolhido: string | null; rotuloTodos?: string }) {
  const router = useRouter();
  return (
    <SegmentedControl
      aria-label="Filtrar revisões por ciclo"
      selectedKeys={[escolhido ?? "todos"]}
      onSelectionChange={(chaves) => {
        const chave = String([...chaves][0]);
        router.push(chave === "todos" ? base : `${base}?ciclo=${chave}`);
      }}
    >
      <SegmentedControlItem id="todos">{rotuloTodos}</SegmentedControlItem>
      {ciclos.map((c) => (
        <SegmentedControlItem key={c.id} id={c.id}>
          {c.nome}
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  );
}

/** O chip de vencimento: "Atrasada Nd" (rosa), "Hoje" (amarelo), "Amanhã" ou "dd/mm" (cinza). */
export function ChipDeVencimento({ diasDeAtraso, dia }: { diasDeAtraso: number; dia: string }) {
  const { texto, cor } = vencimentoDaRevisao(diasDeAtraso, dia);
  return (
    <Chip variant="caption" color={cor}>
      {texto}
    </Chip>
  );
}

const COR_DA_NOTA: Record<Nota, ChipColor> = { Errei: "rose", Difícil: "orange", Bom: "blue", Fácil: "lime" };

/** A última nota da Revisão; sem nota, o traço. */
export function ChipDeNota({ nota }: { nota: Nota | null }) {
  if (!nota) return <span className="text-text-tertiary">—</span>;
  return (
    <Chip variant="caption" color={COR_DA_NOTA[nota]}>
      {nota}
    </Chip>
  );
}

/** O aviso azul do rodapé do cartão da Hoje, repetido na página Revisões. */
export function AvisoDaRevisao() {
  return (
    <p className="flex items-start gap-2 rounded-xl bg-status-blue-background px-3 py-2.5 text-body-regular text-status-blue-text">
      <RiInformationFill className="mt-0.5 size-4 shrink-0" aria-hidden />
      {AVISO_DA_REVISAO}
    </p>
  );
}
