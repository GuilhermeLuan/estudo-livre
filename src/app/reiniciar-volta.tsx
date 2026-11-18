"use client";

import { RiRestartLine } from "@remixicon/react";
import { useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { AlertDialog } from "@/components/base/modal/modal";
import { reiniciar } from "./acoes-ciclos";
import { Aviso } from "./aviso";

/** "Reiniciar volta": confirma e fecha a Volta `numero` (a que o Usuário vê aberta), abrindo a seguinte. */
export function ReiniciarVolta({ cicloId, numero }: { cicloId: string; numero: number }) {
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  return (
    <>
      <Button variant="secondary" leadingIcon={RiRestartLine} onClick={() => setAberto(true)}>
        Reiniciar volta
      </Button>
      <AlertDialog
        isOpen={aberto}
        onOpenChange={setAberto}
        variant="default"
        icon={RiRestartLine}
        title="Reiniciar volta?"
        description={`A Volta ${numero} será fechada agora e a Volta ${numero + 1} começa do zero. O que você estudou fica no histórico da Volta ${numero}.`}
        confirmLabel="Reiniciar volta"
        cancelLabel="Cancelar"
        onConfirm={async () => {
          const estado = await reiniciar(cicloId, numero);
          if (estado.erro) setErro(estado.erro);
        }}
      />
      <Aviso texto={erro} aoSumir={() => setErro(null)} />
    </>
  );
}
