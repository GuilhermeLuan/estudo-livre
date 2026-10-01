import { sair } from "@/app/acoes-conta";
import { Cronometro } from "@/app/cronometro";
import { Marca } from "@/app/marca";
import { Navegacao } from "@/app/navegacao";
import { obterCronometro, obterHome } from "@/casos-de-uso";
import { obterDb } from "@/db";
import { exigirUsuario } from "@/sessao";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const usuarioLogado = await exigirUsuario();
  const [{ usuario, ciclos }, ativo] = await Promise.all([obterHome(obterDb(), usuarioLogado), obterCronometro(obterDb(), usuarioLogado)]);
  const cicloDoCronometro = ativo ? (ciclos.find((c) => c.id === ativo.cicloId) ?? null) : null;
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 flex items-center border-b border-line bg-[color-mix(in_srgb,var(--paper)_88%,transparent)] px-[clamp(16px,3vw,32px)] py-2.5 backdrop-blur-[10px]">
        <Marca />
        <Navegacao admin={usuario.admin} formato="topo" />
        <div className="flex-1" />
        <form action={sair}>
          <button type="submit" className="btn btn-quiet">
            Sair
          </button>
        </form>
      </header>
      <Navegacao admin={usuario.admin} formato="base" />
      <main className="mx-auto max-w-[1220px] px-[clamp(16px,3vw,32px)] pt-7 pb-36">{children}</main>
      <Cronometro ativo={ativo} ciclo={cicloDoCronometro} />
    </div>
  );
}
