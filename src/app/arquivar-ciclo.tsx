"use client";

import { RiArchiveLine, RiInboxUnarchiveLine } from "@remixicon/react";
import { useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { AlertDialog } from "@/components/base/modal/modal";
import { arquivar, reativar } from "./acoes-ciclos";
import { Aviso } from "./aviso";

/** "Arquivar": confirma e leva à Hoje; um Cronômetro rodando no Ciclo mantém o diálogo aberto com o motivo (AD-023). */
export function ArquivarCiclo({ cicloId, nome }: { cicloId: string; nome: string }) {
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  return (
    <>
      <Button variant="secondary" leadingIcon={RiArchiveLine} onClick={() => { setErro(null); setAberto(true); }}>
        Arquivar
      </Button>
      <AlertDialog
        isOpen={aberto}
        onOpenChange={setAberto}
        variant="default"
        icon={RiArchiveLine}
        title="Arquivar ciclo?"
        description={`O histórico de “${nome}” continua guardado e você pode reativar o ciclo quando quiser.`}
        confirmLabel="Arquivar"
        cancelLabel="Cancelar"
        onConfirm={async () => {
          setErro(null);
          const estado = await arquivar(cicloId);
          if (estado?.erro) {
            setErro(estado.erro);
            throw new Error(estado.erro);
          }
        }}
      >
        {erro && (
          <p role="alert" className="text-body-regular text-text-error-primary">
            {erro}
          </p>
        )}
      </AlertDialog>
    </>
  );
}

/** "Reativar": devolve o Ciclo à Hoje e às sugestões, sem confirmação (nada se perde). */
export function ReativarCiclo({ cicloId }: { cicloId: string }) {
  const [erro, setErro] = useState<string | null>(null);
  return (
    <>
      <Button variant="secondary" leadingIcon={RiInboxUnarchiveLine} onClick={async () => setErro((await reativar(cicloId)).erro ?? null)}>
        Reativar
      </Button>
      <Aviso texto={erro} aoSumir={() => setErro(null)} />
    </>
  );
}
