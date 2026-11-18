import { RiArchiveLine } from "@remixicon/react";
import Link from "next/link";
import { ReativarCiclo } from "@/app/arquivar-ciclo";
import { quantidade } from "@/app/formato";
import { Chip } from "@/components/base/badges/chip";
import { obterHome } from "@/casos-de-uso";
import { obterDb } from "@/db";
import { exigirUsuario } from "@/sessao";

export const dynamic = "force-dynamic";

/** Os Ciclos arquivados (AD-026): do arquivado mais recentemente ao mais antigo, cada um com "Reativar". */
export default async function PaginaDosArquivados() {
  const { arquivados } = await obterHome(obterDb(), await exigirUsuario());
  return (
    <section aria-labelledby="h-arquivados" className="grid gap-5">
      <div className="grid gap-1">
        <h1 id="h-arquivados" className="text-title-1-medium text-text-primary">
          Arquivados
        </h1>
        <p className="text-body-regular text-text-secondary">Ciclos fora de uso. O histórico fica guardado até você reativar.</p>
      </div>
      {arquivados.length === 0 ? (
        <p className="rounded-3xl border border-border-button-default bg-background-primary-default p-6 text-body-regular text-text-secondary">Nenhum ciclo arquivado.</p>
      ) : (
        <ul className="grid gap-3">
          {arquivados.map((c) => (
            <li key={c.id}>
              <article aria-label={c.nome} className="flex flex-wrap items-center gap-3 rounded-3xl bg-background-secondary-default p-4">
                <RiArchiveLine className="size-5 shrink-0 text-foreground-icon-secondary" aria-hidden />
                <div className="grid min-w-0 flex-1 gap-0.5">
                  <Link href={`/ciclos/${c.id}`} className="truncate text-title-3-medium text-text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-border-focus-ring">
                    {c.nome}
                  </Link>
                  <span className="text-caption-1-regular text-text-secondary">{quantidade(c.totalEtapas, "etapa", "etapas")}</span>
                </div>
                <Chip variant="caption" color="neutral">
                  Volta {c.volta}
                </Chip>
                <ReativarCiclo cicloId={c.id} />
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
