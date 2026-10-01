// O fuso do estudo é fixo: Brasília (sem horário de verão desde 2019, então o offset é -03:00).
export const FUSO = "America/Sao_Paulo";

/** O dia de `agora` em Brasília, no formato AAAA-MM-DD. */
export function hojeEmBrasilia(agora = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }).format(agora);
}

/** O dia (AAAA-MM-DD) `dias` dias depois (ou antes, se negativo) do dia informado. */
export function somarDias(dia: string, dias: number) {
  const data = new Date(`${dia}T00:00:00Z`);
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}

/** A segunda-feira (AAAA-MM-DD) da semana do dia informado: as semanas vão de segunda a domingo. */
export function segundaDaSemana(dia: string) {
  const diaDaSemana = new Date(`${dia}T00:00:00Z`).getUTCDay(); // 0 = domingo
  return somarDias(dia, -((diaDaSemana + 6) % 7));
}
