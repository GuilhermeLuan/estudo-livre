"use client";

import { RiDeleteBinLine, RiPauseLine, RiPlayLine, RiStopFill, RiTimerLine } from "@remixicon/react";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, useTransition } from "react";
import type { CronometroAtivo, CronometroParado } from "@/casos-de-uso";
import { Button } from "@/components/base/buttons/button";
import { IconButton } from "@/components/base/buttons/icon-button";
import { Chip } from "@/components/base/badges/chip";
import { cx } from "@/utils/cx";
import { descartar, iniciar as iniciarNoServidor, parar, pausar, retomar, type ResultadoDoCronometro } from "./acoes-cronometro";
import { Aviso } from "./aviso";
import { type MateriaParaRegistro, RegistroDeEstudo } from "./formulario-de-registro";

const INTERVALO_DE_ATUALIZACAO_MS = 15_000;

const doisDigitos = (n: number) => String(Math.floor(n)).padStart(2, "0");
const relogio = (s: number) => `${doisDigitos(s / 3600)}:${doisDigitos((s % 3600) / 60)}:${doisDigitos(s % 60)}`;

/** O servidor manda os segundos acumulados; daqui o relógio só anda localmente, sem depender da hora do aparelho. */
function Tempo({ segundos, rodando, className }: { segundos: number; rodando: boolean; className?: string }) {
  const [inicio] = useState(() => Date.now());
  const [agora, setAgora] = useState(inicio);
  useEffect(() => {
    if (!rodando) return;
    const t = setInterval(() => setAgora(Date.now()), 250);
    return () => clearInterval(t);
  }, [rodando]);
  const total = segundos + (rodando ? Math.floor((agora - inicio) / 1000) : 0);
  return (
    <span className={cx("tabular-nums", className)} role="timer" aria-live="off">
      {relogio(total)}
    </span>
  );
}

type Contexto = {
  ativo: CronometroAtivo | null;
  materias: MateriaParaRegistro[];
  /** Matérias de Ciclos arquivados: só a edição de um Registro antigo as usa. */
  materiasArquivadas: MateriaParaRegistro[];
  /** A Matéria da Próxima etapa do primeiro Ciclo, ou a primeira Matéria que existir. */
  materiaPadrao: string;
  pendente: boolean;
  /** Abre o modal de registro; com `topicoId` (um Tópico da Matéria), ele já vem escolhido. */
  abrirRegistro: (materiaId?: string, topicoId?: string) => void;
  /** Inicia o Cronômetro na Matéria; com `topicoId`, o registro ao parar sai com o Tópico. */
  iniciar: (materia: { materiaId: string; nome: string; topicoId?: string }) => void;
  pausarOuRetomar: () => void;
  pararERegistrar: () => void;
  descartar: () => void;
};

const CronometroContext = createContext<Contexto | null>(null);

export function useCronometro() {
  const contexto = useContext(CronometroContext);
  if (!contexto) throw new Error("useCronometro fora do ProvedorDoCronometro");
  return contexto;
}

type Props = {
  ativo: CronometroAtivo | null;
  materias: MateriaParaRegistro[];
  materiasArquivadas: MateriaParaRegistro[];
  materiaPadrao: string;
  children: React.ReactNode;
};

