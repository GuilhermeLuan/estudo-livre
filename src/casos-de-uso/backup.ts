import { asc, eq } from "drizzle-orm";
import { hojeEmBrasilia } from "@/dia";
import type { Db } from "@/db";
import { cartaoDeRevisao, ciclo, cronometro, etapa, logDeRevisao, materia, registroDeEstudo, topico, volta } from "@/db/schema";
import { BACKUP_GRANDE, LIMITE_DO_BACKUP_BYTES, LIMITES_DO_REGISTRO, LIMITES_DO_TOPICO, TIPOS_DE_ESTUDO, type TipoDeEstudo } from "@/dominio";
import { NOTAS, validarFaixas, type Nota } from "@/revisao";
import { ValidacaoError } from "./erros";
import { recalcularTopico } from "./revisao";
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

const INVALIDO = "O arquivo não é um backup válido do Estudo Livre.";
const POSTGRES_VIOLACAO_DE_UNICIDADE = "23505";

class Invalido extends Error {}

function exigir(condicao: unknown): asserts condicao {
  if (!condicao) throw new Invalido();
}
const objeto = (x: unknown): Record<string, unknown> => (exigir(typeof x === "object" && x !== null && !Array.isArray(x)), x as Record<string, unknown>);
const lista = (x: unknown): unknown[] => (exigir(Array.isArray(x)), x);
const texto = (x: unknown, max: number) => (exigir(typeof x === "string" && x.trim() !== "" && x.length <= max), x as string);
const textoOuNulo = (x: unknown, max: number) => (x === null ? null : (exigir(typeof x === "string" && x.length <= max), x as string));
const inteiro = (x: unknown, min: number, max = Number.MAX_SAFE_INTEGER) => (exigir(Number.isInteger(x) && (x as number) >= min && (x as number) <= max), x as number);
const inteiroOuNulo = (x: unknown, min: number, max: number) => (x === null ? null : inteiro(x, min, max));
const booleano = (x: unknown) => (exigir(typeof x === "boolean"), x as boolean);
const instante = (x: unknown) => {
  exigir(typeof x === "string" && /^\d{4}-\d{2}-\d{2}T/.test(x));
  const d = new Date(x as string);
  exigir(!Number.isNaN(d.getTime()));
  return d;
};
const instanteOuNulo = (x: unknown) => (x === null ? null : instante(x));
const nota = (x: unknown) => (x === null ? null : (exigir(NOTAS.includes(x as Nota)), x as Nota));

/** Lê o texto do arquivo e devolve os Ciclos já validados; recusa tudo o que o app não aceitaria gravar. */
function lerBackup(conteudo: string) {
  if (Buffer.byteLength(conteudo) > LIMITE_DO_BACKUP_BYTES) throw new ValidacaoError(BACKUP_GRANDE);
  let bruto: unknown;
  try {
    bruto = JSON.parse(conteudo);
  } catch {
    throw new ValidacaoError(INVALIDO);
  }
  try {
    const raiz = objeto(bruto);
    exigir(raiz.formato === "estudo-livre");
    if (raiz.versao !== 1) throw new ValidacaoError(`Versão de backup desconhecida: ${String(raiz.versao)}.`);
    return lista(raiz.ciclos).map((x) => {
      const c = objeto(x);
      const f = objeto(c.faixas);
      const faixas = { erreiAte: f.erreiAte as number, dificilAte: f.dificilAte as number, bomAte: f.bomAte as number, minimo: c.minimoDeQuestoes as number };
      exigir(validarFaixas(faixas) === null);
      const topicoDaMateria = new Map<string, string>();
      const materias = lista(c.materias).map((y) => {
        const m = objeto(y);
        const id = texto(m.id, 200);
        return {
          id,
          nome: texto(m.nome, 200),
          topicos: lista(m.topicos).map((z) => {
            const t = objeto(z);
            const topicoId = texto(t.id, 200);
            exigir(!topicoDaMateria.has(topicoId));
            topicoDaMateria.set(topicoId, id);
            return { id: topicoId, nome: texto(t.nome, LIMITES_DO_TOPICO.nomeMaximo), estudado: booleano(t.estudado), posicao: inteiro(t.posicao, 0) };
          }),
        };
      });
      const materiaIds = new Set(materias.map((m) => m.id));
      exigir(materiaIds.size === materias.length);
      const materiaDe = (x: unknown) => (exigir(materiaIds.has(x as string)), x as string);
      const topicoDe = (x: unknown) => (exigir(topicoDaMateria.has(x as string)), x as string);
      const { duracaoMaximaMinutos, questoesMaximas, anotacaoMaxima, conteudoLivreMaximo } = LIMITES_DO_REGISTRO;
      const registros = lista(c.registros).map((y) => {
        const r = objeto(y);
        const materiaId = materiaDe(r.materiaId);
        const topicoId = r.topicoId === null ? null : topicoDe(r.topicoId);
        exigir(topicoId === null || topicoDaMateria.get(topicoId) === materiaId);
        const questoes = inteiroOuNulo(r.questoes, 0, questoesMaximas);
        const acertos = inteiroOuNulo(r.acertos, 0, questoes ?? 0);
        exigir(TIPOS_DE_ESTUDO.includes(r.tipo as TipoDeEstudo));
        return {
          id: texto(r.id, 200),
          materiaId,
          topicoId,
          dataHora: instante(r.dataHora),
          duracaoMinutos: inteiro(r.duracaoMinutos, 1, duracaoMaximaMinutos),
          tipo: r.tipo as TipoDeEstudo,
          questoes,
          acertos,
          anotacao: textoOuNulo(r.anotacao, anotacaoMaxima),
          nota: nota(r.nota),
          conteudoLivre: textoOuNulo(r.conteudoLivre, conteudoLivreMaximo),
          criadoEm: instante(r.criadoEm),
        };
      });
      const registroIds = new Set(registros.map((r) => r.id));
      exigir(registroIds.size === registros.length);
      // Cartões e log vêm só para leitura (AD-031): são conferidos e depois recalculados dos Registros.
      for (const y of lista(c.cartoes)) topicoDe(objeto(y).topicoId);
      for (const y of lista(c.logDeRevisao)) {
        const l = objeto(y);
        topicoDe(l.topicoId);
        exigir(registroIds.has(l.registroId as string));
      }
      const voltas = lista(c.voltas).map((y) => {
        const v = objeto(y);
        return { numero: inteiro(v.numero, 1), inicio: instanteOuNulo(v.inicio), fim: instanteOuNulo(v.fim) };
      });
      // Todo Ciclo tem exatamente uma Volta aberta; o índice do banco só barra duas.
      exigir(voltas.filter((v) => v.fim === null).length === 1);
      return {
        nome: texto(c.nome, 200),
        criadoEm: instante(c.criadoEm),
        arquivadoEm: instanteOuNulo(c.arquivadoEm),
        faixas,
        materias,
        etapas: lista(c.etapas).map((y) => {
          const e = objeto(y);
          return { materiaId: materiaDe(e.materiaId), cargaMinutos: inteiro(e.cargaMinutos, 1), posicao: inteiro(e.posicao, 0) };
        }),
        voltas,
        registros,
      };
    });
  } catch (erro) {
    if (erro instanceof Invalido) throw new ValidacaoError(INVALIDO);
    throw erro;
  }
}

