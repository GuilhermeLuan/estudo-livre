"use client";

import { useActionState } from "react";
import type { EstadoFormulario } from "./acoes-conta";
import { Button } from "@/components/base/buttons/button";
import { LinkButton } from "@/components/base/buttons/link-button";
import { Input } from "@/components/base/input/input";

type Props = {
  acao: (estado: EstadoFormulario, dados: FormData) => Promise<EstadoFormulario>;
  titulo: string;
  descricao?: string;
  botao: string;
  campo: { rotulo: string; name: string; type: string; autoComplete: string; minLength?: number };
  oculto?: Record<string, string>;
  voltar: { texto: string; href: string };
};

/** Formulário de conta com um único campo (e-mail ou nova senha). */
export function FormularioSimples({ acao, titulo, descricao, botao, campo, oculto, voltar }: Props) {
  const [estado, enviar, enviando] = useActionState(acao, {});
  return (
    <form action={enviar} className="grid gap-4">
      <div className="grid gap-1">
        <h1 className="text-title-2-medium text-text-primary">{titulo}</h1>
        {descricao && <p className="text-body-regular text-text-secondary">{descricao}</p>}
      </div>
      {Object.entries(oculto ?? {}).map(([nome, valor]) => (
        <input key={nome} type="hidden" name={nome} value={valor} />
      ))}
      <Input label={campo.rotulo} name={campo.name} type={campo.type} autoComplete={campo.autoComplete} minLength={campo.minLength} defaultValue={estado.email} isRequired />
      {estado.erro && (
        <p role="alert" className="text-body-regular text-text-error-primary">
          {estado.erro}
        </p>
      )}
      {estado.ok && (
        <p role="status" className="text-body-regular text-state-success-text">
          {estado.ok}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={enviando}>
        {botao}
      </Button>
      <LinkButton href={voltar.href} size="small" className="justify-self-center">
        {voltar.texto}
      </LinkButton>
    </form>
  );
}
