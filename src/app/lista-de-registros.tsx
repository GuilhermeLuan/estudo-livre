"use client";

import { RiDeleteBinLine, RiEditLine } from "@remixicon/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { RegistroDoHistorico } from "@/casos-de-uso";
import { Button } from "@/components/base/buttons/button";
import { LinkButton } from "@/components/base/buttons/link-button";
import { Chip } from "@/components/base/badges/chip";
import { AlertDialog } from "@/components/base/modal/modal";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@/components/base/table/table";
import { percentualDeAcerto } from "@/dominio";
import { excluir } from "./acoes-registros";
import { Aviso } from "./aviso";
import { useCronometro } from "./cronometro";
import { enderecoDosRegistros } from "./filtros-de-registros";
import { RegistroDeEstudo } from "./formulario-de-registro";
import { tempo } from "./formato";

const dataBR = (dia: string) => dia.split("-").reverse().join("/");

function questoesDe(r: RegistroDoHistorico) {
  if (r.questoes === null) return "—";
  const acerto = percentualDeAcerto(r.acertos, r.questoes);
  return r.acertos === null ? `${r.questoes}` : `${r.acertos}/${r.questoes}${acerto === null ? "" : ` · ${acerto}%`}`;
}

const conteudoDe = (r: RegistroDoHistorico) => r.topico ?? r.conteudoLivre ?? "—";

/** O histórico: tabela a partir de 768px, cartões abaixo; "Editar" abre o modal de registro, "Excluir" confirma. */
export function ListaDeRegistros({ registros, total, temMais, limite, ciclo, materia }: { registros: RegistroDoHistorico[]; total: number; temMais: boolean; limite: number; ciclo?: string; materia?: string }) {
  const router = useRouter();
  const { materias } = useCronometro();
  const [editando, setEditando] = useState<{ registro: RegistroDoHistorico; abertura: number } | null>(null);
  const [aberto, setAberto] = useState(false);
  const [excluindo, setExcluindo] = useState<RegistroDoHistorico | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const acoes = (r: RegistroDoHistorico) => (
    <div className="flex items-center gap-1">
      <LinkButton size="small" leadingIcon={RiEditLine} onClick={() => { setEditando((e) => ({ registro: r, abertura: (e?.abertura ?? 0) + 1 })); setAberto(true); }} aria-label={`Editar registro de ${r.materia} em ${dataBR(r.dia)}`}>
        Editar
      </LinkButton>
      <LinkButton size="small" variant="secondary" leadingIcon={RiDeleteBinLine} onClick={() => setExcluindo(r)} aria-label={`Excluir registro de ${r.materia} em ${dataBR(r.dia)}`}>
        Excluir
      </LinkButton>
    </div>
  );

  return (
    <div className="grid gap-4">
      <p className="text-body-regular text-text-secondary" aria-live="polite">
        {total} {total === 1 ? "registro" : "registros"}
      </p>

      <div className="hidden rounded-3xl border border-border-table bg-background-primary-default md:block">
        <Table aria-label="Registros de estudo">
          <TableHeader>
            <TableColumn isRowHeader>Data</TableColumn>
            <TableColumn>Matéria</TableColumn>
            <TableColumn>Volta</TableColumn>
            <TableColumn>Tipo</TableColumn>
            <TableColumn>Duração</TableColumn>
            <TableColumn>Questões</TableColumn>
            <TableColumn>Conteúdo</TableColumn>
            <TableColumn>Ações</TableColumn>
          </TableHeader>
          <TableBody>
            {registros.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{dataBR(r.dia)}</TableCell>
                <TableCell>
                  <span className="grid">
                    <span className="text-text-primary">{r.materia}</span>
                    <span className="text-caption-1-regular text-text-secondary">{r.ciclo}</span>
                  </span>
                </TableCell>
                <TableCell>{r.volta ? `Volta ${r.volta}` : "—"}</TableCell>
                <TableCell>
                  <Chip variant="caption">{r.tipo}</Chip>
                </TableCell>
                <TableCell>{tempo(r.duracaoMinutos)}</TableCell>
                <TableCell>{questoesDe(r)}</TableCell>
                <TableCell>
                  <span className="block max-w-56 truncate">{conteudoDe(r)}</span>
                </TableCell>
                <TableCell>{acoes(r)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="grid gap-3 md:hidden" aria-label="Registros de estudo">
        {registros.map((r) => (
          <li key={r.id} className="grid gap-2 rounded-3xl border border-border-button-default bg-background-primary-default p-4">
            <div className="flex items-start justify-between gap-2">
              <span className="grid">
                <span className="text-body-medium text-text-primary">{r.materia}</span>
                <span className="text-caption-1-regular text-text-secondary">
                  {r.ciclo} · {r.volta ? `Volta ${r.volta}` : "—"}
                </span>
              </span>
              <Chip variant="caption">{r.tipo}</Chip>
            </div>
            <p className="text-body-regular text-text-secondary">
              {dataBR(r.dia)} · {tempo(r.duracaoMinutos)} · {questoesDe(r)}
            </p>
            <p className="truncate text-body-regular text-text-secondary">{conteudoDe(r)}</p>
            {acoes(r)}
          </li>
        ))}
      </ul>

      {temMais && (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={() => router.push(enderecoDosRegistros({ ciclo, materia, limite: limite + 25 }), { scroll: false })}>
            Carregar mais
          </Button>
        </div>
      )}

      {editando && (
        <RegistroDeEstudo
          aberto={aberto}
          aoMudar={setAberto}
          abertura={editando.abertura}
          materias={materias}
          materiaInicial={editando.registro.materiaId}
          edicao={editando.registro}
          aoSalvar={(texto) => {
            setAberto(false);
            setAviso(texto);
          }}
        />
      )}
      <AlertDialog
        isOpen={!!excluindo}
        onOpenChange={(a) => !a && setExcluindo(null)}
        title="Excluir este registro?"
        description={excluindo && `${tempo(excluindo.duracaoMinutos)} de ${excluindo.materia} em ${dataBR(excluindo.dia)}. As horas saem do progresso.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        pendingLabel="Excluindo…"
        onConfirm={async () => {
          const { erro } = await excluir(excluindo!.id);
          setAviso(erro ?? "Registro excluído.");
        }}
      />
      <Aviso texto={aviso} aoSumir={() => setAviso(null)} />
    </div>
  );
}
