import { createGasLimitStore } from "@/stores/factories/createGasLimitStore";
import { createGasPriceStore } from "@/stores/factories/createGasPriceStore";
import { createGasModeStore } from "@/stores/factories/createGasSettingsStore";

export const useMultisigGasPriceStore = createGasPriceStore();
export const useMultisigGasLimitStore = createGasLimitStore();
export const useMultisigGasModeStore = createGasModeStore();
