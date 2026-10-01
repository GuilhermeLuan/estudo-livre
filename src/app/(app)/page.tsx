import Link from "next/link";
import { obterHome } from "@/casos-de-uso";
import { obterDb } from "@/db";
import { exigirUsuario } from "@/sessao";

export const dynamic = "force-dynamic";

function hojePorExtenso() {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
}

export default async function Hoje() {
  const home = await obterHome(obterDb(), await exigirUsuario());
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
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <h2>Ciclos</h2>
            <Link href="/ciclos/novo" className="btn">
              Novo ciclo
            </Link>
          </div>
          <ul className="grid gap-2 md:grid-cols-2">
            {home.ciclos.map((c) => (
              <li key={c.id}>
                <Link href={`/ciclos/${c.id}`} className="panel flex items-center gap-3 hover:border-ink-2">
                  <span className="grid size-9 shrink-0 place-items-center rounded-md bg-accent-soft text-[.8125rem] font-semibold text-accent-ink">
                    {c.nome.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="grid">
                    <span className="font-semibold">{c.nome}</span>
                    <span className="text-[.8125rem] text-ink-2">
                      {c.totalMaterias === 1 ? "1 matéria" : `${c.totalMaterias} matérias`}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
