import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { Resolution } from "./datafeed/types";
import { Drawing } from "./drawings/primitive";
import { IndicatorConfig } from "./indicators/registry";

export type ChartType = "candles" | "line" | "area";

interface TradingChartStore {
  visible: boolean;
  resolution: Resolution;
  chartType: ChartType;
  showVolume: boolean;
  indicators: IndicatorConfig[];
  /** Symbol -> the user's drawings on that chart. */
  drawings: Record<string, Drawing[]>;
  /** Drawing points snap to the nearest open, high, low or close. */
  magnet: boolean;
  scaleMode: "normal" | "log" | "percent";
  /** Pair key (sorted token addresses) -> user-chosen orientation, overriding the default. */
  flipped: Record<string, boolean>;
  /** Pair key -> fee tier the user picked, overriding the most active pool. */
  pinnedFee: Record<string, number>;
  setVisible: (visible: boolean) => void;
  setResolution: (resolution: Resolution) => void;
  setChartType: (chartType: ChartType) => void;
  setShowVolume: (show: boolean) => void;
  setIndicators: (indicators: IndicatorConfig[]) => void;
  setDrawings: (symbol: string, drawings: Drawing[]) => void;
  setMagnet: (magnet: boolean) => void;
  setScaleMode: (mode: "normal" | "log" | "percent") => void;
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
      indicators: [],
      drawings: {},
      magnet: true,
      scaleMode: "normal",
      flipped: {},
      pinnedFee: {},
      setVisible: (visible) => set({ visible }),
      setResolution: (resolution) => set({ resolution }),
      setChartType: (chartType) => set({ chartType }),
      setShowVolume: (showVolume) => set({ showVolume }),
      setIndicators: (indicators) => set({ indicators }),
      setDrawings: (symbol, list) =>
        set((state) => {
          const drawings = { ...state.drawings };
          if (list.length) drawings[symbol] = list;
          else delete drawings[symbol];
          return { drawings };
        }),
      setMagnet: (magnet) => set({ magnet }),
      setScaleMode: (scaleMode) => set({ scaleMode }),
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
      version: 2,
      // v1 had a single MA toggle; everything else carries over unchanged.
      migrate: (persisted) => {
        const { showMA: _dropped, ...rest } = (persisted ?? {}) as Record<string, unknown>;
        return {
          indicators: [],
          drawings: {},
          magnet: true,
          scaleMode: "normal",
          ...rest,
        } as never;
      },
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
