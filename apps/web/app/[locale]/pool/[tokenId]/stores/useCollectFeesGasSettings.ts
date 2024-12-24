import { useMemo } from "react";

import { getFormattedGasPrice, getGasSettings } from "@/functions/gasSettings";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { useFees } from "@/hooks/useFees";
import { createGasLimitStore } from "@/stores/factories/createGasLimitStore";
import { createGasPriceStore } from "@/stores/factories/createGasPriceStore";
import { createGasModeStore } from "@/stores/factories/createGasSettingsStore";

export const useCollectFeesGasPriceStore = createGasPriceStore();
export const useCollectFeesGasLimitStore = createGasLimitStore();
export const useCollectFeesGasModeStore = createGasModeStore();

// mb better move this hooks to separete file
export const useCollectFeesGasPrice = () => {
  const { baseFee, gasPrice, priorityFee } = useFees();
  const chainId = useCurrentChainId();
  const { gasPriceOption, gasPriceSettings } = useCollectFeesGasPriceStore();

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

export const useCollectFeesGasSettings = () => {
  const chainId = useCurrentChainId();
  const { baseFee, gasPrice, priorityFee } = useFees();
  const { gasPriceOption, gasPriceSettings } = useCollectFeesGasPriceStore();
  const { customGasLimit } = useCollectFeesGasLimitStore();

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
