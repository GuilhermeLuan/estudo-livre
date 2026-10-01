export function Marca() {
  return (
    <div className="flex items-center gap-2.5 text-[1.0625rem] font-bold tracking-[-0.02em]">
      <span className="grid size-7 place-items-center rounded-lg bg-accent">
        <svg width="16" height="16" viewBox="0 0 26 26" aria-hidden="true">
          <circle cx="13" cy="13" r="9" fill="none" stroke="var(--on-accent)" strokeWidth="4" strokeDasharray="40 100" transform="rotate(-90 13 13)" />
        </svg>
      </span>
      <span>
        Estudo <b className="font-bold text-accent-ink">Livre</b>
      </span>
    </div>
  );
}
