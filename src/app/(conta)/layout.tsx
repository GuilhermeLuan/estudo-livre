import { Marca } from "@/app/marca";

export default function LayoutConta({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-[400px] content-center gap-6 px-4 py-10">
      <Marca />
      <div className="panel grid gap-4 p-[22px]">{children}</div>
    </main>
  );
}
