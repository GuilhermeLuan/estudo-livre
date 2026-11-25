export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { gerarCiclo } from "@/app/acoes-ciclos";
import { SugestaoDeCiclo } from "@/app/sugestao-de-ciclo";
import { NaoEncontradoError, obterSugestaoDoCiclo } from "@/casos-de-uso";
import { obterDb } from "@/db";
import { exigirUsuario } from "@/sessao";

/** A tela da Sugestão de ciclo, preenchida com o Ciclo, para gerar de novo as Etapas (AD-039 a AD-043). */
export default async function EditarCiclo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuario = await exigirUsuario();
  const ciclo = await obterSugestaoDoCiclo(obterDb(), usuario, id).catch((erro) => {
    if (erro instanceof NaoEncontradoError) notFound();
    throw erro;
  });

  return (
    <section aria-labelledby="h-editar" className="grid max-w-[720px] grid-cols-[minmax(0,1fr)] gap-4">
      <h1 id="h-editar" className="text-title-1-medium text-text-primary">
        Editar ciclo
      </h1>
      {ciclo.arquivado ? (
        <p role="alert" className="text-body-regular text-text-error-primary">
          Ciclo arquivado. Reative para alterar.
        </p>
      ) : (
        <SugestaoDeCiclo
          acao={gerarCiclo.bind(null, id)}
          edicao
          inicial={{
            nome: ciclo.nome,
            horas: String(Number((ciclo.duracaoEtapaMinutos / 60).toFixed(2))).replace(".", ","),
            materias: ciclo.materias.map((m) => ({ nome: m.nome, questoes: m.questoesDaProva === null ? "" : String(m.questoesDaProva), dificuldade: m.dificuldade ?? "media" })),
          }}
        />
      )}
    </section>
  );
}
