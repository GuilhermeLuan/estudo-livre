import { AvisoDaRevisao, FiltroDeRevisoes } from "@/app/revisoes-comuns";
import { TabelaDeRevisoes } from "@/app/tabela-de-revisoes";
import { listarRevisoes } from "@/casos-de-uso";
import { obterDb } from "@/db";
import { exigirUsuario } from "@/sessao";

export const dynamic = "force-dynamic";

const um = (v: string | string[] | undefined) => (typeof v === "string" && v ? v : undefined);

export default async function Revisoes({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  const lista = await listarRevisoes(obterDb(), await exigirUsuario(), { cicloId: um(q.ciclo) });
  return (
    <section aria-labelledby="h-revisoes" className="grid grid-cols-[minmax(0,1fr)] gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 id="h-revisoes" className="text-title-1-medium text-text-primary max-lg:sr-only">
            Revisões
          </h1>
          <p className="text-body-regular text-text-secondary">
            {lista.totalVencidas} vencidas · {lista.totalProximas} nos próximos 7 dias
          </p>
        </div>
        {lista.ciclos.length > 0 && <FiltroDeRevisoes base="/revisoes" ciclos={lista.ciclos} escolhido={lista.filtro} rotuloTodos="Todos os ciclos" />}
      </div>
      <TabelaDeRevisoes lista={lista} />
      <AvisoDaRevisao />
    </section>
  );
}
