import { sair } from "@/app/acoes-conta";
import { Marca } from "@/app/marca";

export default function LayoutApp({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <nav
        aria-label="Principal"
        className="sticky top-0 z-30 flex items-center gap-1 border-b border-line bg-[color-mix(in_srgb,var(--paper)_88%,transparent)] px-[clamp(16px,3vw,32px)] py-2.5 backdrop-blur-[10px]"
      >
        <Marca />
        <div className="flex-1" />
        <form action={sair}>
          <button type="submit" className="btn btn-quiet">
            Sair
          </button>
        </form>
      </nav>
      <main className="mx-auto max-w-[1220px] px-[clamp(16px,3vw,32px)] pt-7 pb-36">{children}</main>
    </div>
  );
}
