import { notFound } from "next/navigation";
import { novaEtapa, renomear } from "@/app/acoes-ciclos";
import { FormularioNome } from "@/app/formulario-ciclo";
import { ListaEtapas } from "@/app/lista-etapas";
import { tempo } from "@/app/formato";
import { NaoEncontradoError, obterCiclo } from "@/casos-de-uso";
import { obterDb } from "@/db";
import { exigirUsuario } from "@/sessao";

export const dynamic = "force-dynamic";

export default async function PaginaCiclo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ciclo = await obterCiclo(obterDb(), await exigirUsuario(), id).catch((erro) => {
    if (erro instanceof NaoEncontradoError) notFound();
    throw erro;
  });
  return (
    <section aria-labelledby="h-ciclo" className="grid max-w-[720px] gap-5">
      <div>
        <h1 id="h-ciclo">{ciclo.nome}</h1>
        <p className="text-[.875rem] text-ink-2">Cada ciclo tem as próprias matérias. Uma matéria pode ter várias etapas, cada uma com as suas horas. A ordem é só uma sugestão.</p>
      </div>

      <div className="panel grid gap-3">
        <h2>Nome do ciclo</h2>
        <FormularioNome acao={renomear.bind(null, id)} botao="Renomear ciclo" nome={ciclo.nome} rotuloNome="Nome do ciclo" />
      </div>

      <div className="panel grid gap-3">
        <div className="panel-head">
          <h2>Etapas</h2>
          <span className="text-[.8125rem] text-ink-2">Total de horas: {tempo(ciclo.etapas.reduce((soma, e) => soma + e.cargaMinutos, 0))}</span>
        </div>
        <ListaEtapas cicloId={id} etapas={ciclo.etapas} />
      </div>

      <div className="panel grid gap-3">
        <h2>Adicionar etapa</h2>
        <FormularioNome acao={novaEtapa.bind(null, id)} botao="Adicionar etapa" comCarga rotuloNome="Nome da matéria" />
      </div>
    </section>
  );
}
