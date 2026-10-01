"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ICONES = {
  hoje: <path d="M3 9l7-6 7 6v8H3z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
  estatisticas: <path d="M4 16V9M10 16V4M16 16v-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />,
  usuarios: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="10" cy="7" r="3" />
      <path d="M4 17c0-3 3-5 6-5s6 2 6 5" />
    </g>
  ),
} as const;

const LINKS = [
  { href: "/", rotulo: "Hoje", icone: "hoje" },
  { href: "/estatisticas", rotulo: "Estatísticas", icone: "estatisticas" },
  { href: "/usuarios", rotulo: "Usuários", icone: "usuarios", soAdmin: true },
] as const;

/**
 * Links principais. Em telas largas ficam na barra superior; até 760px viram a barra
 * inferior com ícones (docs/design-system.md). O layout renderiza os dois formatos.
 */
export function Navegacao({ admin, formato }: { admin: boolean; formato: "topo" | "base" }) {
  const caminho = usePathname();
  const ativo = (href: string) => caminho === href || (href !== "/" && caminho.startsWith(`${href}/`));
  const links = LINKS.filter((l) => !("soAdmin" in l) || admin);
  return (
    <nav aria-label={formato === "topo" ? "Principal" : "Principal (celular)"} className={formato === "topo" ? "nav-topo" : "nav-base"}>
      {links.map((l) => (
        <Link key={l.href} href={l.href} aria-current={ativo(l.href) ? "page" : undefined} className="nav-link">
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            {ICONES[l.icone]}
          </svg>
          <span>{l.rotulo}</span>
        </Link>
      ))}
    </nav>
  );
}
