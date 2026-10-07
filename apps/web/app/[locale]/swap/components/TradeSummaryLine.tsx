import clsx from "clsx";
import { useTranslations } from "next-intl";

import { TokenTrade } from "@/app/[locale]/swap/hooks/useTrade";
import { formatFloat } from "@/functions/formatFloat";

// Under the swap button: price impact coloured by severity (under 1%, 1-3%, above 3%) and
// the slippage the trade will accept, so neither hides inside the collapsed details.
export default function TradeSummaryLine({
  trade,
  slippage,
}: {
  trade: TokenTrade;
  slippage: number | string;
}) {
  const t = useTranslations("Swap");
  const impact = parseFloat(trade.priceImpact.toSignificant());

  return (
    <p className="flex justify-center gap-2 mt-3 text-12 text-tertiary-text">
      <span>
        {t("price_impact")}{" "}
        <span
          className={clsx(
            impact < 1 ? "text-green" : impact <= 3 ? "text-yellow-light" : "text-red-light",
          )}
        >
          {formatFloat(impact)}%
        </span>
      </span>
      <span aria-hidden>·</span>
      <span>
        {t("maximum_slippage")} {slippage}%
      </span>
    </p>
  );
}
