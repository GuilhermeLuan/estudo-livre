import { FiltrosDeRegistros } from "@/app/filtros-de-registros";
import { ListaDeRegistros } from "@/app/lista-de-registros";
import { LIMITE_DA_LISTA, listarRegistros, obterHome } from "@/casos-de-uso";
import { obterDb } from "@/db";
import { exigirUsuario } from "@/sessao";

export const dynamic = "force-dynamic";

const um = (v: string | string[] | undefined) => (typeof v === "string" && v ? v : undefined);

export default async function Registros({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  const usuario = await exigirUsuario();
  const ciclo = um(q.ciclo);
  const materia = um(q.materia);
  const limite = Math.max(LIMITE_DA_LISTA, Number.parseInt(um(q.limite) ?? "", 10) || LIMITE_DA_LISTA);
  const [{ ciclos }, lista] = await Promise.all([obterHome(obterDb(), usuario), listarRegistros(obterDb(), usuario, { cicloId: ciclo, materiaId: materia, limite })]);
  const filtrado = !!(ciclo || materia);

  return (
    <section aria-labelledby="h-registros" className="grid gap-5">
      <h1 id="h-registros" className="text-title-1-medium text-text-primary">
        Registros
      </h1>
      <FiltrosDeRegistros ciclos={ciclos.map((c) => ({ id: c.id, nome: c.nome, materias: c.materias.map((m) => ({ id: m.id, nome: m.nome })) }))} ciclo={ciclo} materia={materia} />
      {lista.total === 0 ? (
        <p className="rounded-3xl border border-border-button-default bg-background-primary-default p-6 text-body-regular text-text-secondary">{filtrado ? "Nenhum registro com este filtro." : "Nenhum registro de estudo ainda."}</p>
      ) : (
        <ListaDeRegistros registros={lista.registros} total={lista.total} temMais={lista.temMais} limite={limite} ciclo={ciclo} materia={materia} />
      )}
    </section>
  );
}
