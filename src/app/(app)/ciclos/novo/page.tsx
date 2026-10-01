import { novoCiclo } from "@/app/acoes-ciclos";
import { FormularioNome } from "@/app/formulario-ciclo";

export default function NovoCiclo() {
  return (
    <section aria-labelledby="h-novo" className="grid max-w-[480px] gap-4">
      <h1 id="h-novo">Novo ciclo</h1>
      <div className="panel">
        <FormularioNome acao={novoCiclo} botao="Criar ciclo" rotuloNome="Nome do ciclo" />
      </div>
    </section>
  );
}
