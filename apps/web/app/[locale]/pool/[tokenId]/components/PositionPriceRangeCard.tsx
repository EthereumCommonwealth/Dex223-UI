import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { formatNumber } from "@/functions/formatFloat";
import { Currency } from "@/sdk_hybrid/entities/currency";

export default function PositionPriceRangeCard({
  price,
  token0,
  token1,
  showFirst,
  isMax = false,
  className,
}: {
  price?: string;
  token0: Currency | undefined;
  token1: Currency | undefined;
  showFirst: boolean;
  isMax?: boolean;
  className?: string;
}) {
  const t = useTranslations("Liquidity");
  // TODO check if correct
  const symbol = useMemo(() => {
    if (isMax) {
      return showFirst ? token0?.symbol : token1?.symbol;
    }

    return showFirst ? token1?.symbol : token0?.symbol;
  }, [isMax, showFirst, token0?.symbol, token1?.symbol]);

  const val = formatNumber(price || "0", 10);

  return (
    <div className="rounded-3 overflow-hidden flex-grow">
      <div
        className={clsx(
          "py-2 lg:py-3 px-2 lg:px-5 flex items-center flex-col justify-center ",
          className ? className : "bg-tertiary-bg",
        )}
      >
        <div className="text-12 lg:text-14 text-secondary-text">{isMax ? "Max" : "Min"} price</div>
        <div className="text-16 lg:text-18">{val}</div>
        <div className="text-12 lg:text-14 text-tertiary-text">
          {showFirst
            ? `${token0?.symbol} per ${token1?.symbol}`
            : `${token1?.symbol} per ${token0?.symbol}`}
        </div>
      </div>
      <div className="lg:min-h-[50%] min-h-[50%] flex-grow overflow-hidden text-12 lg:text-14 bg-quaternary-bg py-2 lg:py-3 px-2 lg:px-5 border-t-2 border-tertiary-bg text-tertiary-text text-center">
        {t("position_100_price", { symbol })}
      </div>
    </div>
  );
}
