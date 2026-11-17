import { cadastroAberto } from "@/auth";
import { entrar } from "@/app/acoes-conta";
import { smtpConfigurado } from "@/email";
import { FormularioConta } from "@/app/formulario-conta";

export const dynamic = "force-dynamic";

export default function PaginaEntrar() {
  return (
    <FormularioConta
      acao={entrar}
      titulo="Entrar no Estudo Livre"
      descricao="Use o e-mail e a senha da sua conta nesta instância."
      botao="Entrar"
      esqueci={smtpConfigurado()}
      rodape={cadastroAberto() ? { texto: "Não tem conta?", link: "Criar conta", href: "/cadastrar" } : null}
    />
  );
}
