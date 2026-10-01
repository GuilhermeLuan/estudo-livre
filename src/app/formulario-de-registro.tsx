"use client";

import { useActionState, useEffect, useState } from "react";
import type { CicloDaHome, SugestaoDeRegistro } from "@/casos-de-uso";
import { hojeEmBrasilia } from "@/dia";
import { LIMITES_DO_REGISTRO, TIPOS_DE_ESTUDO, type TipoDeEstudo } from "@/dominio";
import { registrar, type EstadoRegistro } from "./acoes-estudo";

const ROTULO = "text-[.8125rem] font-medium text-ink-2";
const { duracaoMaximaMinutos, questoesMaximas, anotacaoMaxima, conteudoLivreMaximo } = LIMITES_DO_REGISTRO;

function RotuloDeCampo({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <label htmlFor={id} className={ROTULO}>
      {children}
    </label>
  );
}

function CampoNumerico({ rotulo, id, ...resto }: React.InputHTMLAttributes<HTMLInputElement> & { rotulo: string; id: string }) {
  return (
    <div className="grid gap-1.5">
      <RotuloDeCampo id={id}>{rotulo}</RotuloDeCampo>
      <input id={id} type="number" inputMode="numeric" className="input" {...resto} />
    </div>
  );
}

/** Sessão cronometrada: a Matéria fica travada e o registro consome o Cronômetro ao salvar. */
export type SessaoCronometrada = SugestaoDeRegistro;

type Props = {
  /** Prefixo dos ids dos campos: o painel e o cronômetro montam este formulário para o mesmo Ciclo. */
  idBase: string;
  ciclo: Pick<CicloDaHome, "id" | "nome" | "materias">;
  materiaInicial: string;
  sessaoCronometrada?: SessaoCronometrada;
  aoFechar: () => void;
  aoSalvar: (aviso: string) => void;
};

/** Conteúdo do diálogo "Registrar estudo". É remontado a cada abertura para começar limpo. */
export function FormularioDeRegistro({ idBase: id, ciclo, materiaInicial, sessaoCronometrada, aoFechar, aoSalvar }: Props) {
  const { materias } = ciclo;
  const [materiaId, setMateriaId] = useState(materiaInicial);
  const [tipo, setTipo] = useState<TipoDeEstudo>("Teoria");
  const [dia, setDia] = useState(() => hojeEmBrasilia());
  const cronometrado = !!sessaoCronometrada;
  const duracaoInicial = sessaoCronometrada?.duracaoMinutos ?? 60;
  const horasIniciais = Math.floor(duracaoInicial / 60);
  const minutosIniciais = duracaoInicial % 60;
  const [estado, enviar, enviando] = useActionState<EstadoRegistro, FormData>(registrar, {});

  useEffect(() => {
    if (estado.aviso) aoSalvar(estado.aviso);
    // Só reage a um novo envio bem-sucedido.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado.enviado]);

  return (
    <form action={enviar} className="grid gap-4 p-[22px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id={`titulo-${id}`} className="text-[1.125rem]">
            {cronometrado ? "Registrar sessão cronometrada" : "Registrar estudo"}
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
        <RotuloDeCampo id={`materia-${id}`}>Matéria</RotuloDeCampo>
        {cronometrado && (
          <>
            <input type="hidden" name="materiaId" value={materiaId} />
            <input type="hidden" name="cronometro" value="sim" />
          </>
        )}
        <select
          id={`materia-${id}`}
          name={cronometrado ? undefined : "materiaId"}
          className="input"
          value={materiaId}
          disabled={cronometrado}
          onChange={(e) => setMateriaId(e.target.value)}
        >
          {materias.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1.5">
        <RotuloDeCampo id={`livre-${id}`}>Conteúdo livre</RotuloDeCampo>
        <input id={`livre-${id}`} name="conteudoLivre" className="input" maxLength={conteudoLivreMaximo} placeholder="Opcional. Ex.: crase antes de horas" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="col-span-2 grid gap-1.5 sm:col-span-1">
          <RotuloDeCampo id={`data-${id}`}>Data</RotuloDeCampo>
          <input id={`data-${id}`} name="data" type="date" className="input" value={dia} max={hojeEmBrasilia()} required onChange={(e) => setDia(e.target.value)} />
        </div>
        <CampoNumerico rotulo="Horas" id={`horas-${id}`} name="horas" min="0" max={duracaoMaximaMinutos / 60} defaultValue={horasIniciais} />
        <CampoNumerico rotulo="Minutos" id={`minutos-${id}`} name="minutos" min="0" max="59" defaultValue={minutosIniciais} />
      </div>

      {sessaoCronometrada?.passouDoLimite && (
        <p className="-mt-2 text-[.8125rem] text-ink-2">O cronômetro passou de {duracaoMaximaMinutos / 60} horas. Ajuste a duração se precisar.</p>
      )}

      <div className="grid gap-1.5">
        <span id={`tipo-${id}`} className={ROTULO}>
          Tipo de estudo
        </span>
        <div role="group" aria-labelledby={`tipo-${id}`} className="flex flex-wrap gap-1.5">
          {TIPOS_DE_ESTUDO.map((t) => (
            <button key={t} type="button" className="chip" aria-pressed={tipo === t} onClick={() => setTipo(t)}>
              {t}
            </button>
          ))}
        </div>
        <input type="hidden" name="tipo" value={tipo} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <CampoNumerico rotulo="Questões" id={`questoes-${id}`} name="questoes" min="0" max={questoesMaximas} placeholder="Opcional" />
        <CampoNumerico rotulo="Acertos" id={`acertos-${id}`} name="acertos" min="0" max={questoesMaximas} placeholder="Opcional" />
      </div>

      <div className="grid gap-1.5">
        <RotuloDeCampo id={`anotacao-${id}`}>Anotação</RotuloDeCampo>
        <textarea id={`anotacao-${id}`} name="anotacao" maxLength={anotacaoMaxima} placeholder="Opcional" className="input min-h-[70px] resize-y" />
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
