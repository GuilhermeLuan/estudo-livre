import type { TipoDeEstudo } from "@/dominio";

/** Campo que liga o formulário de registro ao Cronômetro: presente, o registro consome o Cronômetro ao salvar. */
export const CAMPO_CRONOMETRO = "cronometro";

export type ModoDoConteudo = "topico" | "livre" | "nenhum";

/** O que o segmento "Conteúdo" do formulário grava: só o campo do segmento escolhido vale. */
export function conteudoDoRegistro(modo: string, { topicoId, conteudoLivre }: { topicoId: string; conteudoLivre: string }): { topicoId: string | null; conteudoLivre: string } | { erro: string } {
  if (modo === "topico") return topicoId ? { topicoId, conteudoLivre: "" } : { erro: "Escolha um tópico." };
  if (modo === "livre") return { topicoId: null, conteudoLivre };
  return { topicoId: null, conteudoLivre: "" };
}

function texto(dados: FormData, campo: string) {
  return String(dados.get(campo) ?? "").trim();
}

function inteiroOpcional(dados: FormData, campo: string) {
  const bruto = texto(dados, campo);
  return bruto === "" ? null : Number(bruto);
}

/** Os campos do formulário de registro (o mesmo para registrar e editar) como o caso de uso os recebe. */
export function lerFormularioDeRegistro(dados: FormData) {
  const conteudo = conteudoDoRegistro(texto(dados, "conteudo"), { topicoId: texto(dados, "topicoId"), conteudoLivre: texto(dados, "conteudoLivre") });
  if ("erro" in conteudo) return { erro: conteudo.erro };
  return {
    materiaId: texto(dados, "materiaId"),
    estudo: {
      tipo: texto(dados, "tipo") as TipoDeEstudo, // o caso de uso rejeita o que não for um tipo válido
      duracaoMinutos: Number(texto(dados, "horas") || 0) * 60 + Number(texto(dados, "minutos") || 0),
      dia: texto(dados, "data"),
      questoes: inteiroOpcional(dados, "questoes"),
      acertos: inteiroOpcional(dados, "acertos"),
      anotacao: texto(dados, "anotacao"),
      ...conteudo,
    },
  };
}
