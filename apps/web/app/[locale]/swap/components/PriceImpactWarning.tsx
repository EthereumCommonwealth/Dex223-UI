import Alert from "@repo/ui/alert";
import { useTranslations } from "next-intl";

import { formatFloat } from "@/functions/formatFloat";
import { Trade } from "@/sdk_bi/entities/trade";

// Same thresholds most DEX interfaces use: warn from 5%, show an error from 15%.
const HIGH_PRICE_IMPACT = 5;
const VERY_HIGH_PRICE_IMPACT = 15;

export default function PriceImpactWarning({
  trade,
  className,
}: {
  trade: Trade<any, any, any> | null | undefined;
  className?: string;
}) {
  const t = useTranslations("Swap");

  if (!trade) {
    return null;
  }

  // Same formatting as the "Price impact" row in the swap details, so both show the same number.
  const impact = trade.priceImpact.toSignificant();

  if (+impact < HIGH_PRICE_IMPACT) {
    return null;
  }

  const isVeryHigh = +impact >= VERY_HIGH_PRICE_IMPACT;

  return (
    <div className={className}>
      <Alert
        type={isVeryHigh ? "error" : "warning"}
        text={t(isVeryHigh ? "very_high_price_impact_warning" : "high_price_impact_warning", {
          impact: formatFloat(impact),
        })}
      />
    </div>
  );
}
