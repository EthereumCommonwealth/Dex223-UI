import { createGasLimitStore } from "@/stores/factories/createGasLimitStore";
import { createGasPriceStore } from "@/stores/factories/createGasPriceStore";
import { createGasModeStore } from "@/stores/factories/createGasSettingsStore";

export const useListTokensGasPriceStore = createGasPriceStore();
export const useListTokensGasLimitStore = createGasLimitStore();
export const useListTokensGasModeStore = createGasModeStore();
