import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { Resolution } from "./datafeed/types";

export type ChartType = "candles" | "line" | "area";

interface TradingChartStore {
  visible: boolean;
  resolution: Resolution;
  chartType: ChartType;
  showVolume: boolean;
  /** MA 7 and MA 25 overlays. */
  showMA: boolean;
  /** Pair key (sorted token addresses) -> user-chosen orientation, overriding the default. */
  flipped: Record<string, boolean>;
  /** Pair key -> fee tier the user picked, overriding the most active pool. */
  pinnedFee: Record<string, number>;
  setVisible: (visible: boolean) => void;
  setResolution: (resolution: Resolution) => void;
  setChartType: (chartType: ChartType) => void;
  setShowVolume: (show: boolean) => void;
  setShowMA: (show: boolean) => void;
  toggleFlipped: (pairKey: string, current: boolean) => void;
  pinFee: (pairKey: string, fee: number | null) => void;
}

export const useTradingChartStore = create<TradingChartStore>()(
  persist(
    (set) => ({
      visible: true,
      resolution: "60",
      chartType: "candles",
      showVolume: true,
      showMA: false,
      flipped: {},
      pinnedFee: {},
      setVisible: (visible) => set({ visible }),
      setResolution: (resolution) => set({ resolution }),
      setChartType: (chartType) => set({ chartType }),
      setShowVolume: (showVolume) => set({ showVolume }),
      setShowMA: (showMA) => set({ showMA }),
      toggleFlipped: (pairKey, current) =>
        set((state) => ({ flipped: { ...state.flipped, [pairKey]: !current } })),
      pinFee: (pairKey, fee) =>
        set((state) => {
          const pinnedFee = { ...state.pinnedFee };
          if (fee === null) delete pinnedFee[pairKey];
          else pinnedFee[pairKey] = fee;
          return { pinnedFee };
        }),
    }),
    {
      name: "dex223-trading-chart",
      version: 1,
      // Rehydrated after mount (see useChartPreferences) so the server render and the
      // first client render agree.
      skipHydration: true,
    },
  ),
);

/** Load saved chart preferences once the page has mounted. */
export function useChartPreferences() {
  useEffect(() => {
    useTradingChartStore.persist.rehydrate();
  }, []);
}

/** Whether saved preferences have loaded, so nothing renders in the wrong orientation first. */
export function useChartPreferencesReady() {
  const [ready, setReady] = useState(() => useTradingChartStore.persist.hasHydrated());
  useEffect(() => {
    if (useTradingChartStore.persist.hasHydrated()) setReady(true);
    return useTradingChartStore.persist.onFinishHydration(() => setReady(true));
  }, []);
  return ready;
}
