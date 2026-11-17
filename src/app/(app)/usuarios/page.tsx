import { notFound } from "next/navigation";
import { listarUsuarios, NaoAutorizadoError } from "@/casos-de-uso";
import { Chip } from "@/components/base/badges/chip";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@/components/base/table/table";
import { obterDb } from "@/db";
import { exigirUsuario } from "@/sessao";
import { RedefinirSenhaForm } from "./redefinir-senha-form";

export const dynamic = "force-dynamic";

export default async function Usuarios() {
  const usuarios = await listarUsuarios(obterDb(), await exigirUsuario()).catch((erro) => {
    if (erro instanceof NaoAutorizadoError) notFound();
    throw erro;
  });
  return (
    <section aria-labelledby="h-usuarios" className="grid gap-5">
      <h1 id="h-usuarios" className="text-title-1-medium text-text-primary">
        Usuários
      </h1>
      <div className="rounded-3xl border border-border-table bg-background-primary-default">
        <Table aria-label="Usuários">
          <TableHeader>
            <TableColumn isRowHeader>Nome</TableColumn>
            <TableColumn>E-mail</TableColumn>
            <TableColumn>Ação</TableColumn>
          </TableHeader>
          <TableBody>
            {usuarios.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <span className="inline-flex items-center gap-2">
                    {u.nome}
                    {u.admin && (
                      <Chip variant="caption" color="blue">
                        Admin
                      </Chip>
                    )}
                  </span>
                </TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <RedefinirSenhaForm usuarioId={u.id} nome={u.nome} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
