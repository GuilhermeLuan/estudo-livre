/** Minutos no formato do protótipo: 1h30, 2h, 45min, 0h. */
export function tempo(minutos: number) {
  const m = Math.round(minutos);
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h && r) return `${h}h${String(r).padStart(2, "0")}`;
  if (h) return `${h}h`;
  return r ? `${r}min` : "0h";
}

/** "1 matéria" / "3 matérias". */
export function quantidade(n: number, singular: string, plural: string) {
  return `${n} ${n === 1 ? singular : plural}`;
}

/** "2026-09-28" -> "28/9", como no rótulo das semanas do protótipo. */
export function diaMes(dia: string) {
  const [, mes, diaDoMes] = dia.split("-");
  return `${Number(diaDoMes)}/${Number(mes)}`;
}
