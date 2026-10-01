"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { EstadoFormulario } from "./acoes-conta";
import { Campo } from "./campo";

type Props = {
  acao: (estado: EstadoFormulario, dados: FormData) => Promise<EstadoFormulario>;
  titulo: string;
  botao: string;
  comNome?: boolean;
  rodape: { texto: string; link: string; href: string } | null;
};

export function FormularioConta({ acao, titulo, botao, comNome, rodape }: Props) {
  const [estado, enviar, enviando] = useActionState(acao, {});
  return (
    <form action={enviar} className="grid gap-4">
      <h1>{titulo}</h1>
      {comNome && <Campo rotulo="Nome" id="nome" name="nome" defaultValue={estado.nome} required autoComplete="name" />}
      <Campo rotulo="E-mail" id="email" name="email" type="email" defaultValue={estado.email} required autoComplete="email" />
      <Campo
        rotulo="Senha"
        id="senha"
        name="senha"
        type="password"
        required
        minLength={comNome ? 8 : undefined}
        autoComplete={comNome ? "new-password" : "current-password"}
      />
      {estado.erro && (
        <p role="alert" className="text-[.8125rem] text-red">
          {estado.erro}
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={enviando}>
        {botao}
      </button>
      {rodape && (
        <p className="text-[.8125rem] text-ink-2">
          {rodape.texto}{" "}
          <Link href={rodape.href} className="btn btn-quiet text-[.8125rem]">
            {rodape.link}
          </Link>
        </p>
      )}
    </form>
  );
}
