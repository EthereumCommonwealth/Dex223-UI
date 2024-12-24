import { useMemo } from "react";

import { getFormattedGasPrice, getGasSettings } from "@/functions/gasSettings";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { useFees } from "@/hooks/useFees";
import { createGasLimitStore } from "@/stores/factories/createGasLimitStore";
import { createGasPriceStore } from "@/stores/factories/createGasPriceStore";
import { createGasModeStore } from "@/stores/factories/createGasSettingsStore";

export const useAddLiquidityGasPriceStore = createGasPriceStore();
export const useAddLiquidityGasLimitStore = createGasLimitStore();
export const useAddLiquidityGasModeStore = createGasModeStore();

// mb better move this hooks to separete file
export const useAddLiquidityGasPrice = () => {
  const { baseFee, gasPrice, priorityFee } = useFees();
  const chainId = useCurrentChainId();
  const { gasPriceOption, gasPriceSettings } = useAddLiquidityGasPriceStore();

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

export const useAddLiquidityGasSettings = () => {
  const chainId = useCurrentChainId();
  const { baseFee, gasPrice, priorityFee } = useFees();
  const { gasPriceOption, gasPriceSettings } = useAddLiquidityGasPriceStore();
  const { customGasLimit } = useAddLiquidityGasLimitStore();

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
