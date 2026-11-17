"use client";

import { useEffect, useState } from "react";
import { SegmentedControl, SegmentedControlItem } from "@/components/base/segmented-control/segmented-control";

declare global {
  interface Window {
    aplicarTema?: () => void;
  }
}

/**
 * Roda no <head>, antes da primeira pintura: aplica a classe `dark` conforme a chave `tema` do aparelho
 * ("claro" ou "escuro") ou, sem ela, o sistema; acompanha mudanças do sistema e ajusta o theme-color do PWA.
 */
export const SCRIPT_DO_TEMA = `(function(){var d=document.documentElement,q=matchMedia("(prefers-color-scheme: dark)");function a(){var t=null;try{t=localStorage.getItem("tema")}catch(e){}var e=t?t==="escuro":q.matches;d.classList.toggle("dark",e);var m=document.querySelector('meta[name="theme-color"]');if(!m){m=document.createElement("meta");m.name="theme-color";document.head.appendChild(m)}m.content=e?"#121212":"#ebebe8"}window.aplicarTema=a;q.addEventListener("change",a);a()})()`;

type Escolha = "claro" | "escuro" | "sistema";

function lerEscolha(): Escolha {
  try {
    const guardado = localStorage.getItem("tema");
    return guardado === "claro" || guardado === "escuro" ? guardado : "sistema";
  } catch {
    return "sistema";
  }
}

/** Claro, Escuro ou Sistema: Sistema apaga a escolha guardada e volta a seguir o aparelho. */
export function SeletorDeTema() {
  const [escolha, setEscolha] = useState<Escolha>("sistema");
  useEffect(() => setEscolha(lerEscolha()), []);

  function escolher(nova: Escolha) {
    try {
      if (nova === "sistema") localStorage.removeItem("tema");
      else localStorage.setItem("tema", nova);
    } catch {}
    window.aplicarTema?.();
    setEscolha(nova);
  }

  return (
    <SegmentedControl aria-label="Tema" selectedKeys={[escolha]} onSelectionChange={(chaves) => escolher([...chaves][0] as Escolha)}>
      <SegmentedControlItem id="claro">Claro</SegmentedControlItem>
      <SegmentedControlItem id="escuro">Escuro</SegmentedControlItem>
      <SegmentedControlItem id="sistema">Sistema</SegmentedControlItem>
    </SegmentedControl>
  );
}
