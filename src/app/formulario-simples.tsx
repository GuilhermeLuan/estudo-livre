"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { EstadoFormulario } from "./acoes-conta";
import { Campo } from "./campo";

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
      <h1>{titulo}</h1>
      {descricao && <p className="text-[.8125rem] text-ink-2">{descricao}</p>}
      {Object.entries(oculto ?? {}).map(([nome, valor]) => (
        <input key={nome} type="hidden" name={nome} value={valor} />
      ))}
      <Campo rotulo={campo.rotulo} id={campo.name} name={campo.name} type={campo.type} autoComplete={campo.autoComplete} minLength={campo.minLength} defaultValue={estado.email} required />
      {estado.erro && (
        <p role="alert" className="text-[.8125rem] text-red">
          {estado.erro}
        </p>
      )}
      {estado.ok && (
        <p role="status" className="text-[.8125rem] text-green">
          {estado.ok}
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={enviando}>
        {botao}
      </button>
      <Link href={voltar.href} className="btn btn-quiet self-start text-[.8125rem]">
        {voltar.texto}
      </Link>
    </form>
  );
}
