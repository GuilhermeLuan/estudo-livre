import { RiAddLine, RiCalendarLine, RiCheckboxCircleFill, RiTimeLine } from "@remixicon/react";
import { AcoesDaHoje } from "@/app/acoes-da-hoje";
import { CartaoDeIndicador } from "@/app/cartao-de-indicador";
import { CartaoDoCiclo } from "@/app/cartao-do-ciclo";
import { CartaoDoCronometro } from "@/app/cronometro";
import { rotuloDaDiferenca, rotuloDaVariacao, tempo } from "@/app/formato";
import { obterHome } from "@/casos-de-uso";
import { ButtonLink } from "@/components/base/buttons/button";
import { obterDb } from "@/db";
import { exigirUsuario } from "@/sessao";

export const dynamic = "force-dynamic";

function hojePorExtenso() {
  const data = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", day: "numeric", month: "long" }).format(new Date());
  return data.charAt(0).toUpperCase() + data.slice(1);
}

export default async function Hoje() {
  const home = await obterHome(obterDb(), await exigirUsuario());
  const { indicadores: i, ciclos } = home;
  return (
    <section aria-labelledby="h-hoje" className="grid gap-5 lg:gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 id="h-hoje" className="text-title-1-medium text-text-primary max-lg:sr-only">
            Hoje
          </h1>
          <p className="text-body-regular text-text-secondary">{hojePorExtenso()}</p>
        </div>
        {ciclos.length > 0 && <AcoesDaHoje proxima={ciclos[0].proxima} />}
      </div>

      <div className="empty:hidden lg:hidden">
        <CartaoDoCronometro variante="grande" />
      </div>

      {ciclos.length === 0 ? (
        <div className="grid justify-items-start gap-3 rounded-3xl bg-background-secondary-default p-6">
          <h2 className="text-title-3-medium text-text-primary">Nenhum ciclo ainda</h2>
          <p className="text-body-regular text-text-secondary">Crie um ciclo para o seu concurso e adicione as matérias com a carga horária de cada uma.</p>
          <ButtonLink href="/ciclos/novo">Criar ciclo</ButtonLink>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 lg:gap-4">
            <CartaoDeIndicador
              compacto
              icone={RiTimeLine}
              rotulo="Estudado hoje"
              rotuloCurto="Hoje"
              valor={tempo(i.hojeMinutos)}
              chip={i.diferencaHojeMinutos === null ? null : { texto: rotuloDaDiferenca(i.diferencaHojeMinutos), cor: i.diferencaHojeMinutos > 0 ? "lime" : "rose" }}
            />
            <CartaoDeIndicador
              compacto
              icone={RiCheckboxCircleFill}
              rotulo="Questões hoje"
              rotuloCurto="Questões"
              valor={String(i.questoesHoje)}
              chip={i.acertoHoje === null ? null : { texto: `${i.acertoHoje}% de acerto`, cor: "blue" }}
            />
            <CartaoDeIndicador
              compacto
              icone={RiCalendarLine}
              rotulo="Nesta semana"
              rotuloCurto="Semana"
              valor={tempo(i.semanaMinutos)}
              chip={i.variacaoSemana === null ? null : { texto: rotuloDaVariacao(i.variacaoSemana), cor: i.variacaoSemana >= 0 ? "lime" : "rose" }}
            />
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-body-medium text-text-primary lg:text-title-3-medium">
                <span className="lg:hidden">Próximas etapas</span>
                <span className="max-lg:hidden">Ciclos ativos</span>
              </h2>
              <span className="text-body-regular text-text-secondary lg:hidden">{ciclos.length === 1 ? "1 ciclo" : `${ciclos.length} ciclos`}</span>
              <ButtonLink href="/ciclos/novo" variant="secondary" leadingIcon={RiAddLine} className="max-lg:hidden">
                Novo ciclo
              </ButtonLink>
            </div>
            {ciclos.map((c) => (
              <CartaoDoCiclo key={c.id} ciclo={c} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
