// Reconstrói os Cartões de revisão dos Tópicos que já têm Registros e ainda não têm Cartão (AD-021). Idempotente.
// O Node 22 remove os tipos de `src/revisao.ts` ao importá-lo, por isso ele só importa `ts-fsrs`.
import { recalcularCartao } from "../src/revisao.ts";

export async function reconstruirCartoes(pool) {
  const { rows: topicos } = await pool.query(`
    select t.id from topico t
    where exists (select 1 from registro_de_estudo r where r.topico_id = t.id)
      and not exists (select 1 from cartao_de_revisao c where c.topico_id = t.id)`);

  for (const { id: topicoId } of topicos) {
    const { rows: registros } = await pool.query(
      `select id, nota, data_hora from registro_de_estudo
       where topico_id = $1 and nota is not null order by data_hora, criado_em, id`,
      [topicoId],
    );
    const { proximaRevisao, estado, log } = recalcularCartao(registros.map((r) => ({ nota: r.nota, revisadoEm: r.data_hora })));
    const cliente = await pool.connect();
    try {
      await cliente.query("begin");
      await cliente.query(`insert into cartao_de_revisao (topico_id, proxima_revisao, estado) values ($1, $2, $3)`, [
        topicoId, proximaRevisao, estado && JSON.stringify(estado),
      ]);
      for (const [i, item] of log.entries()) {
        await cliente.query(
          `insert into log_de_revisao (id, topico_id, registro_id, nota, revisado_em, antes, depois) values ($1, $2, $3, $4, $5, $6, $7)`,
          [crypto.randomUUID(), topicoId, registros[i].id, item.nota, item.revisadoEm, JSON.stringify(item.antes), JSON.stringify(item.depois)],
        );
      }
      await cliente.query("commit");
    } catch (erro) {
      await cliente.query("rollback");
      throw erro;
    } finally {
      cliente.release();
    }
  }
}
