import { BarraDeAbas, CabecalhoMovel, FaixaMovelDoCronometro, Sidebar } from "@/app/navegacao";
import { ProvedorDoCronometro } from "@/app/cronometro";
import { contarRevisoesVencidas, listarFaixasDosCiclos, listarTopicosDasMaterias, obterCronometro, obterHome } from "@/casos-de-uso";
import { obterDb } from "@/db";
import { exigirUsuario } from "@/sessao";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const usuarioLogado = await exigirUsuario();
  const [{ usuario, ciclos, arquivados }, ativo, topicos, faixasDosCiclos, revisoes] = await Promise.all([
    obterHome(obterDb(), usuarioLogado),
    obterCronometro(obterDb(), usuarioLogado),
    listarTopicosDasMaterias(obterDb(), usuarioLogado),
    listarFaixasDosCiclos(obterDb(), usuarioLogado),
    contarRevisoesVencidas(obterDb(), usuarioLogado),
  ]);
  const paraRegistro = (c: { id: string; nome: string; materias: { id: string; nome: string }[] }) => {
    const { minimo, ...faixas } = faixasDosCiclos.get(c.id)!;
    return c.materias.map((m) => ({ id: m.id, nome: m.nome, ciclo: c.nome, faixas, minimo, topicos: topicos.get(m.id) ?? [] }));
  };
  const materias = ciclos.flatMap(paraRegistro);
  const materiasArquivadas = arquivados.flatMap(paraRegistro);
  const menu = { usuario, ciclos: ciclos.map((c) => ({ id: c.id, nome: c.nome })), arquivados: arquivados.length, revisoes };
  return (
    <ProvedorDoCronometro ativo={ativo} materias={materias} materiasArquivadas={materiasArquivadas} materiaPadrao={ciclos[0]?.proxima?.materiaId ?? materias[0]?.id ?? ""}>
      <Sidebar {...menu} />
      <CabecalhoMovel {...menu} />
      <main className="mx-auto max-w-[1160px] px-4 pt-2 pb-40 lg:ml-[284px] lg:px-6 lg:pt-8 lg:pb-12">{children}</main>
      <FaixaMovelDoCronometro />
      <BarraDeAbas />
    </ProvedorDoCronometro>
  );
}
