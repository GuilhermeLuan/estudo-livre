"use client";

import { RiAddLine, RiTimerLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { useCronometro } from "./cronometro";

/** Os botões do topo da Hoje no computador: iniciar o Cronômetro na Próxima etapa e registrar estudo. */
export function AcoesDaHoje({ proxima }: { proxima: { materiaId: string; nome: string } | null }) {
  const { abrirRegistro, iniciar, pendente, materias } = useCronometro();
  return (
    <div className="flex gap-3 max-lg:hidden">
      {proxima && (
        <Button variant="secondary" leadingIcon={RiTimerLine} disabled={pendente} onClick={() => iniciar(proxima)}>
          Iniciar cronômetro
        </Button>
      )}
      <Button leadingIcon={RiAddLine} disabled={materias.length === 0} onClick={() => abrirRegistro()}>
        Registrar estudo
      </Button>
    </div>
  );
}

/** "Registrar estudo" avulso, para os estados vazios. */
export function BotaoRegistrarEstudo() {
  const { abrirRegistro, materias } = useCronometro();
  return (
    <Button leadingIcon={RiAddLine} disabled={materias.length === 0} onClick={() => abrirRegistro()}>
      Registrar estudo
    </Button>
  );
}
