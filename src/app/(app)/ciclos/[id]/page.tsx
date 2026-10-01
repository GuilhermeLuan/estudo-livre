import { notFound } from "next/navigation";
import { novaMateria, renomear } from "@/app/acoes-ciclos";
import { FormularioNome } from "@/app/formulario-ciclo";
import { ListaMaterias } from "@/app/lista-materias";
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
        <p className="text-[.875rem] text-ink-2">Cada ciclo tem as próprias matérias. A ordem é só uma sugestão.</p>
      </div>

      <div className="panel grid gap-3">
        <h2>Nome do ciclo</h2>
        <FormularioNome acao={renomear.bind(null, id)} botao="Renomear ciclo" nome={ciclo.nome} rotuloNome="Nome do ciclo" />
      </div>

      <div className="panel grid gap-3">
        <h2>Matérias</h2>
        <ListaMaterias cicloId={id} materias={ciclo.materias} />
      </div>

      <div className="panel grid gap-3">
        <h2>Adicionar matéria</h2>
        <FormularioNome acao={novaMateria.bind(null, id)} botao="Adicionar matéria" comCarga rotuloNome="Nome da matéria" />
      </div>
    </section>
  );
}
