// O fuso do estudo é fixo: Brasília (sem horário de verão desde 2019, então o offset é -03:00).
export const FUSO = "America/Sao_Paulo";

/** O dia de `agora` em Brasília, no formato AAAA-MM-DD. */
export function hojeEmBrasilia(agora = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }).format(agora);
}
