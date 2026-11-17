import { RiGraduationCapLine } from "@remixicon/react";

export function IconeDaMarca({ className }: { className?: string }) {
  return (
    <span className={`grid size-9 shrink-0 place-items-center rounded-xl bg-button-primary text-text-white shadow-xs ${className ?? ""}`}>
      <RiGraduationCapLine className="size-5" aria-hidden />
    </span>
  );
}

export function Marca() {
  return (
    <div className="flex items-center gap-2.5 text-headline-medium text-text-primary">
      <IconeDaMarca className="size-8 rounded-lg" />
      <span>Estudo Livre</span>
    </div>
  );
}
