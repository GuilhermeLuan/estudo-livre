import { notFound } from "next/navigation";
import { listarUsuarios, NaoAutorizadoError } from "@/casos-de-uso";
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
      <h1 id="h-usuarios">Usuários</h1>
      <ul className="panel grid gap-3 p-0">
        {usuarios.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-[18px] py-3 last:border-b-0">
            <div className="grid">
              <span className="text-[.875rem] font-semibold">
                {u.nome}{" "}
                {u.admin && <span className="ml-1 rounded-[6px] bg-accent-soft px-1.5 py-0.5 text-[.6875rem] font-semibold text-accent-ink">Admin</span>}
              </span>
              <span className="text-[.8125rem] text-ink-2">{u.email}</span>
            </div>
            <RedefinirSenhaForm usuarioId={u.id} nome={u.nome} />
          </li>
        ))}
      </ul>
    </section>
  );
}
