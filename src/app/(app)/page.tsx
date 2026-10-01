import Link from "next/link";
import { obterHome } from "@/casos-de-uso";
import { PainelDoCiclo } from "@/app/painel-do-ciclo";
import { tempo } from "@/app/formato";
import { obterDb } from "@/db";
import { exigirUsuario } from "@/sessao";

export const dynamic = "force-dynamic";

function hojePorExtenso() {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
}

export default async function Hoje({ searchParams }: { searchParams: Promise<{ ciclo?: string }> }) {
  const { ciclo: cicloEscolhido } = await searchParams;
  const home = await obterHome(obterDb(), await exigirUsuario());
  const atual = home.ciclos.find((c) => c.id === cicloEscolhido) ?? home.ciclos[0];
  const outros = home.ciclos.filter((c) => c !== atual);
  const data = hojePorExtenso();
  return (
    <section aria-labelledby="h-hoje">
      <div className="mb-5">
        <h1 id="h-hoje">
          Seu ciclo de hoje{" "}
          <small className="ml-2 text-[.8125rem] font-normal tracking-normal text-ink-2">
            {data.charAt(0).toUpperCase() + data.slice(1)}
          </small>
        </h1>
      </div>
      {home.ciclos.length === 0 ? (
        <div className="panel grid justify-items-start gap-2">
          <h2>Nenhum ciclo ainda</h2>
          <p className="text-[.875rem] text-ink-2">
            Crie um ciclo para o seu concurso e adicione as matérias com a carga horária de cada uma.
          </p>
          <Link href="/ciclos/novo" className="btn btn-primary">
            Criar ciclo
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          <PainelDoCiclo key={atual.id} ciclo={atual} />
          <div>
            <div className="mb-3 flex items-baseline justify-between">
              <h2>Outros ciclos</h2>
              <Link href="/ciclos/novo" className="btn btn-quiet">
                Novo ciclo
              </Link>
            </div>
            {outros.length === 0 ? (
              <p className="text-[.875rem] text-ink-2">Você tem um ciclo só. Crie outro para estudar para dois concursos ao mesmo tempo.</p>
            ) : (
              <ul className="grid gap-2 md:grid-cols-2">
                {outros.map((c) => {
                  const carga = c.materias.reduce((a, m) => a + m.cargaMinutos, 0);
                  const feito = c.materias.reduce((a, m) => a + m.feitoMinutos, 0);
                  const pct = carga ? Math.round((feito / carga) * 100) : 0;
                  return (
                    <li key={c.id}>
                      <Link href={`/?ciclo=${c.id}`} className="panel grid grid-cols-[36px_1fr] items-center gap-x-3 gap-y-2.5 hover:border-accent">
                        <span className="grid size-9 place-items-center rounded-md bg-accent-soft text-[.75rem] font-bold text-accent-ink">
                          {c.nome.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="grid">
                          <span className="text-[.875rem] font-semibold">{c.nome}</span>
                          <span className="text-[.8125rem] text-ink-2">
                            Volta {c.volta}.{c.proxima ? ` Próxima: ${c.proxima.nome}` : " Sem matérias ainda."}
                          </span>
                        </span>
                        <span className="col-span-2 grid grid-cols-[1fr_auto] items-center gap-2.5 text-[.75rem] font-semibold">
                          <span className="bar">
                            <i style={{ width: `${pct}%` }} />
                          </span>
                          <span className="tabular-nums" title={`${tempo(feito)} de ${tempo(carga)}`}>
                            {pct}%
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
