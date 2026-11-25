import type { Db } from "@/db";
import { ciclo, etapa, materia, topico, volta } from "@/db/schema";
import {
  CARGA_MAXIMA_MINUTOS,
  CICLO_IMPORTADO_GRANDE,
  DIFICULDADES,
  LIMITE_DO_CICLO_IMPORTADO_BYTES,
  LIMITES_DA_SUGESTAO,
  LIMITES_DO_TOPICO,
  questoesDaProvaValidas,
  type Dificuldade,
} from "@/dominio";
import { ValidacaoError } from "./erros";
import type { Usuario } from "./usuario";

const ETAPAS_MAXIMAS = 200;
const { materiasMaximas } = LIMITES_DA_SUGESTAO;
const { nomeMaximo, importacaoMaxima: topicosMaximos } = LIMITES_DO_TOPICO;
const milhar = (n: number) => n.toLocaleString("pt-BR");

type CicloLido = {
  nome: string;
  materias: { nome: string; dificuldade: Dificuldade | null; questoesDaProva: number | null; topicos: string[] }[];
  etapas: { materia: string; cargaMinutos: number }[];
};

const objeto = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
const textoLimpo = (x: unknown) => (typeof x === "string" ? x.trim() : "");
const recusar = (mensagem: string): never => {
  throw new ValidacaoError(mensagem);
};

/**
 * Lê o arquivo de ciclo enxuto (AD-039) e recusa no primeiro problema, dizendo onde ele está (AD-043), na ordem:
 * tamanho, JSON, formato, versão, nome, listas, Matérias (com seus Tópicos) e Etapas. Chaves desconhecidas são ignoradas.
 */
