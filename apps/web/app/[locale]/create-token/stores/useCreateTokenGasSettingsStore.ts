import { createGasLimitStore } from "@/stores/factories/createGasLimitStore";
import { createGasPriceStore } from "@/stores/factories/createGasPriceStore";
import { createGasModeStore } from "@/stores/factories/createGasSettingsStore";

export const useCreateTokenGasPriceStore = createGasPriceStore();
export const useCreateTokenGasLimitStore = createGasLimitStore();
export const useCreateTokenGasModeStore = createGasModeStore();
