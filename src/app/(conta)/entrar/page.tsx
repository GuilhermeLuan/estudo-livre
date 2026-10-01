import { cadastroAberto } from "@/auth";
import { entrar } from "@/app/acoes-conta";
import { smtpConfigurado } from "@/email";
import { FormularioConta } from "@/app/formulario-conta";

export const dynamic = "force-dynamic";

export default function PaginaEntrar() {
  return (
    <FormularioConta
      acao={entrar}
      titulo="Entrar"
      botao="Entrar"
      esqueci={smtpConfigurado()}
      rodape={cadastroAberto() ? { texto: "Ainda não tem conta?", link: "Criar conta", href: "/cadastrar" } : null}
    />
  );
}
