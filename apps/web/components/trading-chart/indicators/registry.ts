import { Bar } from "../datafeed/types";
import { bollinger, ema, macd, rsi, Series, sma, vwap } from "./calc";

export type IndicatorType = "sma" | "ema" | "bb" | "vwap" | "rsi" | "macd";

export interface IndicatorConfig {
  /** Unique per chart, so two SMAs with different periods can coexist. */
  id: string;
  type: IndicatorType;
  params: number[];
}

export interface OutputSpec {
  key: string;
  label: string;
  color: string;
  kind: "line" | "histogram";
  dashed?: boolean;
}

export interface IndicatorDef {
  type: IndicatorType;
  name: string;
  short: string;
  /** Drawn over the price, or in a pane of its own under it. */
  placement: "overlay" | "pane";
  params: { label: string; default: number; min: number; max: number; step?: number }[];
  outputs: (params: number[]) => OutputSpec[];
  compute: (bars: Bar[], params: number[]) => Record<string, Series>;
  /** Fixed reference levels for pane indicators (RSI 30 and 70). */
  levels?: number[];
  /** Fixed scale for bounded oscillators. */
  range?: [number, number];
}

const closes = (bars: Bar[]) => bars.map((b) => b.close);

export const INDICATORS: Record<IndicatorType, IndicatorDef> = {
  sma: {
    type: "sma",
    name: "Simple moving average",
    short: "SMA",
    placement: "overlay",
    params: [{ label: "Length", default: 20, min: 2, max: 500 }],
    outputs: () => [{ key: "value", label: "", color: "#E7C46A", kind: "line" }],
    compute: (bars, [n]) => ({ value: sma(closes(bars), n) }),
  },
  ema: {
    type: "ema",
    name: "Exponential moving average",
    short: "EMA",
    placement: "overlay",
    params: [{ label: "Length", default: 50, min: 2, max: 500 }],
    outputs: () => [{ key: "value", label: "", color: "#8FA6F2", kind: "line" }],
    compute: (bars, [n]) => ({ value: ema(closes(bars), n) }),
  },
  bb: {
    type: "bb",
    name: "Bollinger Bands",
    short: "BB",
    placement: "overlay",
    params: [
      { label: "Length", default: 20, min: 2, max: 500 },
      { label: "Std. dev.", default: 2, min: 0.5, max: 5, step: 0.5 },
    ],
    outputs: () => [
      { key: "upper", label: "Upper", color: "#6FB6D9", kind: "line" },
      { key: "basis", label: "Basis", color: "#D9A06F", kind: "line", dashed: true },
      { key: "lower", label: "Lower", color: "#6FB6D9", kind: "line" },
    ],
    compute: (bars, [n, mult]) => bollinger(closes(bars), n, mult),
  },
  vwap: {
    type: "vwap",
    name: "Volume-weighted average price (daily)",
    short: "VWAP",
    placement: "overlay",
    params: [],
    outputs: () => [{ key: "value", label: "", color: "#C68FF2", kind: "line" }],
    compute: (bars) => ({ value: vwap(bars) }),
  },
  rsi: {
    type: "rsi",
    name: "Relative strength index",
    short: "RSI",
    placement: "pane",
    params: [{ label: "Length", default: 14, min: 2, max: 100 }],
    outputs: () => [{ key: "value", label: "", color: "#C68FF2", kind: "line" }],
    compute: (bars, [n]) => ({ value: rsi(closes(bars), n) }),
    levels: [30, 70],
    range: [0, 100],
  },
  macd: {
    type: "macd",
    name: "MACD",
    short: "MACD",
    placement: "pane",
    params: [
      { label: "Fast", default: 12, min: 2, max: 100 },
      { label: "Slow", default: 26, min: 3, max: 200 },
      { label: "Signal", default: 9, min: 2, max: 100 },
    ],
    outputs: () => [
      { key: "hist", label: "Histogram", color: "#858D8C", kind: "histogram" },
      { key: "line", label: "MACD", color: "#6FB6D9", kind: "line" },
      { key: "signal", label: "Signal", color: "#E7A36A", kind: "line" },
    ],
    compute: (bars, [fast, slow, signal]) => macd(closes(bars), fast, slow, signal),
    levels: [0],
  },
};

export const INDICATOR_ORDER: IndicatorType[] = ["sma", "ema", "bb", "vwap", "rsi", "macd"];

export function defaultConfig(type: IndicatorType): IndicatorConfig {
  return {
    id: `${type}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    params: INDICATORS[type].params.map((p) => p.default),
  };
}

/** "SMA 20", "BB 20 2", "VWAP". */
export function indicatorTitle(config: IndicatorConfig): string {
  const def = INDICATORS[config.type];
  return [def.short, ...config.params].join(" ");
}
