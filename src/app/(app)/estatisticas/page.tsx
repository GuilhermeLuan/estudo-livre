import Link from "next/link";
import { notFound } from "next/navigation";
import { NaoEncontradoError, obterEstatisticas } from "@/casos-de-uso";
import { quantidade, tempo } from "@/app/formato";
import { obterDb } from "@/db";
import { exigirUsuario } from "@/sessao";

export const dynamic = "force-dynamic";

/** Abaixo disso o acerto fica em vermelho, como a faixa "Errei" padrão do ciclo. */
const ACERTO_BAIXO = 60;

const diaMes = (inicio: string) => `${Number(inicio.slice(8))}/${Number(inicio.slice(5, 7))}`;

export default async function Estatisticas({ searchParams }: { searchParams: Promise<{ ciclo?: string }> }) {
  const { ciclo: cicloId } = await searchParams;
  const dados = await obterEstatisticas(obterDb(), await exigirUsuario(), { cicloId }).catch((erro) => {
    if (erro instanceof NaoEncontradoError) notFound();
    throw erro;
  });
  const { ciclos, horasPorMateria, acertoPorMateria, horasPorSemana } = dados;
  const escolhido = ciclos.find((c) => c.id === cicloId);
  const mostrarCiclo = !escolhido && ciclos.length > 1;
  const alturaMaxima = Math.max(60, ...horasPorSemana.map((s) => s.minutos));
  const maisHoras = Math.max(1, ...horasPorMateria.map((m) => m.minutos));

  return (
    <section aria-labelledby="h-stats">
      <div className="mb-5">
        <h1 id="h-stats">Estatísticas</h1>
        <p className="text-[.875rem] text-ink-2">{escolhido ? escolhido.nome : "Todos os ciclos"}</p>
      </div>

      {ciclos.length > 1 && (
        <div className="chips mb-5" role="group" aria-label="Filtrar por ciclo">
          <Link href="/estatisticas" className="chip" aria-current={escolhido ? undefined : "true"}>
            Todos
          </Link>
          {ciclos.map((c) => (
            <Link key={c.id} href={`/estatisticas?ciclo=${c.id}`} className="chip" aria-current={c.id === escolhido?.id ? "true" : undefined}>
              {c.nome}
            </Link>
          ))}
        </div>
      )}

      <div className="stats-grid">
        <div className="panel">
          <div className="panel-head">
            <h2>Horas por semana</h2>
            <span className="text-[.8125rem] text-ink-2">média {tempo(dados.mediaSemanalMinutos)}, últimas 8 semanas</span>
          </div>
          <div className="week-bars">
            {horasPorSemana.map((s, i) => (
              <div key={s.inicio} className={i === horasPorSemana.length - 1 ? "now" : undefined}>
                <b className="num">{tempo(s.minutos)}</b>
                <i style={{ height: `${(s.minutos / alturaMaxima) * 100}%` }} />
                <span>{i === horasPorSemana.length - 1 ? "esta" : diaMes(s.inicio)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Acerto por matéria</h2>
            <span className="text-[.8125rem] text-ink-2">{quantidade(dados.totalQuestoes, "questão", "questões")}</span>
          </div>
          {acertoPorMateria.length === 0 ? (
            <p className="text-[.875rem] text-ink-2">Registre estudos com questões e acertos para ver o desempenho de cada matéria.</p>
          ) : (
            <ul className="acc-list">
              {acertoPorMateria.map((m) => (
                <li key={m.id} className={m.percentual < ACERTO_BAIXO ? "low" : undefined}>
                  <span>{m.nome}{mostrarCiclo && <small className="ml-2 text-ink-2">{m.ciclo}</small>}</span>
                  <strong className="num">{m.percentual}%</strong>
                  <span className="bar" role="presentation">
                    <i style={{ width: `${m.percentual}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel largo">
          <div className="panel-head">
            <h2>Horas por matéria</h2>
            <span className="text-[.8125rem] text-ink-2">todas as voltas</span>
          </div>
          {horasPorMateria.length === 0 ? (
            <p className="text-[.875rem] text-ink-2">Adicione matérias a um ciclo e registre seus estudos para ver onde o tempo está indo.</p>
          ) : (
            <ul className="acc-list">
              {horasPorMateria.map((m) => (
                <li key={m.id}>
                  <span>{m.nome}{mostrarCiclo && <small className="ml-2 text-ink-2">{m.ciclo}</small>}</span>
                  <strong className="num">{tempo(m.minutos)}</strong>
                  <span className="bar" role="presentation">
                    <i style={{ width: `${(m.minutos / maisHoras) * 100}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
