"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/** Aviso passageiro no topo: some sozinho e confirma a ação com o mesmo verbo do botão. */
export function Aviso({ texto, aoSumir }: { texto: string | null; aoSumir: () => void }) {
  // O callback vive num ref: re-renders do pai não reiniciam a contagem dos 5s.
  const sumir = useRef(aoSumir);
  useEffect(() => {
    sumir.current = aoSumir;
  });

  useEffect(() => {
    if (!texto) return;
    const t = setTimeout(() => sumir.current(), 5000);
    return () => clearTimeout(t);
  }, [texto]);

  if (!texto) return null;
  return createPortal(
    <div
      role="status"
      className="fixed top-4 left-1/2 z-110 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl border border-separator-border bg-background-primary-default px-4 py-2.5 text-body-medium text-text-primary shadow-md"
    >
      {texto}
    </div>,
    document.body,
  );
}
