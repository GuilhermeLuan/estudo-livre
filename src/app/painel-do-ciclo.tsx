"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { registrar, type EstadoRegistro } from "./acoes-estudo";
import { DiscoDoCiclo, type MateriaDoDisco } from "./disco-do-ciclo";
import { tempo } from "./formato";

const TIPOS = ["Teoria", "Exercícios", "Revisão", "Videoaula", "Leitura de lei"] as const;

export type CicloDoPainel = {
  id: string;
  nome: string;
  volta: number;
  materias: MateriaDoDisco[];
  proxima: MateriaDoDisco | null;
};

function hoje() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

function Rotulo({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <label htmlFor={id} className="text-[.8125rem] font-medium text-ink-2">
      {children}
    </label>
  );
}

function Numero(props: React.InputHTMLAttributes<HTMLInputElement> & { rotulo: string }) {
  const { rotulo, ...resto } = props;
  return (
    <div className="grid gap-1.5">
      <Rotulo id={resto.id!}>{rotulo}</Rotulo>
      <input type="number" inputMode="numeric" className="input" {...resto} />
    </div>
  );
}

function FormularioDeRegistro({
  ciclo,
  materiaInicial,
  dia: diaInicial,
  aoFechar,
  aoRegistrar,
}: {
  ciclo: CicloDoPainel;
  materiaInicial: string;
  dia: string;
  aoFechar: () => void;
  aoRegistrar: (aviso: string) => void;
}) {
  const { materias } = ciclo;
  const [materiaId, setMateriaId] = useState(materiaInicial);
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]>("Teoria");
  const [dia, setDia] = useState(diaInicial);
  const [estado, enviar, enviando] = useActionState<EstadoRegistro, FormData>(registrar.bind(null, materias), {});

  useEffect(() => {
    if (estado.aviso) aoRegistrar(estado.aviso);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado.enviado]);

  return (
    <form action={enviar} className="grid gap-4 p-[22px]">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 id={`titulo-${ciclo.id}`} className="text-[1.125rem]">
          Registrar estudo
        </h2>
        <p className="text-[.8125rem] text-ink-2">{ciclo.nome}</p>
      </div>
      <button type="button" onClick={aoFechar} aria-label="Fechar" className="rounded-sm p-1.5 text-ink-2 hover:text-ink">
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>

    <div className="grid gap-1.5">
      <Rotulo id={`materia-${ciclo.id}`}>Matéria</Rotulo>
      <select id={`materia-${ciclo.id}`} name="materiaId" className="input" value={materiaId} onChange={(e) => setMateriaId(e.target.value)}>
        {materias.map((m) => (
          <option key={m.id} value={m.id}>
            {m.nome}
          </option>
        ))}
      </select>
    </div>

    <div className="grid gap-1.5">
      <Rotulo id={`livre-${ciclo.id}`}>Conteúdo livre</Rotulo>
      <input id={`livre-${ciclo.id}`} name="conteudoLivre" className="input" maxLength={200} placeholder="Opcional. Ex.: crase antes de horas" />
    </div>

    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div className="col-span-2 grid gap-1.5 sm:col-span-1">
        <Rotulo id={`data-${ciclo.id}`}>Data</Rotulo>
        <input id={`data-${ciclo.id}`} name="data" type="date" className="input" value={dia} max={hoje()} required onChange={(e) => setDia(e.target.value)} />
      </div>
      <Numero rotulo="Horas" id={`h-${ciclo.id}`} name="horas" min="0" max="24" defaultValue={1} />
      <Numero rotulo="Minutos" id={`m-${ciclo.id}`} name="minutos" min="0" max="59" defaultValue={0} />
    </div>

    <div className="grid gap-1.5">
      <span id={`tipo-${ciclo.id}`} className="text-[.8125rem] font-medium text-ink-2">
        Tipo de estudo
      </span>
      <div role="group" aria-labelledby={`tipo-${ciclo.id}`} className="flex flex-wrap gap-1.5">
        {TIPOS.map((t) => (
          <button key={t} type="button" className="chip" aria-pressed={tipo === t} onClick={() => setTipo(t)}>
            {t}
          </button>
        ))}
      </div>
      <input type="hidden" name="tipo" value={tipo} />
    </div>

    <div className="grid grid-cols-2 gap-3">
      <Numero rotulo="Questões" id={`q-${ciclo.id}`} name="questoes" min="0" max="1000" placeholder="Opcional" />
      <Numero rotulo="Acertos" id={`a-${ciclo.id}`} name="acertos" min="0" max="1000" placeholder="Opcional" />
    </div>

    <div className="grid gap-1.5">
      <Rotulo id={`nota-${ciclo.id}`}>Anotação</Rotulo>
      <textarea id={`nota-${ciclo.id}`} name="anotacao" maxLength={2000} placeholder="Opcional" className="input min-h-[70px] resize-y" />
    </div>

    {estado.erro && (
      <p role="alert" className="text-[.8125rem] text-red">
        {estado.erro}
      </p>
    )}
    <div className="flex items-center justify-end gap-2.5">
      <button type="button" className="btn btn-quiet" onClick={aoFechar}>
        Cancelar
      </button>
      <button type="submit" className="btn btn-primary" disabled={enviando}>
        Salvar registro
      </button>
    </div>
  </form>
  );
}

