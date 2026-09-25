import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  DEFAULT_DEADLINE,
  DEFAULT_SLIPPAGE,
  safeDeadline,
  safeSlippage,
} from "@/stores/settingsValidation";

interface TransactionSettingsStore {
  slippage: number;
  deadline: number;
  setSlippage: (slippage: number) => void;
  setDeadline: (deadline: number) => void;
}

// Drives the add- and remove-liquidity flows.
const localStorageKey = "liquidity-transaction-settings";

export const useTransactionSettingsStore = create<TransactionSettingsStore>()(
  persist(
    (set) => ({
      slippage: DEFAULT_SLIPPAGE,
      deadline: DEFAULT_DEADLINE,

      // Guarded on write as well as on rehydrate, so a caller that bypasses the
      // settings dialog cannot store an out-of-range value in the first place.
      setSlippage: (slippage) => set({ slippage: safeSlippage(slippage) }),
      setDeadline: (deadline) => set({ deadline: safeDeadline(deadline) }),
    }),
    {
      name: localStorageKey,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<TransactionSettingsStore>;
        return {
          ...current,
          slippage: safeSlippage(p.slippage),
          deadline: safeDeadline(p.deadline),
        };
      },
    },
  ),
);
