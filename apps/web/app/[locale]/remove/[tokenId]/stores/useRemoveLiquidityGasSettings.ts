import { useMemo } from "react";

import { getFormattedGasPrice, getGasSettings } from "@/functions/gasSettings";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { useFees } from "@/hooks/useFees";
import { createGasLimitStore } from "@/stores/factories/createGasLimitStore";
import { createGasPriceStore } from "@/stores/factories/createGasPriceStore";
import { createGasModeStore } from "@/stores/factories/createGasSettingsStore";

export const useRemoveLiquidityGasPriceStore = createGasPriceStore();
export const useRemoveLiquidityGasLimitStore = createGasLimitStore();
export const useRemoveLiquidityGasModeStore = createGasModeStore();

// mb better move this hooks to separete file
export const useRemoveLiquidityGasPrice = () => {
  const { baseFee, gasPrice, priorityFee } = useFees();
  const chainId = useCurrentChainId();
  const { gasPriceOption, gasPriceSettings } = useRemoveLiquidityGasPriceStore();

  const formattedGasPrice = useMemo(() => {
    return getFormattedGasPrice({
      baseFee,
      chainId,
      gasPrice,
      gasPriceOption,
      gasPriceSettings,
    });
  }, [baseFee, chainId, gasPrice, gasPriceOption, gasPriceSettings]);
  return formattedGasPrice;
};

export const useRemoveLiquidityGasSettings = () => {
  const chainId = useCurrentChainId();
  const { baseFee, gasPrice, priorityFee } = useFees();
  const { gasPriceOption, gasPriceSettings } = useRemoveLiquidityGasPriceStore();
  const { customGasLimit } = useRemoveLiquidityGasLimitStore();

  const gasSettings = useMemo(() => {
    return getGasSettings({
      baseFee,
      chainId,
      gasPrice,
      priorityFee,
      gasPriceOption,
      gasPriceSettings,
    });
  }, [baseFee, chainId, gasPrice, priorityFee, gasPriceOption, gasPriceSettings]);

  return { gasSettings, gasModel: gasPriceSettings.model, customGasLimit };
};
