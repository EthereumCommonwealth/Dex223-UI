import { useMemo } from "react";

import { getFormattedGasPrice, getGasSettings } from "@/functions/gasSettings";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { useGlobalFees } from "@/shared/hooks/useGlobalFees";
import { createGasLimitStore } from "@/stores/factories/createGasLimitStore";
import { createGasPriceStore } from "@/stores/factories/createGasPriceStore";
import { createGasModeStore } from "@/stores/factories/createGasSettingsStore";

export const useClaimGasPriceStore = createGasPriceStore();
export const useClaimGasLimitStore = createGasLimitStore();
export const useClaimGasModeStore = createGasModeStore();

export const useClaimGasPrice = () => {
  const { baseFee, gasPrice, priorityFee } = useGlobalFees();
  const chainId = useCurrentChainId();
  const { gasPriceOption, gasPriceSettings } = useClaimGasPriceStore();

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

export const useClaimGasSettings = () => {
  const chainId = useCurrentChainId();
  const { baseFee, gasPrice, priorityFee } = useGlobalFees();
  const { gasPriceOption, gasPriceSettings } = useClaimGasPriceStore();
  const { customGasLimit } = useClaimGasLimitStore();

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