export function PainelDoCiclo({ ciclo }: { ciclo: CicloDoPainel }) {
  const { materias, proxima } = ciclo;
  const dialogo = useRef<HTMLDialogElement>(null);
  const [aberturas, setAberturas] = useState(0);
  const [materiaId, setMateriaId] = useState(proxima?.id ?? materias[0]?.id ?? "");
  const [dia, setDia] = useState("");
  const [destaque, setDestaque] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const concluidas = materias.filter((m) => m.feitoMinutos >= m.cargaMinutos).length;

  function abrir(id?: string) {
    setMateriaId(id ?? proxima?.id ?? materias[0]?.id ?? "");
    setDia(hoje());
    setAberturas((n) => n + 1);
    dialogo.current?.showModal();
  }

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 5000);
    return () => clearTimeout(t);
  }, [aviso]);

  return (
    <div className="hero">
      <div className="hero-disc">
        <DiscoDoCiclo nome={ciclo.nome} volta={ciclo.volta} materias={materias} proximaId={proxima?.id} destaqueId={destaque} />
      </div>

      <div className="min-w-0 p-[22px]">
        <div className="mb-3 flex flex-wrap gap-1.5">
          <span className="pill pill-blue">Volta {ciclo.volta}</span>
          <span className="pill">{materias.length === 1 ? "1 matéria" : `${materias.length} matérias`}</span>
          <span className="pill pill-green">{concluidas === 1 ? "1 concluída" : `${concluidas} concluídas`}</span>
        </div>
        <h2 className="mb-1 text-[1.375rem]">
          <Link href={`/ciclos/${ciclo.id}`} className="hover:text-accent-ink">
            {ciclo.nome}
          </Link>
        </h2>

        {proxima ? (
          <>
            <p className="mt-3.5 text-[.875rem] text-ink-2">Próxima matéria</p>
            <p className="text-[1.375rem] font-semibold tracking-[-0.02em]">{proxima.nome}</p>
            <p className="max-w-[52ch] text-[.875rem] text-ink-2">
              {tempo(proxima.feitoMinutos)} de {tempo(proxima.cargaMinutos)} nesta volta.
            </p>
            <div className="my-4 flex flex-wrap gap-2 border-b border-line pb-[18px]">
              <button type="button" className="btn btn-primary" onClick={() => abrir()}>
                Registrar estudo
              </button>
            </div>
          </>
        ) : (
          <div className="my-4 grid justify-items-start gap-2 border-b border-line pb-[18px]">
            <p className="text-[.875rem] text-ink-2">Adicione matérias com carga horária para acompanhar a volta deste ciclo.</p>
            <Link href={`/ciclos/${ciclo.id}`} className="btn btn-primary">
              Adicionar matérias
            </Link>
          </div>
        )}

        <ul className="subjects grid">
          {materias.map((m) => {
            const feita = m.feitoMinutos >= m.cargaMinutos;
            return (
              <li key={m.id} className={`${m.id === proxima?.id ? "is-next" : ""} ${feita ? "is-done" : ""}`}>
                <button
                  type="button"
                  onClick={() => abrir(m.id)}
                  onMouseEnter={() => setDestaque(m.id)}
                  onMouseLeave={() => setDestaque(null)}
                  onFocus={() => setDestaque(m.id)}
                  onBlur={() => setDestaque(null)}
                  aria-label={`Registrar estudo de ${m.nome}`}
                >
                  <span className="s-name text-[.875rem] font-medium">{m.nome}</span>
                  <span className="text-[.8125rem] text-ink-2 tabular-nums">
                    {tempo(m.feitoMinutos)} / {tempo(m.cargaMinutos)}
                  </span>
                  <span className="bar">
                    <i style={{ width: `${(m.feitoMinutos / m.cargaMinutos) * 100}%` }} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <dialog ref={dialogo} className="sheet-dialog" aria-labelledby={`titulo-${ciclo.id}`}>
        <FormularioDeRegistro
          key={aberturas}
          ciclo={ciclo}
          materiaInicial={materiaId}
          dia={dia}
          aoFechar={() => dialogo.current?.close()}
          aoRegistrar={(texto) => {
            dialogo.current?.close();
            setAviso(texto);
          }}
        />
      </dialog>

      {aviso && (
        <div className="toast" role="status">
          {aviso}
        </div>
      )}
    </div>
  );
}
