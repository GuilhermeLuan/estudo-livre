import { notFound } from "next/navigation";
import { excluirMateria, moverMateria, novaMateria, renomear, salvarMateria } from "@/app/acoes-ciclos";
import { FormularioNome } from "@/app/formulario-ciclo";
import { NaoEncontradoError, obterCiclo } from "@/casos-de-uso";
import { obterDb } from "@/db";
import { exigirUsuario } from "@/sessao";

export const dynamic = "force-dynamic";

function horas(minutos: number) {
  return minutos / 60;
}

function rotuloCarga(minutos: number) {
  return `${horas(minutos).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} h`;
}

export default async function PaginaCiclo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ciclo = await obterCiclo(obterDb(), await exigirUsuario(), id).catch((erro) => {
    if (erro instanceof NaoEncontradoError) notFound();
    throw erro;
  });
  const ids = ciclo.materias.map((m) => m.id);
  const trocar = (de: number, para: number) => {
    const nova = [...ids];
    [nova[de], nova[para]] = [nova[para], nova[de]];
    return nova;
  };

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
        {ciclo.materias.length === 0 && (
          <p className="text-[.875rem] text-ink-2">Nenhuma matéria ainda. Adicione a primeira abaixo, com a carga horária de uma volta.</p>
        )}
        <ol className="grid gap-2">
          {ciclo.materias.map((m, i) => (
            <li key={m.id} className="rounded-md border border-line bg-surface-2 p-3">
              <details>
                <summary className="flex cursor-pointer items-center gap-3 text-[.875rem]">
                  <span className="flex-1 font-semibold">{m.nome}</span>
                  <span className="text-ink-2 tabular-nums">{rotuloCarga(m.cargaMinutos)}</span>
                  <span className="text-accent-ink">Editar</span>
                </summary>
                <div className="mt-3 grid gap-3">
                  <FormularioNome
                    acao={salvarMateria.bind(null, m.id)}
                    botao="Salvar matéria"
                    nome={m.nome}
                    horas={horas(m.cargaMinutos)}
                    comCarga
                    rotuloNome="Nome da matéria"
                  />
                </div>
              </details>
              <div className="mt-2 flex gap-2">
                <form action={moverMateria.bind(null, id, i > 0 ? trocar(i, i - 1) : ids)}>
                  <button type="submit" className="btn" disabled={i === 0} aria-label={`Mover ${m.nome} para cima`}>
                    Subir
                  </button>
                </form>
                <form action={moverMateria.bind(null, id, i < ids.length - 1 ? trocar(i, i + 1) : ids)}>
                  <button type="submit" className="btn" disabled={i === ids.length - 1} aria-label={`Mover ${m.nome} para baixo`}>
                    Descer
                  </button>
                </form>
                <form action={excluirMateria.bind(null, m.id)}>
                  <button type="submit" className="btn btn-quiet text-red" aria-label={`Remover ${m.nome}`}>
                    Remover
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="panel grid gap-3">
        <h2>Adicionar matéria</h2>
        <FormularioNome acao={novaMateria.bind(null, id)} botao="Adicionar matéria" comCarga rotuloNome="Nome da matéria" />
      </div>
    </section>
  );
}
