import Link from "next/link";
import { redefinirComToken } from "@/app/acoes-conta";
import { FormularioSimples } from "@/app/formulario-simples";

export default async function PaginaRedefinirSenha({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!token)
    return (
      <div className="grid gap-4">
        <h1>Link inválido</h1>
        <p className="text-[.8125rem] text-ink-2">O link para redefinir a senha é inválido ou expirou.</p>
        <Link href="/entrar" className="btn btn-quiet self-start text-[.8125rem]">
          Voltar para Entrar
        </Link>
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
