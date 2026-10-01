"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

/** Toast global (design system): topo central, some sozinho e confirma a ação com o mesmo verbo do botão. */
export function Aviso({ texto, aoSumir }: { texto: string | null; aoSumir: () => void }) {
  useEffect(() => {
    if (!texto) return;
    const t = setTimeout(aoSumir, 5000);
    return () => clearTimeout(t);
  }, [texto, aoSumir]);

  if (!texto) return null;
  return createPortal(
    <div className="toast" role="status">
      {texto}
    </div>,
    document.body,
  );
}
