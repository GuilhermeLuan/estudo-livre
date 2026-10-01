import Link from "next/link";
import { sair } from "@/app/acoes-conta";
import { Marca } from "@/app/marca";
import { obterCronometro, obterHome } from "@/casos-de-uso";
import { Cronometro } from "@/app/cronometro";
import { obterDb } from "@/db";
import { exigirUsuario } from "@/sessao";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const usuarioLogado = await exigirUsuario();
  const [{ usuario, ciclos }, ativo] = await Promise.all([obterHome(obterDb(), usuarioLogado), obterCronometro(obterDb(), usuarioLogado)]);
  const cicloDoCronometro = ativo ? (ciclos.find((c) => c.id === ativo.cicloId) ?? null) : null;
  return (
    <div className="min-h-screen">
      <nav
        aria-label="Principal"
        className="sticky top-0 z-30 flex items-center gap-1 border-b border-line bg-[color-mix(in_srgb,var(--paper)_88%,transparent)] px-[clamp(16px,3vw,32px)] py-2.5 backdrop-blur-[10px]"
      >
        <Marca />
        {usuario.admin && (
          <Link href="/usuarios" className="btn btn-quiet ml-3 text-[.875rem]">
            Usuários
          </Link>
        )}
        <div className="flex-1" />
        <form action={sair}>
          <button type="submit" className="btn btn-quiet">
            Sair
          </button>
        </form>
      </nav>
      <main className="mx-auto max-w-[1220px] px-[clamp(16px,3vw,32px)] pt-7 pb-36">{children}</main>
      <Cronometro ativo={ativo} ciclo={cicloDoCronometro} />
    </div>
  );
}
