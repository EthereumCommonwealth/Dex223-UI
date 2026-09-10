import { useMemo } from "react";
import { formatEther } from "viem";

import { MarginPosition } from "@/app/[locale]/margin-trading/types";
import { formatFloat } from "@/functions/formatFloat";
import { useGlobalFees } from "@/shared/hooks/useGlobalFees";
const baseLiquidationGasAmount = 77_730;
const baseSwapGasAmount = 222_000;

export default function usePositionLiquidationCost(position: MarginPosition | undefined) {
  const swapsForLiquidation = useMemo(() => {
    if (position?.assets.find((asset) => asset.equals(position.loanAsset))) {
      // all assets will be swapped to baseAsset
      return position?.assets.length - 1;
    }

    return position?.assets.length || 0;
  }, [position?.assets, position?.loanAsset]);
  const { baseFee, priorityFee, gasPrice } = useGlobalFees();

  return useMemo(() => {
    const totalGasAmount = baseLiquidationGasAmount * 2 + baseSwapGasAmount * swapsForLiquidation;

    const formatted =
      baseFee && priorityFee
        ? formatFloat(formatEther((baseFee + priorityFee) * BigInt(totalGasAmount)))
        : "0";

    return { value: totalGasAmount, formatted };
  }, [baseFee, priorityFee, swapsForLiquidation]);
}
