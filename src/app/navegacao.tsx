"use client";

import {
  RiAddLine,
  RiArchiveLine,
  RiBarChartBoxLine,
  RiFlag2Line,
  RiFileListLine,
  RiHome5Line,
  RiLogoutBoxRLine,
  RiUser3Line,
} from "@remixicon/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Avatar } from "@/components/base/avatar/avatar";
import { Chip } from "@/components/base/badges/chip";
import { Counter } from "@/components/base/badges/counter";
import { Dropdown, DropdownDivider, DropdownGroup, DropdownItem, DropdownPopover, DropdownTrigger } from "@/components/base/dropdown/dropdown";
import { cx } from "@/utils/cx";
import { sair } from "./acoes-conta";
import { CartaoDoCronometro, useCronometro } from "./cronometro";
import { IconeDaMarca } from "./marca";
import { SeletorDeTema } from "./tema";

export type DadosDoMenu = {
  usuario: { nome: string; email: string; admin: boolean };
  ciclos: { id: string; nome: string }[];
  /** Quantos Ciclos arquivados; o item "Arquivados" mostra o Counter só quando há. */
  arquivados: number;
};

const iniciais = (nome: string) =>
  nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");

const ativoEm = (caminho: string, href: string) => caminho === href || (href !== "/" && caminho.startsWith(`${href}/`));

/** O item da Sidebar: selecionado, ganha o gradiente do botão primário e `aria-current="page"`. */
function ItemDeNavegacao({ href, selecionado, icone: Icone, contador, children }: { href: string; selecionado: boolean; icone: typeof RiHome5Line; contador?: number; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={selecionado ? "page" : undefined}
      className={cx(
        "flex h-9 items-center gap-2 rounded-xl px-2 text-body-medium outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring",
        selecionado ? "bg-button-primary text-text-white shadow-xs" : "text-text-secondary hover:bg-background-secondary-hover",
      )}
    >
      <Icone className="size-5 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {!!contador && <Counter color={selecionado ? "primary" : "neutral"}>{contador}</Counter>}
    </Link>
  );
}

/** O cartão de quem está logado; abre o tema, que não tem lugar próprio no desenho. */
function CartaoDoUsuario({ usuario }: Pick<DadosDoMenu, "usuario">) {
  return (
    <Dropdown>
      <DropdownTrigger className="flex w-full items-center gap-2 rounded-xl bg-background-secondary-hover p-2 text-start" aria-label="Conta e tema">
        <Avatar size="md" color="blue" initials={iniciais(usuario.nome)} />
        <span className="grid min-w-0 flex-1">
          <span className="truncate text-body-medium text-text-primary">{usuario.nome}</span>
          <span className="truncate text-caption-1-regular text-text-secondary">{usuario.email}</span>
        </span>
        {usuario.admin && (
          <Chip variant="caption" color="blue">
            Admin
          </Chip>
        )}
      </DropdownTrigger>
      <DropdownPopover aria-label="Tema" placement="top start" dialogClassName="p-1">
        <DropdownGroup label="Tema">
          <SeletorDeTema />
        </DropdownGroup>
      </DropdownPopover>
    </Dropdown>
  );
}

/** A Sidebar do computador (≥ 1024px). */
export function Sidebar({ usuario, ciclos, arquivados }: DadosDoMenu) {
  const caminho = usePathname();
  return (
    <aside aria-label="Navegação" className="fixed top-3 bottom-3 left-3 z-30 hidden w-[260px] flex-col gap-1 overflow-y-auto rounded-3xl border border-separator-border bg-background-secondary-default p-3 lg:flex">
      <Link href="/" className="mb-2 flex items-center gap-2 rounded-xl px-1 py-1.5 text-headline-medium text-text-primary">
        <IconeDaMarca className="size-8 rounded-lg" />
        Estudo Livre
      </Link>
      <nav aria-label="Principal" className="grid gap-1">
        <ItemDeNavegacao href="/" selecionado={caminho === "/"} icone={RiHome5Line}>
          Hoje
        </ItemDeNavegacao>
        <ItemDeNavegacao href="/registros" selecionado={ativoEm(caminho, "/registros")} icone={RiFileListLine}>
          Registros
        </ItemDeNavegacao>
        <ItemDeNavegacao href="/estatisticas" selecionado={ativoEm(caminho, "/estatisticas")} icone={RiBarChartBoxLine}>
          Estatísticas
        </ItemDeNavegacao>
      </nav>
      <nav aria-label="Ciclos" className="mt-3 grid gap-1">
        <div className="flex items-center justify-between px-2 text-body-regular text-text-tertiary">
          Ciclos
          <Link href="/ciclos/novo" aria-label="Novo ciclo" className="grid size-6 place-items-center rounded-md hover:bg-background-secondary-hover">
            <RiAddLine className="size-4" aria-hidden />
          </Link>
        </div>
        {ciclos.map((c) => (
          <ItemDeNavegacao key={c.id} href={`/ciclos/${c.id}`} selecionado={caminho === `/ciclos/${c.id}`} icone={RiFlag2Line}>
            {c.nome}
          </ItemDeNavegacao>
        ))}
        <ItemDeNavegacao href="/ciclos/arquivados" selecionado={caminho === "/ciclos/arquivados"} icone={RiArchiveLine} contador={arquivados}>
          Arquivados
        </ItemDeNavegacao>
      </nav>
      <div className="mt-auto grid gap-2 pt-3">
        <CartaoDoCronometro variante="cartao" />
        <nav aria-label="Conta" className="grid gap-1">
          {usuario.admin && (
            <ItemDeNavegacao href="/usuarios" selecionado={ativoEm(caminho, "/usuarios")} icone={RiUser3Line}>
              Usuários
            </ItemDeNavegacao>
          )}
          <form action={sair}>
            <button type="submit" className="flex h-9 w-full items-center gap-2 rounded-xl px-2 text-body-medium text-text-secondary outline-none hover:bg-background-secondary-hover focus-visible:ring-2 focus-visible:ring-border-focus-ring">
              <RiLogoutBoxRLine className="size-5 shrink-0" aria-hidden />
              Sair
            </button>
          </form>
        </nav>
        <CartaoDoUsuario usuario={usuario} />
      </div>
    </aside>
  );
}

