/** Campo que liga o formulário de registro ao Cronômetro: presente, o registro consome o Cronômetro ao salvar. */
export const CAMPO_CRONOMETRO = "cronometro";

export type ModoDoConteudo = "topico" | "livre" | "nenhum";

/** O que o segmento "Conteúdo" do formulário grava: só o campo do segmento escolhido vale. */
export function conteudoDoRegistro(modo: string, { topicoId, conteudoLivre }: { topicoId: string; conteudoLivre: string }): { topicoId: string | null; conteudoLivre: string } | { erro: string } {
  if (modo === "topico") return topicoId ? { topicoId, conteudoLivre: "" } : { erro: "Escolha um tópico." };
  if (modo === "livre") return { topicoId: null, conteudoLivre };
  return { topicoId: null, conteudoLivre: "" };
}
