"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Aviso } from "./aviso";
import { avisoDaVoltaConcluida } from "./formato";

/** O aviso de AD-018 depois de "Gerar ciclo" fechar a Volta: vem em `?volta-concluida=N` e sai da URL ao sumir. */
export function AvisoDaVoltaConcluida({ numero }: { numero: number | null }) {
  const [texto, setTexto] = useState(numero ? avisoDaVoltaConcluida(numero) : null);
  const router = useRouter();
  const caminho = usePathname();
  return (
    <Aviso
      texto={texto}
      aoSumir={() => {
        setTexto(null);
        router.replace(caminho, { scroll: false });
      }}
    />
  );
}
