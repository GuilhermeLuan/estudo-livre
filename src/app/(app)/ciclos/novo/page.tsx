export const dynamic = "force-dynamic";

import { novoCiclo } from "@/app/acoes-ciclos";
import { FormularioNome } from "@/app/formulario-ciclo";

export default function NovoCiclo() {
  return (
    <section aria-labelledby="h-novo" className="grid max-w-[480px] gap-4">
      <h1 id="h-novo" className="text-title-1-medium text-text-primary">
        Novo ciclo
      </h1>
      <div className="rounded-3xl border border-separator-border bg-background-primary-default p-5 shadow-xs">
        <FormularioNome acao={novoCiclo} botao="Criar ciclo" rotuloNome="Nome do ciclo" />
      </div>
    </section>
  );
}
