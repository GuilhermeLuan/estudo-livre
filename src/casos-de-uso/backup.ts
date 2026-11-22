import { asc, eq } from "drizzle-orm";
import { hojeEmBrasilia } from "@/dia";
import type { Db } from "@/db";
import { cartaoDeRevisao, ciclo, etapa, logDeRevisao, materia, registroDeEstudo, topico, volta } from "@/db/schema";
import type { Usuario } from "./usuario";

const iso = (d: Date | null) => (d ? d.toISOString() : null);

export type Backup = Awaited<ReturnType<typeof exportarBackup>>;

/** O arquivo `estudo-livre-backup-AAAA-MM-DD.json` com o dia de `agora` em Brasília. */
export function nomeDoArquivoDeBackup(agora = new Date()) {
  return `estudo-livre-backup-${hojeEmBrasilia(agora)}.json`;
}

/**
 * Todos os Ciclos do Usuário, ativos e arquivados, com o que pende deles. Os ids só ligam as partes do arquivo;
 * a ordem é fixa para que duas exportações do mesmo estado saiam iguais. Fica fora o que é da conta (e-mail, nome,
 * Admin, sessões) e o Cronômetro.
 */
export async function exportarBackup(db: Db, usuario: Usuario, agora = new Date()) {
  return db.transaction(
    async (tx) => {
      const ciclos = await tx.select().from(ciclo).where(eq(ciclo.usuarioId, usuario.id)).orderBy(asc(ciclo.criadoEm), asc(ciclo.id));
      const doUsuario = eq(ciclo.usuarioId, usuario.id);
      // shortcut: Registros empatados em dataHora e criadoEm trocam de ordem após importar (ids novos); raro, desempatar se aparecer.
      const materias = await tx.select({ m: materia }).from(materia).innerJoin(ciclo, eq(ciclo.id, materia.cicloId)).where(doUsuario).orderBy(asc(materia.nome));
      const etapas = await tx.select({ e: etapa }).from(etapa).innerJoin(ciclo, eq(ciclo.id, etapa.cicloId)).where(doUsuario).orderBy(asc(etapa.posicao));
      const voltas = await tx.select({ v: volta }).from(volta).innerJoin(ciclo, eq(ciclo.id, volta.cicloId)).where(doUsuario).orderBy(asc(volta.numero));
      const topicos = await tx.select({ t: topico, cicloId: materia.cicloId }).from(topico).innerJoin(materia, eq(materia.id, topico.materiaId)).innerJoin(ciclo, eq(ciclo.id, materia.cicloId)).where(doUsuario).orderBy(asc(materia.nome), asc(topico.posicao));
      const registros = await tx.select({ r: registroDeEstudo, cicloId: materia.cicloId }).from(registroDeEstudo).innerJoin(materia, eq(materia.id, registroDeEstudo.materiaId)).innerJoin(ciclo, eq(ciclo.id, materia.cicloId)).where(doUsuario).orderBy(asc(registroDeEstudo.dataHora), asc(registroDeEstudo.criadoEm), asc(registroDeEstudo.id));
      const cartoes = await tx
            .select({ c: cartaoDeRevisao, cicloId: materia.cicloId })
            .from(cartaoDeRevisao)
            .innerJoin(topico, eq(topico.id, cartaoDeRevisao.topicoId))
            .innerJoin(materia, eq(materia.id, topico.materiaId))
            .innerJoin(ciclo, eq(ciclo.id, materia.cicloId)).where(doUsuario).orderBy(asc(materia.nome), asc(topico.posicao));
      const logs = await tx
            .select({ l: logDeRevisao, cicloId: materia.cicloId })
            .from(logDeRevisao)
            .innerJoin(topico, eq(topico.id, logDeRevisao.topicoId))
            .innerJoin(materia, eq(materia.id, topico.materiaId))
            .innerJoin(ciclo, eq(ciclo.id, materia.cicloId)).where(doUsuario).orderBy(asc(materia.nome), asc(topico.posicao), asc(logDeRevisao.revisadoEm));
      return {
        formato: "estudo-livre" as const,
        versao: 1 as const,
        exportadoEm: agora.toISOString(),
        ciclos: ciclos.map((c) => ({
          nome: c.nome,
          criadoEm: c.criadoEm.toISOString(),
          arquivadoEm: iso(c.arquivadoEm),
          faixas: { erreiAte: c.faixaErreiAte, dificilAte: c.faixaDificilAte, bomAte: c.faixaBomAte },
          minimoDeQuestoes: c.minimoDeQuestoes,
          materias: materias
            .filter(({ m }) => m.cicloId === c.id)
            .map(({ m }) => ({
              id: m.id,
              nome: m.nome,
              topicos: topicos.filter(({ t }) => t.materiaId === m.id).map(({ t }) => ({ id: t.id, nome: t.nome, estudado: t.estudado, posicao: t.posicao })),
            })),
          etapas: etapas.filter(({ e }) => e.cicloId === c.id).map(({ e }) => ({ materiaId: e.materiaId, cargaMinutos: e.cargaMinutos, posicao: e.posicao })),
          voltas: voltas.filter(({ v }) => v.cicloId === c.id).map(({ v }) => ({ numero: v.numero, inicio: iso(v.inicio), fim: iso(v.fim) })),
          registros: registros
            .filter((r) => r.cicloId === c.id)
            .map(({ r }) => ({
              id: r.id,
              materiaId: r.materiaId,
              topicoId: r.topicoId,
              dataHora: r.dataHora.toISOString(),
              duracaoMinutos: r.duracaoMinutos,
              tipo: r.tipo,
              questoes: r.questoes,
              acertos: r.acertos,
              anotacao: r.anotacao,
              nota: r.nota,
              conteudoLivre: r.conteudoLivre,
              criadoEm: r.criadoEm.toISOString(),
            })),
          cartoes: cartoes.filter((x) => x.cicloId === c.id).map(({ c: k }) => ({ topicoId: k.topicoId, proximaRevisao: iso(k.proximaRevisao), estado: k.estado })),
          logDeRevisao: logs
            .filter((x) => x.cicloId === c.id)
            .map(({ l }) => ({ topicoId: l.topicoId, registroId: l.registroId, nota: l.nota, revisadoEm: l.revisadoEm.toISOString(), antes: l.antes, depois: l.depois })),
        })),
      };
    },
    { isolationLevel: "repeatable read", accessMode: "read only" },
  );
}
