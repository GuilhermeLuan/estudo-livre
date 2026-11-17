"use client";

import { RiAddLine, RiArrowRightLine, RiFlag2Line, RiPlayFill } from "@remixicon/react";
import type { CicloDaHome } from "@/casos-de-uso";
import { Chip } from "@/components/base/badges/chip";
import { Button } from "@/components/base/buttons/button";
import { IconLinkButton } from "@/components/base/buttons/icon-button";
import { ProgressTrack } from "@/components/base/progress/progress";
import { useCronometro } from "./cronometro";
import { tempoHM } from "./formato";

/** O Ciclo na Hoje: progresso da Volta e a Próxima etapa, com "Registrar" e "Iniciar". */
export function CartaoDoCiclo({ ciclo }: { ciclo: CicloDaHome }) {
  const { abrirRegistro, iniciar, pendente } = useCronometro();
  const { proxima } = ciclo;
  const carga = ciclo.etapas.reduce((soma, e) => soma + e.cargaMinutos, 0);
  const feito = carga - ciclo.faltaMinutos;
  const extra = proxima ? (ciclo.materias.find((m) => m.id === proxima.materiaId)?.extraMinutos ?? 0) : 0;
  const posicao = proxima ? ciclo.etapas.findIndex((e) => e.id === proxima.id) + 1 : 0;

  return (
    <article aria-label={ciclo.nome} className="grid gap-3 rounded-3xl bg-background-secondary-default p-3 lg:p-4">
      <header className="flex items-center gap-2">
        <RiFlag2Line className="size-5 shrink-0 text-foreground-icon-secondary" aria-hidden />
        <h3 className="min-w-0 truncate text-body-medium text-text-secondary lg:text-title-3-medium lg:text-text-primary">{ciclo.nome}</h3>
        <Chip variant="caption" color="neutral" className="max-lg:hidden">
          Volta {ciclo.volta}
        </Chip>
        <span className="ms-auto text-body-regular text-text-secondary lg:hidden">
          Volta {ciclo.volta} · {ciclo.percentual}%
        </span>
        <IconLinkButton href={`/ciclos/${ciclo.id}`} icon={RiArrowRightLine} aria-label={`Abrir ${ciclo.nome}`} className="ms-auto max-lg:hidden" />
      </header>

      <div className="grid gap-1.5">
        <div className="flex items-baseline justify-between text-body-regular text-text-secondary max-lg:hidden">
          <span>Progresso da volta</span>
          <span>
            <b className="text-body-medium text-text-primary">{ciclo.percentual}%</b> · {tempoHM(feito)} de {tempoHM(carga)}
          </span>
        </div>
        <ProgressTrack percentage={ciclo.percentual} size="md" />
      </div>

      {proxima ? (
        <div className="flex items-center gap-3 rounded-2xl bg-background-primary-default p-3 shadow-xs lg:p-4">
          <div className="grid min-w-0 flex-1 gap-1">
            <span className="text-caption-1-regular text-text-secondary max-lg:hidden">Próxima etapa</span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-body-semibold text-text-primary lg:text-headline-medium">
                {posicao} · {proxima.nome}
              </span>
              {extra > 0 && (
                <Chip variant="caption" color="purple">
                  +{tempoHM(extra)} extra
                </Chip>
              )}
            </div>
            <div className="flex items-center gap-3 text-caption-1-regular text-text-secondary">
              <ProgressTrack percentage={(proxima.feitoMinutos / proxima.cargaMinutos) * 100} size="sm" className="w-[140px] max-lg:w-24" />
              <span>
                {tempoHM(proxima.feitoMinutos)} de {tempoHM(proxima.cargaMinutos)}
              </span>
            </div>
          </div>
          <Button variant="secondary" leadingIcon={RiAddLine} className="max-lg:hidden" onClick={() => abrirRegistro(proxima.materiaId)}>
            Registrar
          </Button>
          <Button leadingIcon={RiPlayFill} disabled={pendente} aria-label={`Iniciar ${proxima.nome}`} onClick={() => iniciar(proxima)}>
            <span className="max-lg:hidden">Iniciar</span>
          </Button>
        </div>
      ) : (
        <p className="rounded-2xl bg-background-primary-default p-3 text-body-regular text-text-secondary">
          Adicione etapas com carga horária para acompanhar a volta deste ciclo.
        </p>
      )}
    </article>
  );
}
