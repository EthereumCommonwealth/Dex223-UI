import { create } from "zustand";

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

const defaultSlippage = 0.5;
const defaultDeadline = 20;

export const useSwapSettingsStore = create<SwapSettingsStore>((set, get) => ({
  slippage: defaultSlippage,
  slippageType: SlippageType.MEDIUM,
  deadline: defaultDeadline,

  setSlippage: (slippage) => set({ slippage }),
  setDeadline: (deadline) => set({ deadline }),
  setSlippageType: (slippageType) => set({ slippageType }),
  computed: {
    get isModified() {
      return get().slippage !== defaultSlippage || get().deadline !== defaultDeadline;
    },
  },
}));