/**
 * Troca todos os Ciclos do Usuário pelos do arquivo (AD-028), numa transação: qualquer recusa ou falha deixa a conta
 * como estava. Tudo recebe id novo; os Cartões e o log são recalculados dos Registros (AD-031).
 */
export async function importarBackup(db: Db, usuario: Usuario, conteudo: string): Promise<{ ciclos: number }> {
  const ciclos = lerBackup(conteudo);
  try {
    await db.transaction(async (tx) => {
      const [rodando] = await tx.select({ u: cronometro.usuarioId }).from(cronometro).where(eq(cronometro.usuarioId, usuario.id)).for("update");
      if (rodando) throw new ValidacaoError("Pare ou descarte o cronômetro antes de importar.");
      await tx.delete(ciclo).where(eq(ciclo.usuarioId, usuario.id));
      for (const c of ciclos) {
        const [{ id: cicloId }] = await tx
          .insert(ciclo)
          .values({ usuarioId: usuario.id, nome: c.nome, criadoEm: c.criadoEm, arquivadoEm: c.arquivadoEm, faixaErreiAte: c.faixas.erreiAte, faixaDificilAte: c.faixas.dificilAte, faixaBomAte: c.faixas.bomAte, minimoDeQuestoes: c.faixas.minimo })
          .returning({ id: ciclo.id });
        const novo = new Map<string, string>();
        const novoId = (antigo: string) => {
          const id = crypto.randomUUID();
          novo.set(antigo, id);
          return id;
        };
        if (c.materias.length) await tx.insert(materia).values(c.materias.map((m) => ({ id: novoId(m.id), cicloId, nome: m.nome })));
        const topicos = c.materias.flatMap((m) => m.topicos.map((t) => ({ id: novoId(t.id), materiaId: novo.get(m.id)!, nome: t.nome, estudado: t.estudado, posicao: t.posicao })));
        if (topicos.length) await tx.insert(topico).values(topicos);
        if (c.etapas.length) await tx.insert(etapa).values(c.etapas.map((e) => ({ cicloId, materiaId: novo.get(e.materiaId)!, cargaMinutos: e.cargaMinutos, posicao: e.posicao })));
        if (c.voltas.length) await tx.insert(volta).values(c.voltas.map((v) => ({ cicloId, ...v })));
        if (c.registros.length)
          await tx.insert(registroDeEstudo).values(c.registros.map((r) => ({ ...r, id: undefined, materiaId: novo.get(r.materiaId)!, topicoId: r.topicoId && novo.get(r.topicoId)! })));
        for (const topicoId of new Set(c.registros.flatMap((r) => (r.topicoId ? [novo.get(r.topicoId)!] : [])))) await recalcularTopico(tx, topicoId);
      }
    });
  } catch (erro) {
    if ((erro as { cause?: { code?: string } }).cause?.code === POSTGRES_VIOLACAO_DE_UNICIDADE) throw new ValidacaoError(INVALIDO);
    throw erro;
  }
  return { ciclos: ciclos.length };
}
