import type { RemixiconComponentType } from "@remixicon/react";
import { Chip, type ChipColor } from "@/components/base/badges/chip";
import { cx } from "@/utils/cx";

/**
 * Um indicador do Figma (StatCard): ícone, rótulo, valor e chip. Com `compacto`, abaixo de 1024px vira o
 * cartão pequeno do celular na Hoje: só o rótulo curto e o valor.
 */
export function CartaoDeIndicador({
  icone: Icone,
  rotulo,
  rotuloCurto,
  valor,
  chip,
  compacto,
}: {
  icone: RemixiconComponentType;
  rotulo: string;
  rotuloCurto?: string;
  valor: string;
  chip?: { texto: string; cor: ChipColor } | null;
  compacto?: boolean;
}) {
  return (
    <div className={cx("grid content-start gap-3 rounded-3xl bg-background-secondary-default p-4", compacto && "max-lg:gap-1 max-lg:rounded-2xl max-lg:p-3")}>
      <span className={cx("grid size-8 place-items-center rounded-lg bg-background-primary-default shadow-xs", compacto && "max-lg:hidden")}>
        <Icone className="size-5 text-foreground-icon-primary" aria-hidden />
      </span>
      {compacto && <span className="text-caption-1-regular text-text-secondary lg:hidden">{rotuloCurto}</span>}
      <span className={cx("text-body-regular text-text-secondary", compacto && "max-lg:hidden")}>{rotulo}</span>
      <div className="flex flex-wrap items-center gap-2">
        <span className={cx("text-title-1-medium text-text-primary", compacto && "max-lg:text-title-3-medium")}>{valor}</span>
        {chip && (
          <Chip variant="caption" color={chip.cor} className={cx(compacto && "max-lg:hidden")}>
            {chip.texto}
          </Chip>
        )}
      </div>
    </div>
  );
}
