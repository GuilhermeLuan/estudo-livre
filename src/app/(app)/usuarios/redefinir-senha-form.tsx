"use client";

import { useActionState } from "react";
import { redefinirSenhaDeUsuario } from "@/app/acoes-admin";

export function RedefinirSenhaForm({ usuarioId, nome }: { usuarioId: string; nome: string }) {
  const [estado, enviar, enviando] = useActionState(redefinirSenhaDeUsuario, {});
  return (
    <form action={enviar} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="usuarioId" value={usuarioId} />
      <input
        className="input w-44"
        type="password"
        name="senha"
        aria-label={`Nova senha de ${nome}`}
        placeholder="Nova senha"
        minLength={8}
        autoComplete="new-password"
        required
      />
      <button type="submit" className="btn" disabled={enviando}>
        Redefinir senha
      </button>
      {estado.erro && (
        <span role="alert" className="text-[.8125rem] text-red">
          {estado.erro}
        </span>
      )}
      {estado.ok && (
        <span role="status" className="text-[.8125rem] text-green">
          {estado.ok}
        </span>
      )}
    </form>
  );
}
