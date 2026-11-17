import { RiCalendarLine, RiCheckboxCircleFill, RiClipboardLine, RiTimeLine } from "@remixicon/react";
import { notFound } from "next/navigation";
import { BotaoRegistrarEstudo } from "@/app/acoes-da-hoje";
import { CartaoDeIndicador } from "@/app/cartao-de-indicador";
import { FiltroDeCiclo } from "@/app/filtro-de-ciclo";
import { diaMes, quantidade, rotuloDaVariacao, tempo } from "@/app/formato";
import { NaoEncontradoError, obterEstatisticas } from "@/casos-de-uso";
import { Chip } from "@/components/base/badges/chip";
import { ProgressTrack } from "@/components/base/progress/progress";
import { obterDb } from "@/db";
import { exigirUsuario } from "@/sessao";

export const dynamic = "force-dynamic";

/** As barras semanais nunca esticam uma semana curta até a altura toda do gráfico. */
const ESCALA_MINIMA_MINUTOS = 60;
const CORES_DAS_MATERIAS = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5", "bg-chart-6", "bg-chart-7", "bg-chart-8", "bg-chart-9"];

/** As faixas de acerto padrão: abaixo de 60% errei, até 75% difícil, até 90% bom, a partir daí fácil. */
const corDoAcerto = (percentual: number) => (percentual >= 90 ? "text-chart-2" : percentual >= 75 ? "text-accent-500" : percentual >= 60 ? "text-chart-8" : "text-chart-3");

const horasDecimais = (minutos: number) => `${(minutos / 60).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}h`;

function Cartao({ titulo, detalhe, className, children }: { titulo: string; detalhe?: string; className?: string; children: React.ReactNode }) {
  return (
    <section aria-label={titulo} className={`grid content-start gap-3 rounded-3xl bg-background-secondary-default p-4 ${className ?? ""}`}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-title-3-medium text-text-primary">{titulo}</h2>
        {detalhe && <span className="text-caption-1-regular text-text-secondary">{detalhe}</span>}
      </div>
      <div className="rounded-2xl bg-background-primary-default p-4 shadow-xs">{children}</div>
    </section>
  );
}

