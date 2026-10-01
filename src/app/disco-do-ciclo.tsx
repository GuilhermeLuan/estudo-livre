import { tempo } from "./formato";

export type MateriaDoDisco = { id: string; nome: string; cargaMinutos: number; feitoMinutos: number };

const R = 100;
const C = 2 * Math.PI * R;
const LARGURA = 28;

/** Um arco por Matéria, proporcional à carga horária e preenchido pelo Progresso da matéria. */
export function DiscoDoCiclo({
  nome,
  volta,
  materias,
  proximaId,
  destaqueId,
}: {
  nome: string;
  volta: number;
  materias: MateriaDoDisco[];
  proximaId?: string;
  destaqueId?: string | null;
}) {
  const total = materias.reduce((a, m) => a + m.cargaMinutos, 0);
  const falta = materias.reduce((a, m) => a + (m.cargaMinutos - m.feitoMinutos), 0);
  const folga = materias.length > 1 ? 4 : 0;
  const raioProxima = R + LARGURA / 2 + 7;
  const circProxima = 2 * Math.PI * raioProxima;
  const descricao =
    `${nome}, volta ${volta}: ` +
    (materias.length
      ? materias.map((m) => `${m.nome} ${Math.round((m.feitoMinutos / m.cargaMinutos) * 100)}%`).join(", ")
      : "sem matérias");

  let inicio = 0;
  const arcos = materias.map((m) => {
    const comprimento = (m.cargaMinutos / total) * C;
    const trilho = Math.max(0, comprimento - folga);
    const preenchido = trilho * (m.feitoMinutos / m.cargaMinutos);
    const deslocamento = -inicio;
    const deslocamentoProxima = -(inicio / C) * circProxima;
    inicio += comprimento;
    return (
      <g key={m.id} className={`seg${destaqueId && destaqueId !== m.id ? " dim" : ""}`}>
        <circle className="seg-track" r={R} cx="130" cy="130" fill="none" strokeWidth={LARGURA} strokeDasharray={`${trilho} ${C}`} strokeDashoffset={deslocamento} transform="rotate(-90 130 130)" />
        <circle className="seg-fill" r={R} cx="130" cy="130" fill="none" strokeWidth={LARGURA} strokeDasharray={`${preenchido} ${C}`} strokeDashoffset={deslocamento} transform="rotate(-90 130 130)" />
        {m.id === proximaId && (
          <circle
            className="seg-next"
            r={raioProxima}
            cx="130"
            cy="130"
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${Math.max(0, (m.cargaMinutos / total) * circProxima - folga * 1.4)} 9999`}
            strokeDashoffset={deslocamentoProxima}
            transform="rotate(-90 130 130)"
          />
        )}
      </g>
    );
  });

  return (
    <svg className="disc" viewBox="0 0 260 260" role="img" aria-label={descricao}>
      {materias.length === 0 && <circle className="seg-track" r={R} cx="130" cy="130" fill="none" strokeWidth={LARGURA} />}
      {arcos}
      <text x="130" y="118" textAnchor="middle" fontSize="15" className="muted">Volta {volta}</text>
      <text x="130" y="150" textAnchor="middle" fontWeight="600" fontSize="34">{tempo(falta)}</text>
      <text x="130" y="172" textAnchor="middle" fontSize="15" className="muted">para fechar</text>
    </svg>
  );
}
