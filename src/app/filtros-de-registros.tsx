"use client";

import { RiCloseLine } from "@remixicon/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/base/buttons/button";
import { Select, SelectItem } from "@/components/base/select/select";

export type CicloParaFiltro = { id: string; nome: string; materias: { id: string; nome: string }[] };

/** O endereço da lista: a escolha dos filtros e o "Carregar mais" vivem na URL, e a página filtra no servidor. */
export function enderecoDosRegistros({ ciclo, materia, limite }: { ciclo?: string; materia?: string; limite?: number }) {
  const q = new URLSearchParams();
  if (ciclo) q.set("ciclo", ciclo);
  if (materia) q.set("materia", materia);
  if (limite) q.set("limite", String(limite));
  const texto = q.toString();
  return texto ? `/registros?${texto}` : "/registros";
}

/** "Ciclo" e "Matéria": a Matéria só abre depois de escolher um Ciclo (as Matérias são do Ciclo). */
export function FiltrosDeRegistros({ ciclos, ciclo, materia }: { ciclos: CicloParaFiltro[]; ciclo?: string; materia?: string }) {
  const router = useRouter();
  const doCiclo = ciclos.find((c) => c.id === ciclo);
  return (
    <div className="flex flex-wrap items-end gap-3">
      <Select label="Ciclo" selectedKey={doCiclo?.id ?? "todos"} onSelectionChange={(k) => router.push(enderecoDosRegistros({ ciclo: k === "todos" ? undefined : String(k) }))} className="w-full sm:w-56" triggerClassName="w-full">
        <SelectItem id="todos" textValue="Todos os ciclos">
          Todos os ciclos
        </SelectItem>
        {ciclos.map((c) => (
          <SelectItem key={c.id} id={c.id} textValue={c.nome}>
            {c.nome}
          </SelectItem>
        ))}
      </Select>
      <Select label="Matéria" isDisabled={!doCiclo} selectedKey={doCiclo && materia && doCiclo.materias.some((m) => m.id === materia) ? materia : "todas"} onSelectionChange={(k) => router.push(enderecoDosRegistros({ ciclo, materia: k === "todas" ? undefined : String(k) }))} className="w-full sm:w-56" triggerClassName="w-full">
        <SelectItem id="todas" textValue="Todas as matérias">
          Todas as matérias
        </SelectItem>
        {(doCiclo?.materias ?? []).map((m) => (
          <SelectItem key={m.id} id={m.id} textValue={m.nome}>
            {m.nome}
          </SelectItem>
        ))}
      </Select>
      {(ciclo || materia) && (
        <Button variant="secondary" leadingIcon={RiCloseLine} onClick={() => router.push("/registros")}>
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
