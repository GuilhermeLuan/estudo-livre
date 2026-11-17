import { IconeDaMarca } from "@/app/marca";

export default function LayoutConta({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen content-center justify-items-center gap-4 bg-background-full px-4 py-10">
      <div className="grid w-full max-w-[420px] gap-5 rounded-3xl border border-separator-border bg-background-primary-default p-8 shadow-xs">
        <IconeDaMarca className="size-11" />
        {children}
      </div>
      <p className="text-caption-1-regular text-text-tertiary">Instância self-hosted · seus dados ficam no seu servidor</p>
    </main>
  );
}
