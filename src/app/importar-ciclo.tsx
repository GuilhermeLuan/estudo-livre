"use client";

import { RiFileUploadLine, RiUpload2Line } from "@remixicon/react";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/base/buttons/button";
import { CICLO_IMPORTADO_GRANDE, LIMITE_DO_CICLO_IMPORTADO_BYTES } from "@/dominio";
import { importarCicloDoArquivo } from "./acoes-ciclos";

/** Cartão "Importar ciclo" de /ciclos/novo: o JSON enxuto (AD-039) vira um Ciclo novo, aberto em seguida (AD-044). */
export function ImportarCiclo() {
  const campo = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  function importar() {
    setErro(null);
    if (!arquivo) return setErro("Escolha um arquivo.");
    // O Next corta corpos grandes antes da action; a mensagem do limite sai daqui também.
    if (arquivo.size > LIMITE_DO_CICLO_IMPORTADO_BYTES) return setErro(CICLO_IMPORTADO_GRANDE);
    const dados = new FormData();
    dados.set("arquivo", arquivo);
    iniciar(async () => {
      const estado = await importarCicloDoArquivo(dados);
      if (estado?.erro) setErro(estado.erro);
    });
  }

  return (
    <section aria-labelledby="h-importar-ciclo" className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-3xl border border-separator-border bg-background-primary-default p-5 shadow-xs">
      <div className="grid gap-1">
        <h2 id="h-importar-ciclo" className="text-title-3-medium text-text-primary">
          Importar ciclo
        </h2>
        <p className="text-body-regular text-text-secondary">Crie um ciclo a partir de um arquivo JSON.</p>
      </div>
      <div className="grid gap-1.5">
        <span id="rotulo-arquivo-ciclo" className="text-body-medium text-text-primary">
          Arquivo do ciclo
        </span>
        <div className="flex min-w-0 items-center gap-3">
          <input
            ref={campo}
            id="arquivo-ciclo"
            type="file"
            name="arquivo"
            accept=".json,application/json"
            aria-labelledby="rotulo-arquivo-ciclo"
            aria-invalid={!!erro}
            aria-describedby={erro ? "erro-arquivo-ciclo" : undefined}
            className="sr-only"
            onChange={(e) => {
              setArquivo(e.target.files?.[0] ?? null);
              setErro(null);
            }}
          />
          <Button type="button" variant="secondary" leadingIcon={RiFileUploadLine} onClick={() => campo.current?.click()} aria-describedby="nome-arquivo-ciclo">
            Escolher arquivo
          </Button>
          <span id="nome-arquivo-ciclo" className="min-w-0 truncate text-body-regular text-text-secondary">
            {arquivo?.name ?? "Nenhum arquivo escolhido"}
          </span>
        </div>
        {erro && (
          <p id="erro-arquivo-ciclo" role="alert" className="text-caption-1-medium text-text-error-primary">
            {erro}
          </p>
        )}
      </div>
      <Button type="button" leadingIcon={RiUpload2Line} onClick={importar} disabled={enviando} className="justify-self-start">
        {enviando ? "Importando…" : "Importar ciclo"}
      </Button>
    </section>
  );
}
