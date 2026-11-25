"use client";

import { RiFileUploadLine, RiUpload2Line } from "@remixicon/react";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/base/buttons/button";
import { SegmentedControl, SegmentedControlItem } from "@/components/base/segmented-control/segmented-control";
import { Textarea } from "@/components/base/textarea/textarea";
import { CICLO_IMPORTADO_GRANDE, LIMITE_DO_CICLO_IMPORTADO_BYTES } from "@/dominio";
import { importarCicloDoJson } from "./acoes-ciclos";

type Origem = "arquivo" | "colar";

/**
 * Cartão "Importar ciclo" de /ciclos/novo: o JSON enxuto (AD-044) vem de um arquivo ou colado (AD-050) e vira um
 * Ciclo novo, aberto em seguida (AD-049). Vale só o conteúdo da opção à vista.
 */
export function ImportarCiclo() {
  const campo = useRef<HTMLInputElement>(null);
  const [origem, setOrigem] = useState<Origem>("arquivo");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  function importar() {
    setErro(null);
    const dados = new FormData();
    if (origem === "arquivo") {
      if (!arquivo) return setErro("Escolha um arquivo.");
      // O Next corta corpos grandes antes da action; a mensagem do limite sai daqui também.
      if (arquivo.size > LIMITE_DO_CICLO_IMPORTADO_BYTES) return setErro(CICLO_IMPORTADO_GRANDE);
      dados.set("arquivo", arquivo);
    } else {
      if (!texto.trim()) return setErro("Cole o JSON do ciclo.");
      if (new Blob([texto]).size > LIMITE_DO_CICLO_IMPORTADO_BYTES) return setErro(CICLO_IMPORTADO_GRANDE);
      dados.set("texto", texto);
    }
    iniciar(async () => {
      const estado = await importarCicloDoJson(dados);
      if (estado?.erro) setErro(estado.erro);
    });
  }

  const mensagem = erro && (
    <p id="erro-importar-ciclo" role="alert" className="text-caption-1-medium text-text-error-primary">
      {erro}
    </p>
  );

  return (
    <section aria-labelledby="h-importar-ciclo" className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-3xl border border-separator-border bg-background-primary-default p-5 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h2 id="h-importar-ciclo" className="text-title-3-medium text-text-primary">
            Importar ciclo
          </h2>
          <p className="text-body-regular text-text-secondary">Crie um ciclo a partir de um JSON.</p>
        </div>
        <SegmentedControl
          aria-label="Origem do JSON"
          selectedKeys={[origem]}
          onSelectionChange={(chaves) => {
            setOrigem([...chaves][0] as Origem);
            setErro(null);
          }}
        >
          <SegmentedControlItem id="arquivo">Arquivo</SegmentedControlItem>
          <SegmentedControlItem id="colar">Colar JSON</SegmentedControlItem>
        </SegmentedControl>
      </div>

      {origem === "arquivo" ? (
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
              aria-describedby={erro ? "erro-importar-ciclo" : undefined}
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
          {mensagem}
        </div>
      ) : (
        <div className="grid gap-1.5">
          <Textarea
            label="JSON do ciclo"
            name="texto"
            rows={10}
            maxRows={20}
            placeholder="Cole aqui o JSON do ciclo."
            value={texto}
            onChange={(v) => {
              setTexto(v);
              setErro(null);
            }}
            isInvalid={!!erro}
            aria-describedby={erro ? "erro-importar-ciclo" : undefined}
          />
          {mensagem}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="button" leadingIcon={RiUpload2Line} onClick={importar} disabled={enviando}>
          {enviando ? "Importando…" : "Importar ciclo"}
        </Button>
      </div>
    </section>
  );
}
