import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { importarCiclo, obterCiclo } from "@/casos-de-uso";
import { ciclo } from "@/db/schema";
import { bancoDeTeste, cadastrar, limparBanco } from "./apoio";

const db = bancoDeTeste();
beforeEach(() => limparBanco(db));
afterAll(() => db.$client.end());

const doc = readFileSync(new URL("../docs/importar-ciclo-com-ia.md", import.meta.url), "utf8");
const blocosJson = [...doc.matchAll(/```json\n([\s\S]*?)```/g)].map((m) => m[1]);

describe("instruções para a IA", () => {
  it("tem as seções que a IA precisa", () => {
    const titulos = [...doc.matchAll(/^##+ (.+)$/gm)].map((m) => m[1].trim());
    expect(titulos).toEqual(expect.arrayContaining(["Objetivo", "Vocabulário", "Formato do arquivo", "Regras que fazem o app recusar o arquivo", "Como repartir a carga em Etapas", "Como responder", "Exemplo completo", "Prompt para colar na conversa"]));
    // Cada campo do formato aparece no esquema.
    for (const campo of ["formato", "versao", "nome", "materias", "dificuldade", "questoesDaProva", "topicos", "etapas", "materia", "cargaMinutos"]) expect(doc).toContain(`\`${campo}\``);
    for (const termo of ["Ciclo", "Matéria", "Etapa", "Tópico", "Carga horária", "Dificuldade", "Questões da prova"]) expect(doc).toContain(`**${termo}**`);
    expect(doc).toMatch(/responda (somente|só|apenas) com o JSON/i);
  });

  it("o exemplo importa sem erro", async () => {
    expect(blocosJson).toHaveLength(1);
    const usuario = await cadastrar(db, "ana@exemplo.com");
    const { id } = await importarCiclo(db, usuario, blocosJson[0]);
    const exemplo = JSON.parse(blocosJson[0]);
    const detalhe = await obterCiclo(db, usuario, id);
    expect(detalhe.nome).toBe(exemplo.nome);
    expect(detalhe.etapas.map((e) => e.cargaMinutos)).toEqual(exemplo.etapas.map((e: { cargaMinutos: number }) => e.cargaMinutos));
    expect(await db.select().from(ciclo).where(eq(ciclo.usuarioId, usuario.id))).toHaveLength(1);
  });
});
