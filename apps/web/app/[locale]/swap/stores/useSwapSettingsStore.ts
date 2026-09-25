import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  DEFAULT_DEADLINE,
  DEFAULT_SLIPPAGE,
  safeDeadline,
  safeSlippage,
} from "@/stores/settingsValidation";

export enum SlippageType {
  AUTO,
  CUSTOM,
  LOW,
  MEDIUM,
  HIGH,
}

export type DefaultType = Exclude<SlippageType, SlippageType.AUTO | SlippageType.CUSTOM>;

export const values: Record<DefaultType, number> = {
  [SlippageType.LOW]: 0.1,
  [SlippageType.MEDIUM]: 0.5,
  [SlippageType.HIGH]: 1,
};

export const defaultTypes: DefaultType[] = [
  SlippageType.LOW,
  SlippageType.MEDIUM,
  SlippageType.HIGH,
];

interface SwapSettingsStore {
  slippage: number;
  deadline: number;
  slippageType: SlippageType;
  setSlippage: (slippage: number) => void;
  setDeadline: (deadline: number) => void;
  setSlippageType: (slippageType: SlippageType) => void;
  computed: {
    isModified: boolean;
  };
}

const defaultSlippage = DEFAULT_SLIPPAGE;
const defaultDeadline = DEFAULT_DEADLINE;

const localStorageKey = "swap-transaction-settings";

export const useSwapSettingsStore = create<SwapSettingsStore>()(
  persist(
    (set, get) => ({
      slippage: defaultSlippage,
      slippageType: SlippageType.MEDIUM,
      deadline: defaultDeadline,

      setSlippage: (slippage) => set({ slippage: safeSlippage(slippage) }),
      setDeadline: (deadline) => set({ deadline: safeDeadline(deadline) }),
      setSlippageType: (slippageType) => set({ slippageType }),
      computed: {
        get isModified() {
          return get().slippage !== defaultSlippage || get().deadline !== defaultDeadline;
        },
      },
    }),
    {
      name: localStorageKey,
      // `computed` holds a getter, which cannot round-trip through JSON - persisting it
      // would store a snapshot that shadows the live getter after rehydration.
      partialize: (state) => ({
        slippage: state.slippage,
        deadline: state.deadline,
        slippageType: state.slippageType,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<SwapSettingsStore>;
        const slippageType =
          p.slippageType !== undefined && SlippageType[p.slippageType] !== undefined
            ? p.slippageType
            : SlippageType.MEDIUM;
        return {
          ...current,
          slippage: safeSlippage(p.slippage),
          deadline: safeDeadline(p.deadline),
          slippageType,
        };
      },
    },
  ),
);
