import type { EtapaComProgresso } from "@/casos-de-uso";
import { fracaoFeita } from "@/dominio";
import { tempo } from "./formato";

// O disco é desenhado em unidades do viewBox 260x260; os tamanhos de texto acompanham o desenho.
const CENTRO = 130;
const RAIO = 100;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;
const LARGURA_DO_ARCO = 28;
const FOLGA_ENTRE_ARCOS = 4;
const DISTANCIA_DO_ARCO_DA_PROXIMA = 7;
const LARGURA_DO_ARCO_DA_PROXIMA = 3;
const FOLGA_DA_PROXIMA = FOLGA_ENTRE_ARCOS * 1.4;
const GIRO = `rotate(-90 ${CENTRO} ${CENTRO})`; // o arco começa no topo

/** Um arco por Etapa, proporcional à carga horária e preenchido pelo Progresso da etapa. */
export function DiscoDoCiclo({
  nome,
  volta,
  etapas,
  faltaMinutos,
  proximaId,
  destaqueId,
}: {
  nome: string;
  volta: number;
  etapas: EtapaComProgresso[];
  faltaMinutos: number;
  proximaId?: string;
  /** Matéria em destaque: as Etapas dela ficam em evidência e as outras esmaecem. */
  destaqueId?: string | null;
}) {
  const total = etapas.reduce((soma, e) => soma + e.cargaMinutos, 0);
  const folga = etapas.length > 1 ? FOLGA_ENTRE_ARCOS : 0;
  const raioDaProxima = RAIO + LARGURA_DO_ARCO / 2 + DISTANCIA_DO_ARCO_DA_PROXIMA;
  const circunferenciaDaProxima = 2 * Math.PI * raioDaProxima;
  const descricao =
    `${nome}, volta ${volta}: ` +
    (etapas.length
      ? etapas.map((e) => `${e.nome} ${Math.round(fracaoFeita(e) * 100)}%`).join(", ")
      : "sem etapas");

  let inicio = 0;
  const arcos = etapas.map((e) => {
    const comprimento = (e.cargaMinutos / total) * CIRCUNFERENCIA;
    const trilho = Math.max(0, comprimento - folga);
    const preenchido = trilho * fracaoFeita(e);
    const deslocamento = -inicio;
    const deslocamentoDaProxima = -(inicio / CIRCUNFERENCIA) * circunferenciaDaProxima;
    inicio += comprimento;
    const arco = { r: RAIO, cx: CENTRO, cy: CENTRO, fill: "none", strokeWidth: LARGURA_DO_ARCO, transform: GIRO };
    return (
      <g key={e.id} className={`seg${destaqueId && destaqueId !== e.materiaId ? " dim" : ""}`}>
        <circle {...arco} className="seg-track" strokeDasharray={`${trilho} ${CIRCUNFERENCIA}`} strokeDashoffset={deslocamento} />
        <circle {...arco} className="seg-fill" strokeDasharray={`${preenchido} ${CIRCUNFERENCIA}`} strokeDashoffset={deslocamento} />
        {e.id === proximaId && (
          <circle
            className="seg-next"
            r={raioDaProxima}
            cx={CENTRO}
            cy={CENTRO}
            fill="none"
            strokeWidth={LARGURA_DO_ARCO_DA_PROXIMA}
            strokeLinecap="round"
            strokeDasharray={`${Math.max(0, (e.cargaMinutos / total) * circunferenciaDaProxima - (folga && FOLGA_DA_PROXIMA))} 9999`}
            strokeDashoffset={deslocamentoDaProxima}
            transform={GIRO}
          />
        )}
      </g>
    );
  });

  return (
    <svg className="disc" viewBox="0 0 260 260" role="img" aria-label={descricao}>
      {etapas.length === 0 && (
        <circle className="seg-track" r={RAIO} cx={CENTRO} cy={CENTRO} fill="none" strokeWidth={LARGURA_DO_ARCO} />
      )}
      {arcos}
      <text x={CENTRO} y={CENTRO - 12} textAnchor="middle" className="disco-rotulo">Volta {volta}</text>
      <text x={CENTRO} y={CENTRO + 20} textAnchor="middle" className="disco-tempo">{tempo(faltaMinutos)}</text>
      <text x={CENTRO} y={CENTRO + 42} textAnchor="middle" className="disco-rotulo">para fechar</text>
    </svg>
  );
}
