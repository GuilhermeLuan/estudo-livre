import { FUSO, hojeEmBrasilia } from "@/dia";

/** Minutos como 1h30, 2h, 45min, 0h. */
export function tempo(minutos: number) {
  const m = Math.round(minutos);
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h && r) return `${h}h${String(r).padStart(2, "0")}`;
  if (h) return `${h}h`;
  return r ? `${r}min` : "0h";
}

/** Minutos sempre com horas e minutos, como nas barras de progresso: 1h10, 2h00, 0h00. */
export function tempoHM(minutos: number) {
  const m = Math.round(minutos);
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;
}

/** "1 matéria" / "3 matérias". */
export function quantidade(n: number, singular: string, plural: string) {
  return `${n} ${n === 1 ? singular : plural}`;
}

/** "2026-09-28" -> "28/09", como no rótulo das semanas. */
export function diaMes(dia: string) {
  const [, mes, diaDoMes] = dia.split("-");
  return `${diaDoMes}/${mes}`;
}

/** "+12%" ou "−50%" (sinal de menos tipográfico). */
export const rotuloDaVariacao = (percentual: number) => `${percentual < 0 ? "−" : "+"}${Math.abs(percentual)}%`;

/** "+25min" ou "−1h10". */
export const rotuloDaDiferenca = (minutos: number) => `${minutos < 0 ? "−" : "+"}${tempo(Math.abs(minutos))}`;

/** A linha de início da Volta (AD-005): só da Volta 2 em diante há data. */
export function descricaoDaVolta(numero: number, inicio: Date | null, agora = new Date()) {
  if (numero === 1 || !inicio) return "Primeira volta";
  const dia = (d: Date) => hojeEmBrasilia(d);
  const dias = Math.round((Date.parse(dia(agora)) - Date.parse(dia(inicio))) / 86_400_000);
  const data = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, day: "numeric", month: "long" }).format(inicio);
  return `Iniciada em ${data} · ${dias === 0 ? "hoje" : `há ${quantidade(dias, "dia", "dias")}`}`;
}

/** Dias de calendário, em Brasília, entre dois instantes. */
const diasEntre = (de: Date, ate: Date) => Math.round((Date.parse(hojeEmBrasilia(ate)) - Date.parse(hojeEmBrasilia(de))) / 86_400_000);

/** A data de uma Volta no histórico: 02/11/2026, no dia de Brasília. */
export function dataDaVolta(data: Date) {
  const [ano, mes, dia] = hojeEmBrasilia(data).split("-");
  return `${dia}/${mes}/${ano}`;
}

/** A Duração de uma Volta no histórico: "Mesmo dia", "1 dia", "N dias"; a Volta aberta (`fim` nulo) conta até `agora`. */
export function duracaoDaVolta(inicio: Date, fim: Date | null, agora = new Date()) {
  const dias = diasEntre(inicio, fim ?? agora);
  return dias === 0 ? "Mesmo dia" : quantidade(dias, "dia", "dias");
}

/** O aviso quando uma mudança de Etapa fecha a Volta (AD-018). */
export const avisoDaVoltaConcluida = (numero: number) => `Volta ${numero} concluída. A Volta ${numero + 1} começou.`;

/** A Situação de uma Etapa: o chip da linha. `extraMinutos` são as horas extras da Matéria dela. */
export function situacaoDaEtapa(etapa: { cargaMinutos: number; feitoMinutos: number }, { proxima, extraMinutos }: { proxima: boolean; extraMinutos: number }) {
  if (etapa.feitoMinutos >= etapa.cargaMinutos) return extraMinutos > 0 ? `+${tempo(extraMinutos)} extra` : "Concluída";
  if (proxima) return "Próxima etapa";
  return etapa.feitoMinutos > 0 ? "Em andamento" : "Não iniciada";
}

/** O aviso depois de importar Tópicos: "2 importados, 2 ignorados." */
export function avisoDaImportacao(importados: number, ignorados: number) {
  return `${importados} ${importados === 1 ? "importado" : "importados"}, ${ignorados} ${ignorados === 1 ? "ignorado" : "ignorados"}.`;
}

/** O texto da próxima revisão de um Tópico: "Próxima revisão: 30/11/2026" ou "Sem revisão agendada". */
export function textoDaProximaRevisao(dia: string | null) {
  if (!dia) return "Sem revisão agendada";
  const [ano, mes, diaDoMes] = dia.split("-");
  return `Próxima revisão: ${diaDoMes}/${mes}/${ano}`;
}
