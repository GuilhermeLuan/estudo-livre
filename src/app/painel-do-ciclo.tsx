"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { CicloDaHome } from "@/casos-de-uso";
import { Aviso } from "./aviso";
import { DiscoDoCiclo } from "./disco-do-ciclo";
import { FormularioDeRegistro } from "./formulario-de-registro";
import { concluida, fracaoFeita } from "@/dominio";
import { quantidade, tempo } from "./formato";

/** Card do ciclo (hero): disco, Próxima matéria, lista de matérias e o diálogo de registro. */
export function PainelDoCiclo({ ciclo }: { ciclo: CicloDaHome }) {
  const { materias, proxima } = ciclo;
  const dialogo = useRef<HTMLDialogElement>(null);
  const [aberturas, setAberturas] = useState(0);
  const [materiaId, setMateriaId] = useState("");
  const [destaque, setDestaque] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  function abrir(id?: string) {
    setMateriaId(id ?? proxima?.id ?? materias[0]?.id ?? "");
    setAberturas((n) => n + 1);
    dialogo.current?.showModal();
  }

  return (
    <div className="hero">
      <div className="hero-disc">
        <DiscoDoCiclo
          nome={ciclo.nome}
          volta={ciclo.volta}
          materias={materias}
          faltaMinutos={ciclo.faltaMinutos}
          proximaId={proxima?.id}
          destaqueId={destaque}
        />
      </div>

      <div className="min-w-0 p-[22px]">
        <div className="mb-3 flex flex-wrap gap-1.5">
          <span className="pill pill-blue">Volta {ciclo.volta}</span>
          <span className="pill">{quantidade(materias.length, "matéria", "matérias")}</span>
          <span className="pill pill-green">{quantidade(ciclo.concluidas, "concluída", "concluídas")}</span>
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
          {materias.map((m) => (
            <li key={m.id} className={`${m.id === proxima?.id ? "is-next" : ""} ${concluida(m) ? "is-done" : ""}`}>
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
                  <i style={{ width: `${fracaoFeita(m) * 100}%` }} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <dialog ref={dialogo} className="sheet-dialog" aria-labelledby={`titulo-${ciclo.id}`}>
        <FormularioDeRegistro
          key={aberturas}
          ciclo={ciclo}
          materiaInicial={materiaId}
          aoFechar={() => dialogo.current?.close()}
          aoSalvar={(texto) => {
            dialogo.current?.close();
            setAviso(texto);
          }}
        />
      </dialog>
      <Aviso texto={aviso} aoSumir={() => setAviso(null)} />
    </div>
  );
}
