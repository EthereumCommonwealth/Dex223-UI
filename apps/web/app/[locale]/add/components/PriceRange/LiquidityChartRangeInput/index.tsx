import Alert from "@repo/ui/alert";
import { useTranslations } from "next-intl";
import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FeeAmount } from "@/sdk_bi/constants";
import { Currency } from "@/sdk_bi/entities/currency";
import { Price } from "@/sdk_bi/entities/fractions/price";
import { Token } from "@/sdk_bi/entities/token";

import { ZOOM_LEVELS } from "../../../hooks/types";
import { Chart } from "./Chart";
import { formatDelta, useDensityChartData } from "./hooks";
import { Bound } from "./types";

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

function InfoBox({ message, icon }: { message?: ReactNode; icon: ReactNode }) {
  return (
    <div style={{ height: "100%", justifyContent: "center" }}>
      {icon}
      {" icon: "}
      {message && (
        //   <ThemedText.DeprecatedMediumHeader padding={10} marginTop="20px" textAlign="center">
        //   {message}
        // </ThemedText.DeprecatedMediumHeader>
        <span>{message}</span>
      )}
    </div>
  );
}

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
  interactive,
}: {
  currencyA?: Currency;
  currencyB?: Currency;
  feeAmount?: FeeAmount;
  ticksAtLimit: { [bound in Bound]?: boolean | undefined };
  price?: number;
  priceLower?: Price<Token, Token>;
  priceUpper?: Price<Token, Token>;
  onLeftRangeInput: (typedValue: string) => void;
  onRightRangeInput: (typedValue: string) => void;
  interactive: boolean;
}) {
  const t = useTranslations("Liquidity");
  const chartWrapperRef = useRef<HTMLDivElement | null>(null);

  const isSorted = currencyA && currencyB && currencyA?.wrapped.sortsBefore(currencyB?.wrapped);

  const densityParams = useMemo(() => {
    return {
      currencyA,
      currencyB,
      feeAmount,
    };
  }, [currencyA, currencyB, feeAmount]);

  const { isLoading, error, formattedData } = useDensityChartData(densityParams);

  const onBrushDomainChangeEnded = useCallback(
    (domain: [number, number], mode: string | undefined) => {
      let leftRangeValue = Number(domain[0]);
      const rightRangeValue = Number(domain[1]);

      if (leftRangeValue <= 0) {
        leftRangeValue = 1 / 10 ** 6;
      }

      // TODO HANDLE !!
      // batch(() => {
      // simulate user input for auto-formatting and other validations
      if (
        (!ticksAtLimit[isSorted ? Bound.LOWER : Bound.UPPER] ||
          mode === "handle" ||
          mode === "reset") &&
        leftRangeValue > 0
      ) {
        onLeftRangeInput(leftRangeValue.toFixed(6));
      }

      if (
        (!ticksAtLimit[isSorted ? Bound.UPPER : Bound.LOWER] || mode === "reset") &&
        rightRangeValue > 0
      ) {
        // todo: remove this check. Upper bound for large numbers
        // sometimes fails to parse to tick.
        if (rightRangeValue < 1e35) {
          onRightRangeInput(rightRangeValue.toFixed(6));
        }
      }
      // });
    },
    [isSorted, onLeftRangeInput, onRightRangeInput, ticksAtLimit],
  );

  interactive = interactive && Boolean(formattedData?.length);

  const brushDomain: [number, number] | undefined = useMemo(() => {
    const leftPrice = isSorted ? priceLower : priceUpper?.invert();
    const rightPrice = isSorted ? priceUpper : priceLower?.invert();

    return leftPrice && rightPrice
      ? [parseFloat(leftPrice?.toSignificant(6)), parseFloat(rightPrice?.toSignificant(6))]
      : undefined;
  }, [isSorted, priceLower, priceUpper]);

  const brushLabelValue = useCallback(
    (d: "w" | "e", x: number) => {
      if (!price) return "";

      if (d === "w" && ticksAtLimit[isSorted ? Bound.LOWER : Bound.UPPER]) return "0";
      if (d === "e" && ticksAtLimit[isSorted ? Bound.UPPER : Bound.LOWER]) return "∞";

      const percent =
        (x < price ? -1 : 1) * ((Math.max(x, price) - Math.min(x, price)) / price) * 100;

      return price ? `${(Math.sign(percent) < 0 ? "-" : "") + formatDelta(percent)}` : "";
    },
    [isSorted, price, ticksAtLimit],
  );

  const isUninitialized = !currencyA || !currencyB || (formattedData === undefined && !isLoading);

  const zoomLevels = ZOOM_LEVELS[feeAmount ?? FeeAmount.MEDIUM];

  // SET DEFAULT PRICE RANGE
  useEffect(() => {
    if (price && !brushDomain) {
      onBrushDomainChangeEnded(
        [price * zoomLevels.initialMin, price * zoomLevels.initialMax],
        undefined,
      );
    }
  }, [brushDomain, onBrushDomainChangeEnded, price, zoomLevels.initialMin, zoomLevels.initialMax]);

  // const isMobile = useMediaQuery({ query: "(max-width: 640px)" });
  // State to manage chart dimensions
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>(() => {
    const isMobile = typeof window !== "undefined" ? window.innerWidth <= 768 : false;
    return isMobile ? { width: 252, height: 170 } : { width: 510, height: 312 };
  });

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 768;
      const height = chartWrapperRef.current?.clientHeight || (isMobile ? 170 : 312);
      setDimensions({ width: isMobile ? 252 : 510, height });
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Set initial dimensions
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    // <AutoColumn gap="md" style={{ minHeight: "200px" }}>
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
      ) : // <InfoBox
      //   message={<span>{t("price_chart_data_will_appear_here")}</span>}
      //   // icon={<Inbox size={56} stroke={theme.neutral1} />}
      //   icon={"Inbox"}
      // />
      isLoading ? (
        <Alert type="info" text="Loader" />
      ) : // <InfoBox icon={<span>Loader</span>} />
      error ? (
        <Alert type="error" text={t("price_chart_data_not_available")} />
      ) : // <InfoBox
      //   message={<span>{t("price_chart_data_not_available")}</span>}
      //   // icon={<CloudOff size={56} stroke={theme.neutral2} />}
      //   icon={<span>CloudOff</span>}
      // />
      // ) : !formattedData || formattedData.length === 0 || !price ? (
      !price ? (
        <Alert type="error" text={t("price_chart_no_data")} />
      ) : (
        // <InfoBox
        //   message={<span>{t("price_chart_no_data")}</span>}
        //   // icon={<BarChart2 size={56} stroke={theme.neutral2} />}
        //   icon={<span>BarChart2 </span>}
        // />
        <ChartWrapper>
          <Chart
            data={{ series: formattedData!, current: price }}
            // data={{ series: [], current: price }}
            dimensions={dimensions}
            margins={{ top: 10, right: 2, bottom: 20, left: 0 }}
            styles={{
              area: {
                selection: "#FC72FF",
              },
              brush: {
                handle: {
                  // west: saturate(0.1, tokenAColor) ?? theme.critical,
                  // east: saturate(0.1, tokenBColor) ?? theme.accent1,
                  west: "#8089BD",
                  east: "#8089BD",
                },
              },
            }}
            interactive={interactive}
            brushLabels={brushLabelValue}
            brushDomain={brushDomain}
            onBrushDomainChange={onBrushDomainChangeEnded}
            zoomLevels={zoomLevels}
            ticksAtLimit={ticksAtLimit}
          />
        </ChartWrapper>
      )}
    </div>
  );
}
