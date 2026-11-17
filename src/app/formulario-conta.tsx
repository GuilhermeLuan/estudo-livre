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
  comNome?: boolean;
  esqueci?: boolean;
  rodape: { texto: string; link: string; href: string } | null;
};

export function FormularioConta({ acao, titulo, descricao, botao, comNome, esqueci, rodape }: Props) {
  const [estado, enviar, enviando] = useActionState(acao, {});
  return (
    <form action={enviar} className="grid gap-4">
      <div className="grid gap-1">
        <h1 className="text-title-2-medium text-text-primary">{titulo}</h1>
        {descricao && <p className="text-body-regular text-text-secondary">{descricao}</p>}
      </div>
      {comNome && <Input label="Nome" name="nome" defaultValue={estado.nome} isRequired autoComplete="name" />}
      <Input label="E-mail" name="email" type="email" defaultValue={estado.email} isRequired autoComplete="email" />
      <Input
        label="Senha"
        name="senha"
        type="password"
        isRequired
        minLength={comNome ? 8 : undefined}
        autoComplete={comNome ? "new-password" : "current-password"}
      />
      {esqueci && (
        <LinkButton href="/esqueci-senha" size="small" className="justify-self-end">
          Esqueci minha senha
        </LinkButton>
      )}
      {estado.erro && (
        <p role="alert" className="text-body-regular text-text-error-primary">
          {estado.erro}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={enviando}>
        {botao}
      </Button>
      {rodape && (
        <p className="border-t border-separator-border pt-4 text-center text-body-regular text-text-secondary">
          {rodape.texto}{" "}
          <LinkButton href={rodape.href} size="small">
            {rodape.link}
          </LinkButton>
        </p>
      )}
    </form>
  );
}