const TITULOS: Record<string, string> = { "/": "Hoje", "/registros": "Registros", "/estatisticas": "Estatísticas", "/ciclos/arquivados": "Arquivados" };

/** O topo do celular (< 1024px): a marca, o título da rota e o avatar que abre o menu. */
export function CabecalhoMovel({ usuario, ciclos, arquivados }: DadosDoMenu) {
  const caminho = usePathname();
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 bg-background-full px-4 py-3 lg:hidden">
      <IconeDaMarca className="size-8 rounded-lg" />
      <span className="flex-1 text-title-3-medium text-text-primary">{TITULOS[caminho] ?? "Estudo Livre"}</span>
      <Dropdown>
        <DropdownTrigger className="rounded-full" aria-label="Menu da conta">
          <Avatar size="lg" color="blue" initials={iniciais(usuario.nome)} />
        </DropdownTrigger>
        <DropdownPopover aria-label="Menu da conta" placement="bottom end" dialogClassName="p-1">
          <DropdownGroup label="Ciclos">
            {ciclos.map((c) => (
              <DropdownItem key={c.id} onSelect={() => router.push(`/ciclos/${c.id}`)} selected={caminho === `/ciclos/${c.id}`}>
                {c.nome}
              </DropdownItem>
            ))}
            <DropdownItem onSelect={() => router.push("/ciclos/novo")}>Novo ciclo</DropdownItem>
            <DropdownItem onSelect={() => router.push("/ciclos/arquivados")} selected={caminho === "/ciclos/arquivados"}>
              {arquivados ? `Arquivados (${arquivados})` : "Arquivados"}
            </DropdownItem>
          </DropdownGroup>
          <DropdownDivider />
          {usuario.admin && <DropdownItem onSelect={() => router.push("/usuarios")}>Usuários</DropdownItem>}
          <DropdownGroup label="Tema">
            <SeletorDeTema />
          </DropdownGroup>
          <DropdownDivider />
          <DropdownItem onSelect={() => void sair()}>Sair</DropdownItem>
        </DropdownPopover>
      </Dropdown>
    </header>
  );
}

/** A faixa do Cronômetro acima da barra de abas, nas rotas em que a Hoje não mostra o card grande. */
export function FaixaMovelDoCronometro() {
  const caminho = usePathname();
  if (caminho === "/") return null;
  return (
    <div className="fixed inset-x-3 bottom-[88px] z-30 lg:hidden">
      <CartaoDoCronometro variante="faixa" />
    </div>
  );
}

function Aba({ href, selecionada, icone: Icone, children }: { href: string; selecionada: boolean; icone: typeof RiHome5Line; children: ReactNode }) {
  return (
    <Link href={href} aria-current={selecionada ? "page" : undefined} className={cx("grid flex-1 justify-items-center gap-0.5 py-1 text-caption-1-medium", selecionada ? "text-accent-600" : "text-text-secondary")}>
      <Icone className="size-6" aria-hidden />
      {children}
    </Link>
  );
}

/** A barra de abas do celular: Hoje e Registros, o "+" central que registra estudo e Estatísticas. */
export function BarraDeAbas() {
  const caminho = usePathname();
  const { abrirRegistro, materias } = useCronometro();
  return (
    <nav aria-label="Principal (celular)" className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-separator-border bg-background-full px-6 pt-2 pb-[max(env(safe-area-inset-bottom),12px)] lg:hidden">
      <Aba href="/" selecionada={caminho === "/"} icone={RiHome5Line}>
        Hoje
      </Aba>
      <Aba href="/registros" selecionada={ativoEm(caminho, "/registros")} icone={RiFileListLine}>
        Registros
      </Aba>
      <button
        type="button"
        aria-label="Registrar estudo"
        disabled={materias.length === 0}
        onClick={() => abrirRegistro()}
        className="-mt-6 grid size-14 place-items-center rounded-2xl bg-button-primary text-text-white shadow-md outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring disabled:opacity-50"
      >
        <RiAddLine className="size-7" aria-hidden />
      </button>
      <Aba href="/estatisticas" selecionada={ativoEm(caminho, "/estatisticas")} icone={RiBarChartBoxLine}>
        Estatísticas
      </Aba>
    </nav>
  );
}
