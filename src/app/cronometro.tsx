"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { CicloDaHome, CronometroAtivo } from "@/casos-de-uso";
import { descartar, parar, pausar, retomar, type ResultadoDoCronometro } from "./acoes-cronometro";
import { Aviso } from "./aviso";
import { FormularioDeRegistro, type SessaoCronometrada } from "./formulario-de-registro";

const INTERVALO_DE_ATUALIZACAO_MS = 15_000;

const doisDigitos = (n: number) => String(Math.floor(n)).padStart(2, "0");
const relogio = (s: number) => `${doisDigitos(s / 3600)}:${doisDigitos((s % 3600) / 60)}:${doisDigitos(s % 60)}`;

/** O servidor manda os segundos acumulados; daqui o relógio só anda localmente, sem depender da hora do aparelho. */
function Tempo({ segundos, rodando }: { segundos: number; rodando: boolean }) {
  const [inicio] = useState(() => Date.now());
  const [agora, setAgora] = useState(inicio);
  useEffect(() => {
    if (!rodando) return;
    const t = setInterval(() => setAgora(Date.now()), 250);
    return () => clearInterval(t);
  }, [rodando]);
  const total = segundos + (rodando ? Math.floor((agora - inicio) / 1000) : 0);
  return (
    <span className="t-time tabular-nums" role="timer" aria-live="off">
      {relogio(total)}
    </span>
  );
}

type Props = {
  ativo: CronometroAtivo | null;
  /** O Ciclo da Matéria cronometrada, para o formulário de registro. */
  ciclo: Pick<CicloDaHome, "id" | "nome" | "materias"> | null;
};

/** Cronômetro flutuante (global) e o diálogo de registro que "Parar e registrar" abre. */
export function Cronometro({ ativo, ciclo }: Props) {
  const router = useRouter();
  const dialogo = useRef<HTMLDialogElement>(null);
  const [pendente, executar] = useTransition();
  const [aviso, setAviso] = useState<string | null>(null);
  const [sessao, setSessao] = useState<SessaoCronometrada | null>(null);
  const [aberturas, setAberturas] = useState(0);

  // O estado vive no servidor: relê ao voltar para a aba e, com a aba aberta, a cada poucos segundos,
  // para refletir o que foi feito em outro aparelho.
  const existe = ativo !== null;
  useEffect(() => {
    const atualizar = () => document.visibilityState === "visible" && router.refresh();
    document.addEventListener("visibilitychange", atualizar);
    const periodico = existe ? setInterval(atualizar, INTERVALO_DE_ATUALIZACAO_MS) : undefined;
    return () => {
      document.removeEventListener("visibilitychange", atualizar);
      clearInterval(periodico);
    };
  }, [router, existe]);

  function fazer(acao: () => Promise<ResultadoDoCronometro>) {
    executar(async () => {
      const resultado = await acao();
      setAviso(resultado.erro ?? resultado.aviso ?? null);
    });
  }

  function pararERegistrar() {
    executar(async () => {
      const resultado = await parar();
      if (!resultado.parado) return setAviso(resultado.erro ?? null);
      setSessao(resultado.parado);
      setAberturas((n) => n + 1);
      dialogo.current?.showModal();
    });
  }

  return (
    <>
      {ativo && (
        <div className={`timer${ativo.rodando ? "" : " paused"}`} role="region" aria-label="Cronômetro">
          <Tempo key={`${ativo.segundos}-${ativo.rodando}`} segundos={ativo.segundos} rodando={ativo.rodando} />
          <span className="t-what">
            <span>{ativo.materia}</span>
            <small>{ativo.ciclo}</small>
          </span>
          <span className="t-actions">
            <button type="button" className="btn" disabled={pendente} onClick={() => fazer(ativo.rodando ? pausar : retomar)}>
              {ativo.rodando ? "Pausar" : "Retomar"}
            </button>
            <button type="button" className="btn btn-primary" disabled={pendente} onClick={pararERegistrar}>
              Parar e registrar
            </button>
            <button type="button" className="btn btn-quiet" disabled={pendente} onClick={() => fazer(descartar)}>
              Descartar
            </button>
          </span>
        </div>
      )}

      {ciclo && ativo && (
        <dialog ref={dialogo} className="sheet-dialog" aria-labelledby={`titulo-${ciclo.id}`}>
          {sessao && (
            <FormularioDeRegistro
              key={aberturas}
              ciclo={ciclo}
              materiaInicial={ativo.materiaId}
              sessaoCronometrada={sessao}
              aoFechar={() => dialogo.current?.close()}
              aoSalvar={(texto) => {
                dialogo.current?.close();
                setSessao(null);
                setAviso(texto);
              }}
            />
          )}
        </dialog>
      )}
      <Aviso texto={aviso} aoSumir={() => setAviso(null)} />
    </>
  );
}
