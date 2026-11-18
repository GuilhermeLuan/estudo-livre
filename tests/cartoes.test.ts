import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { adicionarEtapa, criarCiclo, criarTopico, obterCartao, recalcularTopico } from "@/casos-de-uso";
import { logDeRevisao, registroDeEstudo } from "@/db/schema";
import { recalcularCartao, type Nota } from "@/revisao";
import { bancoDeTeste, cadastrar, limparBanco } from "./apoio";

const db = bancoDeTeste();
beforeEach(() => limparBanco(db));
afterAll(() => db.$client.end());

const meioDia = (dia: string) => new Date(`${dia}T12:00:00-03:00`);

/** Um Usuário com um Ciclo, uma Matéria e um Tópico. */
async function cenario(email = "ana@exemplo.com") {
  const usuario = await cadastrar(db, email);
  const { id: cicloId } = await criarCiclo(db, usuario, { nome: "TRF" });
  const { materiaId } = await adicionarEtapa(db, usuario, cicloId, { nome: "Português", cargaMinutos: 600 });
  const { id: topicoId } = await criarTopico(db, usuario, materiaId, { nome: "Crase" });
  return { usuario, cicloId, materiaId, topicoId };
}

async function inserir(materiaId: string, topicoId: string | null, dia: string, nota: Nota | null, extra: Partial<typeof registroDeEstudo.$inferInsert> = {}) {
  const [{ id }] = await db
    .insert(registroDeEstudo)
    .values({ materiaId, topicoId, dataHora: meioDia(dia), duracaoMinutos: 30, tipo: "Teoria", questoes: nota ? 10 : null, nota, ...extra })
    .returning({ id: registroDeEstudo.id });
  return id;
}

describe("recalcularTopico", () => {
  it("refaz o Cartão dos Registros com nota, em ordem cronológica e desempate por criação", async () => {
    const { usuario, materiaId, topicoId } = await cenario();
    await inserir(materiaId, topicoId, "2026-05-10", "Fácil");
    await inserir(materiaId, topicoId, "2026-05-01", "Bom");
    await inserir(materiaId, topicoId, "2026-05-10", "Errei"); // mesmo instante: vem depois do Fácil (criadoEm)
    await db.transaction((tx) => recalcularTopico(tx, topicoId));

    const esperado = recalcularCartao([
      { nota: "Bom", revisadoEm: meioDia("2026-05-01") },
      { nota: "Fácil", revisadoEm: meioDia("2026-05-10") },
      { nota: "Errei", revisadoEm: meioDia("2026-05-10") },
    ]);
    const cartao = await obterCartao(db, usuario, topicoId);
    expect(cartao?.proximaRevisao).toEqual(esperado.proximaRevisao);
    expect(cartao?.estado).toEqual(JSON.parse(JSON.stringify(esperado.estado)));
    const log = await db.select().from(logDeRevisao).where(eq(logDeRevisao.topicoId, topicoId)).orderBy(logDeRevisao.revisadoEm);
    expect(log.map((l) => l.nota)).toEqual(["Bom", "Fácil", "Errei"]);
  });

  it("com Registros e nenhuma nota o Cartão é vazio; sem Registros não há Cartão nem log", async () => {
    const { usuario, materiaId, topicoId } = await cenario();
    await db.transaction((tx) => recalcularTopico(tx, topicoId));
    expect(await obterCartao(db, usuario, topicoId)).toBeNull();

    await inserir(materiaId, topicoId, "2026-05-01", null);
    await db.transaction((tx) => recalcularTopico(tx, topicoId));
    expect(await obterCartao(db, usuario, topicoId)).toEqual({ proximaRevisao: null, estado: null });
    expect(await db.select().from(logDeRevisao)).toEqual([]);
  });
});
