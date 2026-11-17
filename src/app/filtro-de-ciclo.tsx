"use client";

import { useRouter } from "next/navigation";
import { SegmentedControl, SegmentedControlItem } from "@/components/base/segmented-control/segmented-control";

/** "Todos os ciclos" mais um segmento por Ciclo; a escolha vai para o endereço, e a página filtra no servidor. */
export function FiltroDeCiclo({ ciclos, escolhido }: { ciclos: { id: string; nome: string }[]; escolhido?: string }) {
  const router = useRouter();
  return (
    <SegmentedControl
      aria-label="Filtrar por ciclo"
      selectedKeys={[escolhido ?? "todos"]}
      onSelectionChange={(chaves) => {
        const chave = String([...chaves][0]);
        router.push(chave === "todos" ? "/estatisticas" : `/estatisticas?ciclo=${chave}`);
      }}
    >
      <SegmentedControlItem id="todos">Todos os ciclos</SegmentedControlItem>
      {ciclos.map((c) => (
        <SegmentedControlItem key={c.id} id={c.id}>
          {c.nome}
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  );
}
