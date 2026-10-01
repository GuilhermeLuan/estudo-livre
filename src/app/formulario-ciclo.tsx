"use client";

import { useActionState, useId } from "react";
import type { EstadoCiclo } from "./acoes-ciclos";
import { Campo } from "./campo";

type Props = {
  acao: (estado: EstadoCiclo, dados: FormData) => Promise<EstadoCiclo>;
  botao: string;
  nome?: string;
  horas?: number;
  comCarga?: boolean;
  rotuloNome: string;
};

export function FormularioNome({ acao, botao, nome, horas, comCarga, rotuloNome }: Props) {
  const [estado, enviar, enviando] = useActionState(acao, {});
  const base = useId();
  return (
    <form action={enviar} className="grid gap-3">
      <div className={comCarga ? "grid gap-3 sm:grid-cols-[1fr_140px]" : "grid"}>
        <Campo rotulo={rotuloNome} id={`${base}-nome`} name="nome" defaultValue={nome} required maxLength={120} />
        {comCarga && (
          <Campo
            rotulo="Carga horária (h)"
            id={`${base}-horas`}
            name="horas"
            type="number"
            min="0.25"
            step="0.25"
            defaultValue={horas}
            required
            inputMode="decimal"
          />
        )}
      </div>
      {estado.erro && (
        <p role="alert" className="text-[.8125rem] text-red">
          {estado.erro}
        </p>
      )}
      <div>
        <button type="submit" className="btn btn-primary" disabled={enviando}>
          {botao}
        </button>
      </div>
    </form>
  );
}
