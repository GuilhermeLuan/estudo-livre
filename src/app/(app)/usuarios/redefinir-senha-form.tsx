"use client";

import { useActionState, useState } from "react";
import { redefinirSenhaDeUsuario } from "@/app/acoes-admin";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";

/** "Redefinir senha": abre o campo na própria linha da tabela. */
export function RedefinirSenhaForm({ usuarioId, nome }: { usuarioId: string; nome: string }) {
  const [aberto, setAberto] = useState(false);
  const [estado, enviar, enviando] = useActionState(redefinirSenhaDeUsuario, {});
  if (!aberto && !estado.ok)
    return (
      <Button variant="secondary" size="small" onClick={() => setAberto(true)}>
        Redefinir senha
      </Button>
    );
  return (
    <form action={enviar} className="flex flex-wrap items-start gap-2">
      <input type="hidden" name="usuarioId" value={usuarioId} />
      <Input aria-label={`Nova senha de ${nome}`} name="senha" type="password" placeholder="Nova senha" minLength={8} autoComplete="new-password" isRequired size="small" className="w-44" autoFocus />
      <Button type="submit" size="small" disabled={enviando}>
        Redefinir senha
      </Button>
      {estado.erro && (
        <span role="alert" className="self-center text-body-regular text-text-error-primary">
          {estado.erro}
        </span>
      )}
      {estado.ok && (
        <span role="status" className="self-center text-body-regular text-state-success-text">
          {estado.ok}
        </span>
      )}
    </form>
  );
}
