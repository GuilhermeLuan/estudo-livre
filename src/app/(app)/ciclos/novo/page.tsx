export const dynamic = "force-dynamic";

import { novoCiclo } from "@/app/acoes-ciclos";
import { SugestaoDeCiclo } from "@/app/sugestao-de-ciclo";

export default function NovoCiclo() {
  return (
    <section aria-labelledby="h-novo" className="grid max-w-[720px] grid-cols-[minmax(0,1fr)] gap-4">
      <h1 id="h-novo" className="text-title-1-medium text-text-primary">
        Novo ciclo
      </h1>
      <SugestaoDeCiclo acao={novoCiclo} />
    </section>
  );
}