/** O estado do Cronômetro e o modal de registro, compartilhados pela Sidebar, pela barra de abas e pelas telas. */
export function ProvedorDoCronometro({ ativo, materias, materiasArquivadas, materiaPadrao, children }: Props) {
  const router = useRouter();
  const [pendente, executar] = useTransition();
  const [aviso, setAviso] = useState<string | null>(null);
  // A sessão guarda o que o formulário precisa: salvar consome o Cronômetro e o card some do servidor,
  // mas o modal precisa continuar montado até mostrar o aviso de sucesso.
  const [registro, setRegistro] = useState<{ aberto: boolean; abertura: number; materiaId: string; topicoId?: string | null; sessao?: CronometroParado }>({
    aberto: false,
    abertura: 0,
    materiaId: "",
  });

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

  const abrir = (materiaId: string, sessao?: CronometroParado, topicoId?: string | null) =>
    setRegistro((r) => ({ aberto: true, abertura: r.abertura + 1, materiaId, topicoId, sessao }));

  function fazer(acao: () => Promise<ResultadoDoCronometro>) {
    executar(async () => {
      const resultado = await acao();
      setAviso(resultado.erro ?? resultado.aviso ?? null);
    });
  }

  const contexto: Contexto = {
    ativo,
    materias,
    materiasArquivadas,
    materiaPadrao,
    pendente,
    abrirRegistro: (materiaId, topicoId) => abrir(materiaId ?? materiaPadrao, undefined, topicoId),
    iniciar: (materia) =>
      executar(async () => {
        const { erro } = await iniciarNoServidor(materia.materiaId, materia.topicoId);
        setAviso(erro ?? `Cronômetro iniciado em ${materia.nome}.`);
      }),
    pausarOuRetomar: () => fazer(ativo?.rodando ? pausar : retomar),
    pararERegistrar: () =>
      executar(async () => {
        const resultado = await parar();
        if (!resultado.parado) return setAviso(resultado.erro ?? null);
        abrir(resultado.parado.materiaId, resultado.parado, resultado.parado.topicoId);
      }),
    descartar: () => fazer(descartar),
  };

  return (
    <CronometroContext.Provider value={contexto}>
      {children}
      <RegistroDeEstudo
        aberto={registro.aberto}
        aoMudar={(aberto) => setRegistro((r) => ({ ...r, aberto }))}
        abertura={registro.abertura}
        materias={materias}
        materiaInicial={registro.materiaId}
        topicoInicial={registro.topicoId}
        sessaoCronometrada={registro.sessao}
        aoSalvar={(texto) => {
          setRegistro((r) => ({ ...r, aberto: false, sessao: undefined }));
          setAviso(texto);
        }}
      />
      <Aviso texto={aviso} aoSumir={() => setAviso(null)} />
    </CronometroContext.Provider>
  );
}

function Situacao({ rodando }: { rodando: boolean }) {
  return (
    <Chip variant="caption" color={rodando ? "lime" : "yellow"}>
      {rodando ? "Rodando" : "Pausado"}
    </Chip>
  );
}

/**
 * O card do Cronômetro: `cartao` na Sidebar, `grande` no topo da Hoje no celular e `faixa` compacta
 * acima da barra de abas nas outras rotas. Sem Cronômetro, não desenha nada.
 */
export function CartaoDoCronometro({ variante }: { variante: "cartao" | "grande" | "faixa" }) {
  const { ativo, pendente, pausarOuRetomar, pararERegistrar, descartar } = useCronometro();
  if (!ativo) return null;
  const tempo = <Tempo key={`${ativo.segundos}-${ativo.rodando}`} segundos={ativo.segundos} rodando={ativo.rodando} />;
  const quem = `${ativo.materia} · ${ativo.ciclo}`;

  if (variante === "faixa")
    return (
      <div role="region" aria-label="Cronômetro" className="flex items-center gap-3 rounded-2xl border border-separator-border bg-background-primary-default px-4 py-2 shadow-xs">
        <RiTimerLine className="size-5 shrink-0 text-foreground-icon-secondary" aria-hidden />
        <span className="text-headline-medium text-text-primary">{tempo}</span>
        <span className="min-w-0 flex-1 truncate text-body-regular text-text-secondary">{ativo.materia}</span>
        <Button size="small" disabled={pendente} onClick={pararERegistrar}>
          Parar
        </Button>
      </div>
    );

  const grande = variante === "grande";
  return (
    <div
      role="region"
      aria-label="Cronômetro"
      className={cx(
        "grid gap-2 border border-separator-border bg-background-primary-default shadow-xs",
        grande ? "gap-3 rounded-3xl bg-background-secondary-default p-5" : "rounded-2xl p-3",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-body-regular text-text-secondary">
          <RiTimerLine className="size-4" aria-hidden />
          Cronômetro
        </span>
        <span className="flex items-center gap-1">
          <Situacao rodando={ativo.rodando} />
          <IconButton size="small" aria-label="Descartar cronômetro" disabled={pendente} onClick={descartar} icon={RiDeleteBinLine} />
        </span>
      </div>
      <p className={cx("text-text-primary", grande ? "text-[40px] leading-[48px] font-medium" : "text-title-2-medium")}>{tempo}</p>
      <p className="truncate text-body-regular text-text-secondary">{quem}</p>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" size={grande ? "medium" : "small"} leadingIcon={ativo.rodando ? RiPauseLine : RiPlayLine} disabled={pendente} onClick={pausarOuRetomar}>
          {ativo.rodando ? "Pausar" : "Retomar"}
        </Button>
        <Button size={grande ? "medium" : "small"} leadingIcon={RiStopFill} disabled={pendente} onClick={pararERegistrar}>
          {grande ? "Parar e registrar" : "Parar"}
        </Button>
      </div>
    </div>
  );
}
