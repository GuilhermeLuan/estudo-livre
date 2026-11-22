"use client";

import { RiArrowRightLine } from "@remixicon/react";
import type { ListaDeRevisoes } from "@/casos-de-uso";
import { Counter } from "@/components/base/badges/counter";
import { Button } from "@/components/base/buttons/button";
import { LinkButton } from "@/components/base/buttons/link-button";
import { useCronometro } from "./cronometro";
import { AvisoDaRevisao, ChipDeVencimento, FiltroDeRevisoes } from "./revisoes-comuns";

/** O cartão "Revisões de hoje" da Hoje: as vencidas mais atrasadas, com o filtro por Ciclo e "Registrar" em cada uma. */
export function CartaoDeRevisoes({ lista }: { lista: ListaDeRevisoes }) {
  const { abrirRegistro } = useCronometro();
  const { vencidas, totalVencidas, filtro, ciclos } = lista;
  return (
    <section aria-labelledby="h-revisoes-de-hoje" className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3 rounded-3xl bg-background-secondary-default p-4 lg:p-5">
      <header className="flex items-center justify-between gap-3">
        <div className="flex shrink-0 items-center gap-2">
          <h2 id="h-revisoes-de-hoje" className="text-title-3-medium text-text-primary">
            Revisões de hoje
          </h2>
          <Counter aria-label={`${totalVencidas} vencidas`}>{totalVencidas}</Counter>
        </div>
        <div className="min-w-0 overflow-x-auto">
          <FiltroDeRevisoes base="/" ciclos={ciclos} escolhido={filtro} />
        </div>
      </header>

      {vencidas.length === 0 ? (
        <p className="rounded-2xl bg-background-primary-default p-4 text-body-regular text-text-secondary">Nenhuma revisão vencida.</p>
      ) : (
        <ul className="grid gap-2">
          {vencidas.map((r) => (
            <li key={r.topicoId} className="flex items-center gap-3 rounded-2xl bg-background-primary-default p-3 shadow-xs">
              <div className="grid min-w-0 flex-1 gap-0.5">
                <span className="truncate text-body-medium text-text-primary">{r.topico}</span>
                <span className="truncate text-caption-1-regular text-text-secondary">
                  {r.materia} · {r.ciclo}
                </span>
              </div>
              <ChipDeVencimento diasDeAtraso={r.diasDeAtraso} dia={r.dia} />
              <Button variant="ghost" size="small" aria-label={`Registrar ${r.topico}`} onClick={() => abrirRegistro(r.materiaId, r.topicoId)}>
                Registrar
              </Button>
            </li>
          ))}
        </ul>
      )}

      {vencidas.length > 0 && (
        <LinkButton href={filtro ? `/revisoes?ciclo=${filtro}` : "/revisoes"} trailingIcon={RiArrowRightLine} className="justify-self-center">
          Ver todas as revisões
        </LinkButton>
      )}
      <AvisoDaRevisao />
    </section>
  );
}
