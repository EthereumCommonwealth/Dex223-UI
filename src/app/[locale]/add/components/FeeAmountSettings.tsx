import clsx from "clsx";
import { useTranslations } from "next-intl";
import { ButtonHTMLAttributes, useCallback, useMemo, useState } from "react";

import { useAddLiquidityTokensStore } from "@/app/[locale]/add/stores/useAddLiquidityTokensStore";
import { useLiquidityTierStore } from "@/app/[locale]/add/stores/useLiquidityTierStore";
import Collapse from "@/components/atoms/Collapse";
import Svg from "@/components/atoms/Svg";
import Badge, { BadgeVariant } from "@/components/badges/Badge";
import { FEE_AMOUNT_DETAIL, FEE_TIERS } from "@/config/constants/liquidityFee";
import { useFeeTierDistribution } from "@/hooks/useFeeTierDistribution";
import { PoolsParams, PoolState, usePools } from "@/hooks/usePools";
import { FeeAmount } from "@/sdk_hybrid/constants";

import { useLiquidityPriceRangeStore } from "../stores/useLiquidityPriceRangeStore";

const useDistributionText = ({
  distributions,
  poolStates,
}: {
  distributions: ReturnType<typeof useFeeTierDistribution>["distributions"];
  poolStates: Record<FeeAmount, PoolState>;
}) => {
  const t = useTranslations("Liquidity");

  const getDistributionText = useCallback(
    (feeAmount: FeeAmount) => {
      const poolState = poolStates[feeAmount];

      const distributionText =
        !distributions || poolState === PoolState.NOT_EXISTS || poolState === PoolState.INVALID
          ? t("fee_tier_not_created")
          : distributions[feeAmount] !== undefined
            ? t("fee_tier_select", {
                select: distributions[feeAmount]?.toFixed(0),
              })
            : t("fee_tier_no_data");

      return distributionText;
    },
    [t, distributions, poolStates],
  );

  return {
    getDistributionText,
  };
};

interface FeeAmountOptionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  feeAmount: FeeAmount;
  distributionText: string;
}
function FeeAmountOption({
  feeAmount,
  active = false,
  distributionText,
  ...props
}: FeeAmountOptionProps) {
  const t = useTranslations("Liquidity");

  return (
    <button
      {...props}
      className={clsx(
        "flex flex-col md:flex-row md:justify-between items-start md:items-center px-4 py-3 md:px-5 md:py-2 rounded-2 border cursor-pointer duration-200 gap-2 md:gap-0",
        active
          ? "bg-green-bg shadow shadow-green/60 border-green pointer-events-none"
          : "border-transparent bg-primary-bg hocus:bg-green-bg",
      )}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
        <span>{t("fee_tier", { tier: FEE_AMOUNT_DETAIL[feeAmount].label })}</span>
        <Badge variant={BadgeVariant.PERCENTAGE} percentage={distributionText} />
      </div>
      <span className="text-secondary-text">
        {t(FEE_AMOUNT_DETAIL[feeAmount].description as any)}
      </span>
    </button>
  );
}

export default function FeeAmountSettings() {
  const t = useTranslations("Liquidity");
  const [isFeeOpened, setIsFeeOpened] = useState(false);
  const { tier, setTier } = useLiquidityTierStore();
  const { tokenA, tokenB } = useAddLiquidityTokensStore();
  const { clearPriceRange } = useLiquidityPriceRangeStore();
  const isDisabled = !tokenA || !tokenB;

  const { isLoading, isError, largestUsageFeeTier, distributions } = useFeeTierDistribution({
    tokenA,
    tokenB,
  });

  const poolParams: PoolsParams = useMemo(
    () => [
      { currencyA: tokenA, currencyB: tokenB, tier: FeeAmount.LOWEST },
      { currencyA: tokenA, currencyB: tokenB, tier: FeeAmount.LOW },
      { currencyA: tokenA, currencyB: tokenB, tier: FeeAmount.MEDIUM },
      { currencyA: tokenA, currencyB: tokenB, tier: FeeAmount.HIGH },
    ],
    [tokenA, tokenB],
  );

  // get pool data on-chain for latest states
  const pools = usePools(poolParams);

  const poolsByFeeTier: Record<FeeAmount, PoolState> = useMemo(
    () =>
      pools.reduce(
        (acc, [curPoolState, curPool]) => {
          acc = {
            ...acc,
            ...{ [curPool?.fee as FeeAmount]: curPoolState },
          };
          return acc;
        },
        {
          // default all states to NOT_EXISTS
          [FeeAmount.LOWEST]: PoolState.NOT_EXISTS,
          [FeeAmount.LOW]: PoolState.NOT_EXISTS,
          [FeeAmount.MEDIUM]: PoolState.NOT_EXISTS,
          [FeeAmount.HIGH]: PoolState.NOT_EXISTS,
        },
      ),
    [pools],
  );

  const { getDistributionText } = useDistributionText({
    distributions,
    poolStates: poolsByFeeTier,
  });

  return (
    <div className={clsx("rounded-3 mb-4 md:mb-5 bg-tertiary-bg", isDisabled && "opacity-20")}>
      <div
        role="button"
        onClick={() => {
          if (isDisabled) return;
          setIsFeeOpened(!isFeeOpened);
        }}
        className={clsx(
          "flex justify-between items-center px-4 py-2 md:px-5 md:py-4 rounded-3 duration-200",
          !isFeeOpened && !isDisabled && "hocus:bg-green-bg",
          isDisabled && "cursor-default",
        )}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {t("fee_tier", { tier: FEE_AMOUNT_DETAIL[tier].label })}
          </span>
          <Badge variant={BadgeVariant.PERCENTAGE} percentage={getDistributionText(tier)} />
        </div>

        <span className="flex items-center gap-2 group text-secondary-text">
          <span>{t(isFeeOpened ? "hide" : "edit")}</span>
          <Svg
            iconName="small-expand-arrow"
            className={isFeeOpened ? "duration-200 -rotate-180" : "duration-200 "}
          />
        </span>
      </div>
      <Collapse open={isFeeOpened}>
        <div className="grid gap-2 pb-5 px-4 md:px-5">
          {FEE_TIERS.map((_feeAmount) => (
            <FeeAmountOption
              feeAmount={_feeAmount}
              key={_feeAmount}
              active={tier === _feeAmount}
              distributionText={getDistributionText(_feeAmount)}
              onClick={() => {
                setTier(_feeAmount);
                clearPriceRange();
              }}
            />
          ))}
        </div>
      </Collapse>
    </div>
  );
}