export function lerCicloImportado(conteudo: string): CicloLido {
  if (Buffer.byteLength(conteudo) > LIMITE_DO_CICLO_IMPORTADO_BYTES) recusar(CICLO_IMPORTADO_GRANDE);
  let raiz: unknown;
  try {
    raiz = JSON.parse(conteudo);
  } catch {
    return recusar("O arquivo não é um JSON válido.");
  }
  if (!objeto(raiz) || raiz.formato !== "estudo-livre-ciclo") return recusar('O arquivo não é um ciclo do Estudo Livre: falta "formato": "estudo-livre-ciclo".');
  if (raiz.versao !== 1) recusar(`Versão de ciclo desconhecida: ${String(raiz.versao)}.`);
  const nome = textoLimpo(raiz.nome) || recusar('Informe o nome do ciclo em "nome".');
  if (!Array.isArray(raiz.materias)) recusar('"materias" precisa ser uma lista.');
  if (!Array.isArray(raiz.etapas)) recusar('"etapas" precisa ser uma lista.');
  const materiasBrutas = raiz.materias as unknown[];
  const etapasBrutas = raiz.etapas as unknown[];
  if (materiasBrutas.length > materiasMaximas) recusar(`O ciclo aceita até ${materiasMaximas} matérias.`);

  const vistas = new Map<string, string>();
  const materias = materiasBrutas.map((x, i) => {
    const m = objeto(x) ? x : {};
    const nomeDaMateria = textoLimpo(m.nome) || recusar(`Matéria ${i + 1}: informe o nome.`);
    if (vistas.has(nomeDaMateria.toLowerCase())) recusar(`Matéria "${nomeDaMateria}" aparece mais de uma vez.`);
    vistas.set(nomeDaMateria.toLowerCase(), nomeDaMateria);
    const onde = `Matéria "${nomeDaMateria}"`;
    const dificuldade = m.dificuldade ?? null;
    if (dificuldade !== null && !DIFICULDADES.includes(dificuldade as Dificuldade)) recusar(`${onde}: dificuldade precisa ser "facil", "media" ou "dificil".`);
    const questoesDaProva = m.questoesDaProva ?? null;
    if (questoesDaProva !== null && !questoesDaProvaValidas(questoesDaProva))
      recusar(`${onde}: questoesDaProva precisa ser um inteiro de 1 a ${milhar(LIMITES_DA_SUGESTAO.questoesMaximas)}.`);
    const topicosBrutos = m.topicos ?? [];
    if (!Array.isArray(topicosBrutos)) return recusar(`${onde}: "topicos" precisa ser uma lista.`);
    if (topicosBrutos.length > topicosMaximos) recusar(`${onde}: até ${topicosMaximos} tópicos.`);
    const topicosVistos = new Set<string>();
    const topicos = topicosBrutos.map((t, j) => {
      const limpo = textoLimpo(t);
      // Caracteres, não unidades UTF-16, como o app conta o nome do Tópico.
      if (!limpo || [...limpo].length > nomeMaximo) recusar(`${onde}, tópico ${j + 1}: precisa ser um texto de 1 a ${nomeMaximo} caracteres.`);
      if (topicosVistos.has(limpo.toLowerCase())) recusar(`${onde}: o tópico "${limpo}" aparece mais de uma vez.`);
      topicosVistos.add(limpo.toLowerCase());
      return limpo;
    });
    return { nome: nomeDaMateria, dificuldade: dificuldade as Dificuldade | null, questoesDaProva: questoesDaProva as number | null, topicos };
  });

  if (etapasBrutas.length > ETAPAS_MAXIMAS) recusar(`O ciclo aceita até ${ETAPAS_MAXIMAS} etapas.`);
  const etapas = etapasBrutas.map((x, i) => {
    const e = objeto(x) ? x : {};
    const escrita = textoLimpo(e.materia);
    const materiaDaEtapa = vistas.get(escrita.toLowerCase()) ?? recusar(`Etapa ${i + 1}: a matéria "${escrita}" não está em materias.`);
    const carga = e.cargaMinutos;
    if (!Number.isInteger(carga) || (carga as number) < 1 || (carga as number) > CARGA_MAXIMA_MINUTOS)
      recusar(`Etapa ${i + 1}: cargaMinutos precisa ser um inteiro de 1 a ${milhar(CARGA_MAXIMA_MINUTOS)}.`);
    return { materia: materiaDaEtapa, cargaMinutos: carga as number };
  });

  // O app descarta a Matéria sem Etapa e sem Tópico (AD-008); importá-la vazia não faz sentido.
  const comEtapa = new Set(etapas.map((e) => e.materia));
  for (const m of materias) if (!m.topicos.length && !comEtapa.has(m.nome)) recusar(`Matéria "${m.nome}": informe ao menos uma etapa ou um tópico.`);

  return { nome, materias, etapas };
}

/**
 * Cria um Ciclo novo a partir do arquivo enxuto (AD-039, AD-041): Volta 1 aberta, Matérias, Etapas na ordem do
 * arquivo e Tópicos não estudados, numa transação. Nunca toca os Ciclos que o Usuário já tem.
 */
export async function importarCiclo(db: Db, usuario: Usuario, conteudo: string): Promise<{ id: string }> {
  const lido = lerCicloImportado(conteudo);
  return db.transaction(async (tx) => {
    const [novo] = await tx.insert(ciclo).values({ usuarioId: usuario.id, nome: lido.nome }).returning({ id: ciclo.id });
    await tx.insert(volta).values({ cicloId: novo.id, numero: 1 });
    if (!lido.materias.length) return novo;
    const criadas = await tx
      .insert(materia)
      .values(lido.materias.map((m) => ({ cicloId: novo.id, nome: m.nome, dificuldade: m.dificuldade, questoesDaProva: m.questoesDaProva })))
      .returning({ id: materia.id, nome: materia.nome });
    const idDe = new Map(criadas.map((m) => [m.nome, m.id]));
    if (lido.etapas.length) await tx.insert(etapa).values(lido.etapas.map((e, posicao) => ({ cicloId: novo.id, materiaId: idDe.get(e.materia)!, cargaMinutos: e.cargaMinutos, posicao })));
    const topicos = lido.materias.flatMap((m) => m.topicos.map((nome, posicao) => ({ materiaId: idDe.get(m.nome)!, nome, posicao })));
    if (topicos.length) await tx.insert(topico).values(topicos);
    return novo;
  });
}
