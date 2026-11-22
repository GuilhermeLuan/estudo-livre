"use client";

import { RiAddLine, RiPlayFill } from "@remixicon/react";
import type { ReactNode } from "react";
import type { ListaDeRevisoes, RevisaoDaLista } from "@/casos-de-uso";
import { Counter } from "@/components/base/badges/counter";
import { Button } from "@/components/base/buttons/button";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@/components/base/table/table";
import { useCronometro } from "./cronometro";
import { ChipDeNota, ChipDeVencimento } from "./revisoes-comuns";

const acertoDe = (r: RevisaoDaLista) => (r.acerto === null ? <span className="text-text-tertiary">—</span> : `${r.acerto}%`);

/** "Registrar" e, só nas vencidas, o ▶ que inicia o Cronômetro no Tópico (AD-030). */
function Acoes({ r, vencida }: { r: RevisaoDaLista; vencida: boolean }) {
  const { abrirRegistro, iniciar, pendente } = useCronometro();
  return (
    <div className="flex items-center justify-end gap-2">
      <Button variant={vencida ? "ghost" : "secondary"} leadingIcon={RiAddLine} aria-label={`Registrar ${r.topico}`} onClick={() => abrirRegistro(r.materiaId, r.topicoId)}>
        Registrar
      </Button>
      {vencida && (
        <Button variant="secondary" iconOnly leadingIcon={RiPlayFill} disabled={pendente} aria-label={`Iniciar cronômetro em ${r.topico}`} onClick={() => iniciar({ materiaId: r.materiaId, nome: r.materia, topicoId: r.topicoId })} />
      )}
    </div>
  );
}

function Secao({ titulo, total, children }: { titulo: string; total: number; children: ReactNode }) {
  return (
    <section aria-label={titulo} className="grid gap-2">
      <h2 className="flex items-center gap-2 text-body-regular text-text-secondary">
        {titulo}
        <Counter>{total}</Counter>
      </h2>
      {children}
    </section>
  );
}

function Cartoes({ itens, vencida }: { itens: RevisaoDaLista[]; vencida: boolean }) {
  return (
    <ul className="grid gap-2">
      {itens.map((r) => (
        <li key={r.topicoId} className="grid gap-2 rounded-2xl border border-border-button-default bg-background-primary-default p-3">
          <div className="flex items-start justify-between gap-2">
            <span className="grid min-w-0">
              <span className="truncate text-body-medium text-text-primary">{r.topico}</span>
              <span className="truncate text-caption-1-regular text-text-secondary">
                {r.materia} · {r.ciclo}
              </span>
            </span>
            <ChipDeVencimento diasDeAtraso={r.diasDeAtraso} dia={r.dia} />
          </div>
          <div className="flex items-center gap-2 text-body-regular text-text-secondary">
            <ChipDeNota nota={r.ultimaNota} />
            {acertoDe(r)}
          </div>
          <Acoes r={r} vencida={vencida} />
        </li>
      ))}
    </ul>
  );
}

/**
 * As Revisões da página: no computador (a partir de 1280px) a tabela do Figma, com as seções "Vencidas" e "Próximos 7
 * dias" como linhas de grupo; abaixo disso, uma lista de cartões por seção.
 */
export function TabelaDeRevisoes({ lista }: { lista: ListaDeRevisoes }) {
  const { vencidas, proximas, totalVencidas, totalProximas } = lista;
  const linha = (r: RevisaoDaLista, vencida: boolean) => (
    <TableRow key={r.topicoId}>
      <TableCell>
        <span className="block max-w-56 truncate text-text-primary">{r.topico}</span>
      </TableCell>
      <TableCell>
        <span className="text-text-primary">{r.materia}</span>
      </TableCell>
      <TableCell>{r.ciclo}</TableCell>
      <TableCell>
        <ChipDeVencimento diasDeAtraso={r.diasDeAtraso} dia={r.dia} />
      </TableCell>
      <TableCell>
        <ChipDeNota nota={r.ultimaNota} />
      </TableCell>
      <TableCell>{acertoDe(r)}</TableCell>
      <TableCell>
        <Acoes r={r} vencida={vencida} />
      </TableCell>
    </TableRow>
  );
  const grupo = (id: string, titulo: string, total: number) => (
    <TableRow key={id}>
      <TableCell colSpan={7}>
        <span className="flex items-center gap-2 text-body-regular text-text-secondary">
          {titulo}
          <Counter>{total}</Counter>
        </span>
      </TableCell>
    </TableRow>
  );

  return (
    <>
      <div className="hidden min-w-0 rounded-3xl border border-border-table bg-background-primary-default xl:block">
        <Table aria-label="Revisões" size="sm">
          <TableHeader>
            <TableColumn isRowHeader>Tópico</TableColumn>
            <TableColumn>Matéria</TableColumn>
            <TableColumn>Ciclo</TableColumn>
            <TableColumn>Vencimento</TableColumn>
            <TableColumn>Última nota</TableColumn>
            <TableColumn>Acerto</TableColumn>
            <TableColumn>
              <span className="sr-only">Ações</span>
            </TableColumn>
          </TableHeader>
          <TableBody>
            {[
              grupo("g-vencidas", "Vencidas", totalVencidas),
              ...(vencidas.length === 0
                ? [
                    <TableRow key="vazio">
                      <TableCell colSpan={7}>
                        <span className="text-text-secondary">Nenhuma revisão vencida.</span>
                      </TableCell>
                    </TableRow>,
                  ]
                : vencidas.map((r) => linha(r, true))),
              ...(proximas.length > 0 ? [grupo("g-proximas", "Próximos 7 dias", totalProximas), ...proximas.map((r) => linha(r, false))] : []),
            ]}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-4 xl:hidden">
        <Secao titulo="Vencidas" total={totalVencidas}>
          {vencidas.length === 0 ? (
            <p className="rounded-2xl border border-border-button-default bg-background-primary-default p-4 text-body-regular text-text-secondary">Nenhuma revisão vencida.</p>
          ) : (
            <Cartoes itens={vencidas} vencida />
          )}
        </Secao>
        {proximas.length > 0 && (
          <Secao titulo="Próximos 7 dias" total={totalProximas}>
            <Cartoes itens={proximas} vencida={false} />
          </Secao>
        )}
      </div>
    </>
  );
}