export default async function Estatisticas({ searchParams }: { searchParams: Promise<{ ciclo?: string }> }) {
  const { ciclo: cicloId } = await searchParams;
  const dados = await obterEstatisticas(obterDb(), await exigirUsuario(), { cicloId }).catch((erro) => {
    if (erro instanceof NaoEncontradoError) notFound();
    throw erro;
  });
  const { ciclos, horasPorMateria, acertoPorMateria, horasPorSemana, variacaoSemanal } = dados;
  const escolhido = ciclos.find((c) => c.id === cicloId);
  // Com um ciclo só (ou filtrado), o nome do ciclo ao lado de cada matéria seria ruído.
  const nomeDoCiclo = (ciclo: string) => (!escolhido && ciclos.length > 1 ? ` · ${ciclo}` : "");
  const totalMinutos = horasPorMateria.reduce((soma, m) => soma + m.minutos, 0);
  const acertos = acertoPorMateria.reduce((soma, m) => soma + m.acertos, 0);
  const semanaAtual = horasPorSemana[horasPorSemana.length - 1];
  const maiorSemana = Math.max(ESCALA_MINIMA_MINUTOS, ...horasPorSemana.map((s) => s.minutos));
  const comEstudo = horasPorMateria.filter((m) => m.minutos > 0);

  return (
    <section aria-labelledby="h-stats" className="grid gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 id="h-stats" className="text-title-1-medium text-text-primary max-lg:sr-only">
            Estatísticas
          </h1>
          <p className="text-body-regular text-text-secondary">Horas e acerto dos seus registros de estudo</p>
        </div>
        {ciclos.length > 0 && <FiltroDeCiclo ciclos={ciclos} escolhido={escolhido?.id} />}
      </div>

      {totalMinutos === 0 ? (
        <div className="grid justify-items-start gap-3 rounded-3xl bg-background-secondary-default p-6">
          <h2 className="text-title-3-medium text-text-primary">Nenhum estudo registrado</h2>
          <p className="text-body-regular text-text-secondary">Registre um estudo para ver as horas por semana, o acerto e onde o tempo está indo.</p>
          <BotaoRegistrarEstudo />
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-4">
            <CartaoDeIndicador icone={RiTimeLine} rotulo="Horas estudadas" valor={tempo(totalMinutos)} />
            <CartaoDeIndicador
              icone={RiCalendarLine}
              rotulo="Nesta semana"
             
              valor={tempo(semanaAtual.minutos)}
              chip={variacaoSemanal === null ? null : { texto: rotuloDaVariacao(variacaoSemanal), cor: variacaoSemanal >= 0 ? "lime" : "rose" }}
            />
            <CartaoDeIndicador icone={RiCheckboxCircleFill} rotulo="Acerto geral" valor={dados.totalQuestoes ? `${Math.round((acertos * 100) / dados.totalQuestoes)}%` : "—"} />
            <CartaoDeIndicador icone={RiClipboardLine} rotulo="Questões" valor={dados.totalQuestoes.toLocaleString("pt-BR")} />
          </div>

          <div className="grid items-start gap-4 lg:grid-cols-[3fr_2fr]">
            <Cartao titulo="Horas por semana" detalhe={`Últimas ${horasPorSemana.length} semanas`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-title-1-medium text-text-primary">{tempo(semanaAtual.minutos)}</span>
                {variacaoSemanal !== null && (
                  <Chip variant="caption" color={variacaoSemanal >= 0 ? "lime" : "rose"}>
                    {rotuloDaVariacao(variacaoSemanal)} vs. semana anterior
                  </Chip>
                )}
              </div>
              <ol className="mt-4 grid h-52 items-end gap-2" style={{ gridTemplateColumns: `repeat(${horasPorSemana.length}, minmax(0, 1fr))` }}>
                {horasPorSemana.map((s, i) => {
                  const atual = i === horasPorSemana.length - 1;
                  return (
                    <li key={s.inicio} className="flex h-full flex-col items-center justify-end gap-1">
                      <span className="text-caption-2-regular text-text-secondary">{horasDecimais(s.minutos)}</span>
                      <span className={`w-full rounded-lg ${atual ? "bg-button-primary" : "bg-accent-200"}`} style={{ height: `${Math.max(2, (s.minutos / maiorSemana) * 78)}%` }} />
                      <span className="text-caption-2-regular text-text-secondary">{diaMes(s.inicio)}</span>
                    </li>
                  );
                })}
              </ol>
            </Cartao>

            <Cartao titulo="Acerto por matéria" detalhe="Questões">
              {acertoPorMateria.length === 0 ? (
                <p className="text-body-regular text-text-secondary">Registre estudos com questões e acertos para ver o desempenho de cada matéria.</p>
              ) : (
                <ul className="grid gap-3">
                  {acertoPorMateria.map((m) => (
                    <li key={m.id} className="grid gap-1">
                      <div className="flex items-baseline justify-between gap-3 text-body-regular">
                        <span className="min-w-0 truncate text-body-medium text-text-primary">
                          {m.nome}
                          {nomeDoCiclo(m.ciclo)}
                        </span>
                        <span className="shrink-0 text-text-secondary">
                          {quantidade(m.questoes, "questão", "questões")} <b className="ms-1 text-body-semibold text-text-primary">{m.percentual}%</b>
                        </span>
                      </div>
                      <ProgressTrack percentage={m.percentual} size="sm" className={corDoAcerto(m.percentual)} />
                    </li>
                  ))}
                </ul>
              )}
            </Cartao>
          </div>

          <Cartao titulo="Horas por matéria" detalhe={`${tempo(totalMinutos)} no total`}>
            <div className="flex h-3 gap-1 overflow-hidden rounded-full" role="img" aria-label="Divisão das horas por matéria">
              {comEstudo.map((m, i) => (
                <span key={m.id} className={`${CORES_DAS_MATERIAS[i % CORES_DAS_MATERIAS.length]} rounded-full`} style={{ flexGrow: m.minutos, flexBasis: 0 }} />
              ))}
            </div>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
              {horasPorMateria.map((m, i) => (
                <li key={m.id} className="flex items-center gap-2 text-body-regular text-text-secondary">
                  <span className={`size-2 rounded-full ${CORES_DAS_MATERIAS[comEstudo.findIndex((c) => c.id === m.id) % CORES_DAS_MATERIAS.length] ?? "bg-background-tertiary-default"}`} aria-hidden />
                  {m.nome}
                  {nomeDoCiclo(m.ciclo)} <b className="text-body-medium text-text-primary">{tempo(m.minutos)}</b>
                </li>
              ))}
            </ul>
          </Cartao>
        </>
      )}
    </section>
  );
}
