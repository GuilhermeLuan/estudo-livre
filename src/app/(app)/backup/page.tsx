import { RiDownload2Line } from "@remixicon/react";
import { ImportarBackup } from "@/app/importar-backup";
import { ButtonLink } from "@/components/base/buttons/button";
import { obterHome } from "@/casos-de-uso";
import { obterDb } from "@/db";
import { exigirUsuario } from "@/sessao";

export const dynamic = "force-dynamic";

const CARTAO = "grid content-start gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-6";

/** Exportar e importar o backup em JSON (AD-029). Importar troca todos os Ciclos da conta (AD-028). */
export default async function PaginaDoBackup() {
  const { ciclos, arquivados } = await obterHome(obterDb(), await exigirUsuario());
  return (
    <section aria-labelledby="h-backup" className="grid gap-5">
      <h1 id="h-backup" className="text-title-1-medium text-text-primary">
        Backup
      </h1>
      <div className="grid gap-4 lg:grid-cols-2">
        <article aria-labelledby="h-exportar" className={CARTAO}>
          <div className="grid gap-1">
            <h2 id="h-exportar" className="text-title-3-semibold text-text-primary">
              Exportar
            </h2>
            <p className="text-body-regular text-text-secondary">Baixe um arquivo JSON com seus ciclos, registros e revisões.</p>
          </div>
          <ButtonLink href="/api/backup" download leadingIcon={RiDownload2Line} className="justify-self-start">
            Exportar backup
          </ButtonLink>
        </article>
        <article aria-labelledby="h-importar" className={CARTAO}>
          <div className="grid gap-1">
            <h2 id="h-importar" className="text-title-3-semibold text-text-primary">
              Importar
            </h2>
            <p className="text-body-regular text-text-secondary">Os ciclos do arquivo substituem todos os ciclos desta conta.</p>
          </div>
          <ImportarBackup totalDeCiclos={ciclos.length + arquivados.length} />
        </article>
      </div>
    </section>
  );
}
