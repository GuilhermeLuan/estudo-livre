import { notFound } from "next/navigation";
import { pedirRecuperacao } from "@/app/acoes-conta";
import { FormularioSimples } from "@/app/formulario-simples";
import { smtpConfigurado } from "@/email";

export const dynamic = "force-dynamic";

export default function PaginaEsqueciSenha() {
  if (!smtpConfigurado()) notFound();
  return (
    <FormularioSimples
      acao={pedirRecuperacao}
      titulo="Recuperar senha"
      descricao="Informe o e-mail da sua conta e enviaremos um link para escolher uma nova senha."
      botao="Enviar link"
      campo={{ rotulo: "E-mail", name: "email", type: "email", autoComplete: "email" }}
      voltar={{ texto: "Voltar para Entrar", href: "/entrar" }}
    />
  );
}
