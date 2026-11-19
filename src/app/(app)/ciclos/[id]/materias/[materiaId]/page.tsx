import Link from "next/link";
import { notFound } from "next/navigation";
import { quantidade } from "@/app/formato";
import { ListaDeTopicos } from "@/app/lista-de-topicos";
import { NaoEncontradoError, obterCiclo, obterMateria } from "@/casos-de-uso";
import { ProgressTrack } from "@/components/base/progress/progress";
import { obterDb } from "@/db";
import { exigirUsuario } from "@/sessao";

export const dynamic = "force-dynamic";

export default async function PaginaDaMateria({ params }: { params: Promise<{ id: string; materiaId: string }> }) {
  const { id, materiaId } = await params;
  const usuario = await exigirUsuario();
  const [materia, { arquivado }] = await Promise.all([obterMateria(obterDb(), usuario, id, materiaId), obterCiclo(obterDb(), usuario, id)]).catch((erro) => {
    if (erro instanceof NaoEncontradoError) notFound();
    throw erro;
  });
  const percentual = materia.total ? (materia.estudados / materia.total) * 100 : 0;

  return (
    <section aria-labelledby="h-materia" className="grid gap-5">
      <div className="grid gap-1">
        <p className="text-caption-1-regular text-text-secondary">
          <Link href="/" className="hover:underline">
            Ciclos
          </Link>{" "}
          ›{" "}
          <Link href={`/ciclos/${id}`} className="hover:underline">
            {materia.ciclo.nome}
          </Link>{" "}
          › {materia.nome}
        </p>
        <h1 id="h-materia" className="text-title-1-medium text-text-primary">
          {materia.nome}
        </h1>
        {materia.total > 0 && (
          <div className="grid max-w-md gap-1.5">
            <p className="text-body-regular text-text-secondary">
              {materia.estudados} de {quantidade(materia.total, "tópico estudado", "tópicos estudados")}
            </p>
            <ProgressTrack percentage={percentual} size="sm" />
          </div>
        )}
      </div>
      <ListaDeTopicos materiaId={materia.id} topicos={materia.topicos} somenteLeitura={arquivado} />
    </section>
  );
}
