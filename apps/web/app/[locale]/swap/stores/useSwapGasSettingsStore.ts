import { createGasLimitStore } from "@/stores/factories/createGasLimitStore";
import { createGasPriceStore } from "@/stores/factories/createGasPriceStore";
import { createGasModeStore } from "@/stores/factories/createGasSettingsStore";

export const useSwapGasPriceStore = createGasPriceStore();
export const useSwapGasLimitStore = createGasLimitStore();
export const useSwapGasModeStore = createGasModeStore();
