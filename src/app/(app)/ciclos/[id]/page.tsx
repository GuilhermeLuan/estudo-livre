import Link from "next/link";
import { notFound } from "next/navigation";
import { AdicionarEtapa, RenomearCiclo } from "@/app/dialogos-do-ciclo";
import { descricaoDaVolta, quantidade, tempoHM } from "@/app/formato";
import { ListaEtapas } from "@/app/lista-etapas";
import { NaoEncontradoError, obterCiclo } from "@/casos-de-uso";
import { concluida } from "@/dominio";
import { ProgressTrack } from "@/components/base/progress/progress";
import { obterDb } from "@/db";
import { exigirUsuario } from "@/sessao";

export const dynamic = "force-dynamic";

export default async function PaginaCiclo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ciclo = await obterCiclo(obterDb(), await exigirUsuario(), id).catch((erro) => {
    if (erro instanceof NaoEncontradoError) notFound();
    throw erro;
  });
  const { etapas, materias, volta } = ciclo;
  const { percentual } = ciclo;
  const extraDaMateria = new Map(materias.map((m) => [m.id, m.extraMinutos]));
  const itens = etapas.map((e) => ({ id: e.id, nome: e.nome, cargaMinutos: e.cargaMinutos, feitoMinutos: e.feitoMinutos, extraMinutos: extraDaMateria.get(e.materiaId) ?? 0 }));

  return (
    <section aria-labelledby="h-ciclo" className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <p className="text-caption-1-regular text-text-secondary">
            <Link href="/" className="hover:underline">
              Ciclos
            </Link>{" "}
            › {ciclo.nome}
          </p>
          <div className="flex items-baseline gap-3">
            <h1 id="h-ciclo" className="text-title-1-medium text-text-primary">
              {ciclo.nome}
            </h1>
            <RenomearCiclo cicloId={id} nome={ciclo.nome} />
          </div>
          <p className="text-body-regular text-text-secondary">
            {quantidade(etapas.length, "etapa", "etapas")} · {quantidade(materias.length, "matéria", "matérias")} · {tempoHM(ciclo.cargaMinutos)} por volta
          </p>
        </div>
        <AdicionarEtapa cicloId={id} />
      </div>

      <div className="grid items-center gap-x-6 gap-y-3 rounded-3xl bg-background-secondary-default p-4 lg:grid-cols-[auto_1fr_auto_auto]">
        <div className="grid">
          <span className="text-title-3-medium text-text-primary">Volta {volta.numero}</span>
          <span className="text-caption-1-regular text-text-secondary">{descricaoDaVolta(volta.numero, volta.inicio)}</span>
        </div>
        <div className="grid gap-1.5">
          <span className="text-body-regular text-text-secondary">
            <b className="text-body-medium text-text-primary">{percentual}%</b> · {tempoHM(ciclo.feitoMinutos)} de {tempoHM(ciclo.cargaMinutos)}
          </span>
          <ProgressTrack percentage={percentual} />
        </div>
        <span className="text-body-regular text-text-secondary">Faltam {tempoHM(ciclo.cargaMinutos - ciclo.feitoMinutos)}</span>
        <div className="grid">
          <span className="text-caption-1-regular text-text-secondary">Horas extras</span>
          <span className="text-title-3-medium text-text-primary">{tempoHM(ciclo.extraMinutos)}</span>
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ListaEtapas cicloId={id} etapas={itens} proximaId={ciclo.proximaEtapaId ?? undefined} />
        {materias.length > 0 && (
          <aside aria-label="Matérias" className="grid gap-3 rounded-3xl bg-background-secondary-default p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-title-3-medium text-text-primary">Matérias</h2>
              <span className="text-caption-1-regular text-text-secondary">Tópicos estudados</span>
            </div>
            <ul className="grid gap-3">
              {materias.map((m) => (
                <li key={m.id} className="grid gap-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid min-w-0">
                      <Link href={`/ciclos/${id}/materias/${m.id}`} className="text-body-medium text-text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-border-focus-ring">
                        {m.nome}
                      </Link>
                      <span className="text-caption-1-regular text-text-secondary">
                        {quantidade(m.etapas, "etapa", "etapas")} · {tempoHM(m.cargaMinutos)}
                      </span>
                    </div>
                    <span className="text-body-regular text-text-secondary">{m.topicos.total ? `${m.topicos.estudados}/${m.topicos.total}` : "—"}</span>
                  </div>
                  {m.topicos.total > 0 && <ProgressTrack percentage={(m.topicos.estudados / m.topicos.total) * 100} size="sm" className={m.topicos.estudados === m.topicos.total ? "text-chart-2" : "text-accent-500"} />}
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </section>
  );
}
