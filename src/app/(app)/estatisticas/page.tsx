import Link from "next/link";
import { notFound } from "next/navigation";
import { NaoEncontradoError, obterEstatisticas } from "@/casos-de-uso";
import { diaMes, quantidade, tempo } from "@/app/formato";
import { obterDb } from "@/db";
import { exigirUsuario } from "@/sessao";

export const dynamic = "force-dynamic";

/** Abaixo disso o acerto fica em vermelho, como a faixa "Errei" padrão de 60%. */
const ACERTO_BAIXO_PERCENTUAL = 60;
/** As barras semanais nunca esticam uma semana curta até a altura toda do gráfico. */
const ESCALA_MINIMA_MINUTOS = 60;

/** Matéria com valor e barra proporcional (`fracao` de 0 a 1). */
function LinhaDaMateria({ nome, ciclo, detalhe, valor, fracao, baixo }: { nome: string; ciclo?: string; detalhe?: string; valor: string; fracao: number; baixo?: boolean }) {
  return (
    <li className={baixo ? "low" : undefined}>
      <span>
        {nome}
        {ciclo && <small className="block text-[.75rem] text-ink-2">{ciclo}</small>}
        {detalhe && <small className="block text-[.75rem] text-ink-2">{detalhe}</small>}
      </span>
      <strong className="num">{valor}</strong>
      <span className="bar" aria-hidden="true">
        <i style={{ width: `${fracao * 100}%` }} />
      </span>
    </li>
  );
}

/** Meta de uma volta (soma das etapas) e, se houver, as horas extras da volta atual. */
function detalheDasHoras(metaMinutos: number, extraMinutos: number) {
  if (!metaMinutos) return undefined;
  return `meta ${tempo(metaMinutos)} por volta${extraMinutos ? `, +${tempo(extraMinutos)} extra nesta volta` : ""}`;
}

function Vazio({ children }: { children: React.ReactNode }) {
  return <p className="text-ink-2">{children}</p>;
}

export default async function Estatisticas({ searchParams }: { searchParams: Promise<{ ciclo?: string }> }) {
  const { ciclo: cicloId } = await searchParams;
  const dados = await obterEstatisticas(obterDb(), await exigirUsuario(), { cicloId }).catch((erro) => {
    if (erro instanceof NaoEncontradoError) notFound();
    throw erro;
  });
  const { ciclos, horasPorMateria, acertoPorMateria, horasPorSemana } = dados;
  const escolhido = ciclos.find((c) => c.id === cicloId);
  // Com um ciclo só (ou filtrado), o nome do ciclo ao lado de cada matéria seria ruído.
  const nomeDoCiclo = (ciclo: string) => (!escolhido && ciclos.length > 1 ? ciclo : undefined);
  const maiorSemana = Math.max(ESCALA_MINIMA_MINUTOS, ...horasPorSemana.map((s) => s.minutos));
  const maiorMateria = Math.max(1, ...horasPorMateria.map((m) => m.minutos));

  return (
    <section aria-labelledby="h-stats">
      <div className="mb-5">
        <h1 id="h-stats">Estatísticas</h1>
        <p className="text-[.875rem] text-ink-2">{escolhido ? escolhido.nome : "Todos os ciclos"}</p>
      </div>

      {ciclos.length > 0 && (
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
            <span className="text-[.8125rem] text-ink-2">média {tempo(dados.mediaSemanalMinutos)}, últimas {horasPorSemana.length} semanas</span>
          </div>
          <div className="week-bars" style={{ gridTemplateColumns: `repeat(${horasPorSemana.length}, 1fr)` }}>
            {horasPorSemana.map((s, i) => (
              <div key={s.inicio} className={i === horasPorSemana.length - 1 ? "now" : undefined}>
                <b className="num">{tempo(s.minutos)}</b>
                <i style={{ height: `${(s.minutos / maiorSemana) * 100}%` }} />
                <span>{i === horasPorSemana.length - 1 ? "esta" : diaMes(s.inicio)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Acerto por matéria</h2>
            <span className="text-[.8125rem] text-ink-2">
              {quantidade(dados.totalQuestoes, "questão", "questões")}, todas as voltas
            </span>
          </div>
          {acertoPorMateria.length === 0 ? (
            <Vazio>Registre estudos com questões e acertos para ver o desempenho de cada matéria.</Vazio>
          ) : (
            <ul className="acc-list">
              {acertoPorMateria.map((m) => (
                <LinhaDaMateria
                  key={m.id}
                  nome={m.nome}
                  ciclo={nomeDoCiclo(m.ciclo)}
                  valor={`${m.percentual}%`}
                  fracao={m.percentual / 100}
                  baixo={m.percentual < ACERTO_BAIXO_PERCENTUAL}
                />
              ))}
            </ul>
          )}
        </div>

        <div className="panel stats-largo">
          <div className="panel-head">
            <h2>Horas por matéria</h2>
            <span className="text-[.8125rem] text-ink-2">todas as voltas</span>
          </div>
          {horasPorMateria.length === 0 ? (
            <Vazio>Adicione matérias a um ciclo e registre seus estudos para ver onde o tempo está indo.</Vazio>
          ) : (
            <ul className="acc-list">
              {horasPorMateria.map((m) => (
                <LinhaDaMateria
                  key={m.id}
                  nome={m.nome}
                  ciclo={nomeDoCiclo(m.ciclo)}
                  detalhe={detalheDasHoras(m.metaMinutos, m.extraMinutos)}
                  valor={tempo(m.minutos)}
                  fracao={m.minutos / maiorMateria}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
