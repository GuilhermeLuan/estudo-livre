"use client";

import { RiFileUploadLine, RiUpload2Line } from "@remixicon/react";
import { useRef, useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { AlertDialog } from "@/components/base/modal/modal";
import { BACKUP_GRANDE, LIMITE_DO_BACKUP_BYTES } from "@/dominio";
import { importar } from "./acoes-backup";
import { Aviso } from "./aviso";

/** Campo de arquivo, "Importar backup", a confirmação quando a conta tem Ciclos (AD-036) e o resultado. */
export function ImportarBackup({ totalDeCiclos }: { totalDeCiclos: number }) {
  const campo = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    const dados = new FormData();
    dados.set("arquivo", arquivo!);
    setEnviando(true);
    try {
      const estado = await importar(dados);
      if (estado.erro) return setErro(estado.erro);
      setAviso(estado.aviso ?? null);
      setArquivo(null);
      if (campo.current) campo.current.value = "";
    } finally {
      setEnviando(false);
    }
  };

  const pedirImportacao = () => {
    setErro(null);
    // O Next corta corpos acima do limite antes da action: a mensagem precisa sair daqui.
    if (!arquivo) return setErro("Escolha um arquivo.");
    if (arquivo.size > LIMITE_DO_BACKUP_BYTES) return setErro(BACKUP_GRANDE);
    if (totalDeCiclos > 0) return setConfirmando(true);
    void enviar();
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <span id="rotulo-arquivo" className="text-body-medium text-text-primary">
          Arquivo de backup
        </span>
        <div className="flex min-w-0 items-center gap-3">
          <input
            ref={campo}
            id="arquivo-backup"
            type="file"
            name="arquivo"
            accept=".json,application/json"
            aria-labelledby="rotulo-arquivo"
            aria-invalid={!!erro}
            aria-describedby={erro ? "erro-arquivo" : undefined}
            className="sr-only"
            onChange={(e) => {
              setArquivo(e.target.files?.[0] ?? null);
              setErro(null);
            }}
          />
          <Button type="button" variant="secondary" leadingIcon={RiFileUploadLine} onClick={() => campo.current?.click()} aria-describedby="nome-arquivo">
            Escolher arquivo
          </Button>
          <span id="nome-arquivo" className="min-w-0 truncate text-body-regular text-text-secondary">
            {arquivo?.name ?? "Nenhum arquivo escolhido"}
          </span>
        </div>
        {erro && (
          <p id="erro-arquivo" role="alert" className="text-caption-1-medium text-text-error-primary">
            {erro}
          </p>
        )}
      </div>
      <Button type="button" leadingIcon={RiUpload2Line} onClick={pedirImportacao} disabled={enviando} className="justify-self-start">
        {enviando ? "Importando…" : "Importar backup"}
      </Button>
      <AlertDialog
        isOpen={confirmando}
        onOpenChange={setConfirmando}
        title="Substituir seus dados?"
        description={
          totalDeCiclos === 1
            ? "O ciclo desta conta, com registros e revisões, será apagado e trocado pelos do arquivo. Isso não pode ser desfeito."
            : `Os ${totalDeCiclos} ciclos desta conta, com registros e revisões, serão apagados e trocados pelos do arquivo. Isso não pode ser desfeito.`
        }
        confirmLabel="Substituir"
        cancelLabel="Cancelar"
        pendingLabel="Substituindo…"
        onConfirm={enviar}
      />
      <Aviso texto={aviso} aoSumir={() => setAviso(null)} />
    </div>
  );
}
