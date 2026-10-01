"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/** Toast global (design system): topo central, some sozinho e confirma a ação com o mesmo verbo do botão. */
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
    <div className="toast" role="status">
      {texto}
    </div>,
    document.body,
  );
}
