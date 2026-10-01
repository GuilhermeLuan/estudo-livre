import type { MateriaComProgresso } from "@/casos-de-uso";
import { tempo } from "./formato";

// O disco é desenhado em unidades do viewBox 260x260; os tamanhos de texto acompanham o desenho.
const RAIO = 100;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;
const LARGURA_DO_ARCO = 28;
const FOLGA_ENTRE_ARCOS = 4;

/** Um arco por Matéria, proporcional à carga horária e preenchido pelo Progresso da matéria. */
export function DiscoDoCiclo({
  nome,
  volta,
  materias,
  faltaMinutos,
  proximaId,
  destaqueId,
}: {
  nome: string;
  volta: number;
  materias: MateriaComProgresso[];
  faltaMinutos: number;
  proximaId?: string;
  destaqueId?: string | null;
}) {
  const total = materias.reduce((soma, m) => soma + m.cargaMinutos, 0);
  const folga = materias.length > 1 ? FOLGA_ENTRE_ARCOS : 0;
  const raioDaProxima = RAIO + LARGURA_DO_ARCO / 2 + 7;
  const circunferenciaDaProxima = 2 * Math.PI * raioDaProxima;
  const descricao =
    `${nome}, volta ${volta}: ` +
    (materias.length
      ? materias.map((m) => `${m.nome} ${Math.round((m.feitoMinutos / m.cargaMinutos) * 100)}%`).join(", ")
      : "sem matérias");

  let inicio = 0;
  const arcos = materias.map((m) => {
    const comprimento = (m.cargaMinutos / total) * CIRCUNFERENCIA;
    const trilho = Math.max(0, comprimento - folga);
    const preenchido = trilho * (m.feitoMinutos / m.cargaMinutos);
    const deslocamento = -inicio;
    const deslocamentoDaProxima = -(inicio / CIRCUNFERENCIA) * circunferenciaDaProxima;
    inicio += comprimento;
    const arco = { r: RAIO, cx: 130, cy: 130, fill: "none", strokeWidth: LARGURA_DO_ARCO, transform: "rotate(-90 130 130)" };
    return (
      <g key={m.id} className={`seg${destaqueId && destaqueId !== m.id ? " dim" : ""}`}>
        <circle {...arco} className="seg-track" strokeDasharray={`${trilho} ${CIRCUNFERENCIA}`} strokeDashoffset={deslocamento} />
        <circle {...arco} className="seg-fill" strokeDasharray={`${preenchido} ${CIRCUNFERENCIA}`} strokeDashoffset={deslocamento} />
        {m.id === proximaId && (
          <circle
            className="seg-next"
            r={raioDaProxima}
            cx="130"
            cy="130"
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${Math.max(0, (m.cargaMinutos / total) * circunferenciaDaProxima - folga * 1.4)} 9999`}
            strokeDashoffset={deslocamentoDaProxima}
            transform="rotate(-90 130 130)"
          />
        )}
      </g>
    );
  });

  return (
    <svg className="disc" viewBox="0 0 260 260" role="img" aria-label={descricao}>
      {materias.length === 0 && (
        <circle className="seg-track" r={RAIO} cx="130" cy="130" fill="none" strokeWidth={LARGURA_DO_ARCO} />
      )}
      {arcos}
      <text x="130" y="118" textAnchor="middle" className="disco-rotulo">Volta {volta}</text>
      <text x="130" y="150" textAnchor="middle" className="disco-tempo">{tempo(faltaMinutos)}</text>
      <text x="130" y="172" textAnchor="middle" className="disco-rotulo">para fechar</text>
    </svg>
  );
}
