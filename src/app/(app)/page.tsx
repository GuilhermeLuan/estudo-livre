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
      {home.ciclos.length === 0 && (
        <div className="panel grid justify-items-start gap-1">
          <h2>Nenhum ciclo ainda</h2>
          <p className="text-[.875rem] text-ink-2">
            Crie um ciclo para o seu concurso e adicione as matérias com a carga horária de cada uma.
          </p>
        </div>
      )}
    </section>
  );
}
