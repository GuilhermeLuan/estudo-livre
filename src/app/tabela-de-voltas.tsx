import type { VoltaDoHistorico } from "@/casos-de-uso";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@/components/base/table/table";
import { dataDaVolta, duracaoDaVolta } from "./formato";

/** O histórico de Voltas do Ciclo: a aberta primeiro, "Em andamento" no fim dela (AD-016). */
export function TabelaDeVoltas({ voltas }: { voltas: VoltaDoHistorico[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border-table bg-background-primary-default">
      <Table aria-label="Histórico de voltas" size="sm">
        <TableHeader>
          <TableColumn isRowHeader>Volta</TableColumn>
          <TableColumn>Início</TableColumn>
          <TableColumn>Fim</TableColumn>
          <TableColumn>Duração</TableColumn>
        </TableHeader>
        <TableBody>
          {voltas.map((v) => (
            <TableRow key={v.numero} id={v.numero}>
              <TableCell>Volta {v.numero}</TableCell>
              <TableCell>{dataDaVolta(v.inicio)}</TableCell>
              <TableCell>{v.fim ? dataDaVolta(v.fim) : "Em andamento"}</TableCell>
              <TableCell>{duracaoDaVolta(v.inicio, v.fim)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
