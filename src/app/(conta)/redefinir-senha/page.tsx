import { LinkButton } from "@/components/base/buttons/link-button";
import { redefinirComToken } from "@/app/acoes-conta";
import { FormularioSimples } from "@/app/formulario-simples";

export default async function PaginaRedefinirSenha({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!token)
    return (
      <div className="grid gap-4">
        <h1 className="text-title-2-medium text-text-primary">Link inválido</h1>
        <p className="text-body-regular text-text-secondary">O link para redefinir a senha é inválido ou expirou.</p>
        <LinkButton href="/entrar" size="small" className="justify-self-center">
          Voltar para Entrar
        </LinkButton>
      </div>
    );
  return (
    <FormularioSimples
      acao={redefinirComToken}
      titulo="Nova senha"
      botao="Salvar senha"
      campo={{ rotulo: "Nova senha", name: "senha", type: "password", autoComplete: "new-password", minLength: 8 }}
      oculto={{ token }}
      voltar={{ texto: "Voltar para Entrar", href: "/entrar" }}
    />
  );
}
