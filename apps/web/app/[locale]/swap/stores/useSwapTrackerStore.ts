import { create } from "zustand";

export type SwapTrackerSnapshot = {
  symbolA: string;
  symbolB: string;
  logoA?: string;
  logoB?: string;
  amountIn: string;
  amountOut: string;
  // Whether the flow includes an approve step (ERC-20 input that is not yet allowed).
  withApprove: boolean;
};

interface SwapTrackerStore {
  snapshot: SwapTrackerSnapshot | null;
  startedAt: number;
  show: (snapshot: SwapTrackerSnapshot) => void;
  hide: () => void;
}

/**
 * The swap in progress after its review dialog was closed. The swap itself keeps running
 * (its state lives in useSwapStatusStore), this only records what the tracker card shows.
 */
export const useSwapTrackerStore = create<SwapTrackerStore>((set) => ({
  snapshot: null,
  startedAt: 0,
  show: (snapshot) => set({ snapshot, startedAt: Date.now() }),
  hide: () => set({ snapshot: null }),
}));
