import { cadastrar } from "@/app/acoes-conta";
import { FormularioConta } from "@/app/formulario-conta";

export default function PaginaCadastrar() {
  return (
    <FormularioConta
      acao={cadastrar}
      titulo="Criar conta"
      botao="Criar conta"
      comNome
      rodape={{ texto: "Já tem conta?", link: "Entrar", href: "/entrar" }}
    />
  );
}
