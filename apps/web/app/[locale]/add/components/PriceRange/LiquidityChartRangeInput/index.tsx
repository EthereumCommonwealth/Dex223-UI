import Alert from "@repo/ui/alert";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Bound } from "@/app/[locale]/add/components/PriceRange/LiquidityChartRangeInput/types";
import { ZOOM_LEVELS } from "@/app/[locale]/add/hooks/types";
import { FeeAmount } from "@/sdk_bi/constants";

import { Chart } from "./Chart";
import { formatDelta, useDensityChartData } from "./hooks";

function parseFloatWithDefault(value: string | number | undefined, fallback = 0): number {
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? fallback : parsed;
}

const ChartWrapper = ({ children, ...props }: any) => (
  <div
    className="relative w-full lg:h-auto md:h-[300px] h-[200px] justify-center items-center"
    style={{
      // maxWidth: "510px",
      width: "100%",
      height: "auto",
    }}
    {...props}
    // className="relative w-full lg:h-auto h-[220px] justify-center items-center"
    // {...props}
  >
    {children}
  </div>
);

export default function LiquidityChartRangeInput({
  currencyA,
  currencyB,
  feeAmount,
  ticksAtLimit,
  price,
  priceLower,
  priceUpper,
  onLeftRangeInput,
  onRightRangeInput,
  interactive: _interactive,
}: {
  currencyA: any;
  currencyB: any;
  feeAmount: FeeAmount;
  ticksAtLimit: Record<Bound, boolean>;
  price?: number;
  priceLower?: any;
  priceUpper?: any;
  onLeftRangeInput: (val: string) => void;
  onRightRangeInput: (val: string) => void;
  interactive: boolean;
}) {
  const t = useTranslations("Liquidity");
  const chartWrapperRef = useRef<HTMLDivElement | null>(null);
  const prevDomainRef = useRef<[number, number] | null>(null);
  const isSorted = currencyA && currencyB && currencyA?.wrapped.sortsBefore(currencyB?.wrapped);

  const densityParams = useMemo(
    () => ({ currencyA, currencyB, feeAmount }),
    [currencyA, currencyB, feeAmount],
  );
  const { isLoading, error, formattedData } = useDensityChartData(densityParams);

  const [pendingDomain, setPendingDomain] = useState<[number, number] | undefined>();

  const interactive = _interactive && Boolean(formattedData?.length);
  const zoomLevels = ZOOM_LEVELS[feeAmount ?? FeeAmount.MEDIUM];

  const dimensions = useMemo(() => {
    const isMobile = typeof window !== "undefined" ? window.innerWidth <= 768 : false;
    return isMobile ? { width: 252, height: 170 } : { width: 510, height: 312 };
  }, []);

  const brushLabelValue = useCallback(
    (d: "w" | "e", x: number) => {
      if (!price) return "";
      const isAtLimit =
        (d === "w" && (ticksAtLimit[isSorted ? Bound.LOWER : Bound.UPPER] || x <= 1e-6)) ||
        (d === "e" && (ticksAtLimit[isSorted ? Bound.UPPER : Bound.LOWER] || x >= 1e35));
      if (isAtLimit) return d === "w" ? "0" : "∞";

      const percent = ((x - price) / price) * 100;
      return `${percent < 0 ? "-" : ""}${formatDelta(Math.abs(percent))}`;
    },
    [isSorted, price, ticksAtLimit],
  );

  const externalDomain = useMemo(() => {
    if (!priceLower || !priceUpper) return undefined;
    return [
      parseFloatWithDefault(priceLower.toSignificant(6)),
      parseFloatWithDefault(priceUpper.toSignificant(6)),
    ];
  }, [priceLower, priceUpper]);

  // Clear pending domain only when external domain updates
  useEffect(() => {
    setPendingDomain(undefined);
  }, [priceLower, priceUpper]);

  const currentDomain =
    (pendingDomain as [number, number] | undefined) ??
    (externalDomain as [number, number] | undefined);

  const handleBrushEnd = useCallback(
    (domain: [number, number]) => {
      setPendingDomain(domain);
      const [left, right] = domain;
      const prev = prevDomainRef.current;
      prevDomainRef.current = domain;

      if (!prev || left !== prev[0]) onLeftRangeInput(left.toFixed(10));
      if (!prev || right !== prev[1]) onRightRangeInput(right.toFixed(10));
    },
    [onLeftRangeInput, onRightRangeInput],
  );

  const isUninitialized = !currencyA || !currencyB || (formattedData === undefined && !isLoading);

  return (
    <div
      style={{
        minHeight: "200px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {isUninitialized ? (
        <Alert type="info" text={t("price_chart_data_will_appear_here")} />
      ) : isLoading ? (
        <Alert type="info" text={t("loading")} />
      ) : error ? (
        <Alert type="error" text={t("price_chart_data_not_available")} />
      ) : !price ? (
        <Alert type="error" text={t("price_chart_no_data")} />
      ) : (
        <ChartWrapper ref={chartWrapperRef}>
          <Chart
            data={{ series: formattedData!, current: price }}
            dimensions={dimensions}
            margins={{ top: 10, right: 2, bottom: 20, left: 0 }}
            styles={{
              area: { selection: "#7DA491" },
              brush: {
                handle: {
                  west: "#8089BD",
                  east: "#8089BD",
                },
              },
            }}
            interactive={interactive}
            brushLabels={brushLabelValue}
            brushDomain={currentDomain}
            onBrushDomainChange={handleBrushEnd}
            zoomLevels={zoomLevels}
            ticksAtLimit={ticksAtLimit}
          />
        </ChartWrapper>
      )}
    </div>
  );
}
