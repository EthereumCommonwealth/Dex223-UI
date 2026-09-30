import { ThemeColors } from "@/config/theme/colors";

// The chart draws on canvas, so it needs literal colors rather than Tailwind classes.
// Neutrals follow packages/tailwind-config/tailwind-presets.js; the up/down pair is a
// touch brighter than the brand green and red so candles read clearly on the dark panel.
const BASE = {
  text: "#858D8C", // tertiary-text
  textStrong: "#D1DEDF", // primary-text
  grid: "rgba(56, 60, 58, 0.35)", // secondary-border, softened
  crosshair: "rgba(209, 222, 223, 0.35)",
  crosshairLabel: "#2E2F2F", // quaternary-bg
  separator: "#272727", // tertiary-bg
  separatorHover: "rgba(209, 222, 223, 0.12)",
  // Candles keep market semantics on every page: up is green, down is red.
  up: "#3FCF8E",
  down: "#EF5F67",
  upVolume: "rgba(63, 207, 142, 0.45)",
  downVolume: "rgba(239, 95, 103, 0.45)",
  // A period with no trades: the pool price simply held.
  flat: "rgba(133, 141, 140, 0.45)",
  watermark: "rgba(209, 222, 223, 0.045)",
  ma1: "#E7C46A", // MA 7
  ma2: "#8FA6F2", // MA 25
};

export interface ChartTheme {
  text: string;
  textStrong: string;
  grid: string;
  crosshair: string;
  crosshairLabel: string;
  separator: string;
  separatorHover: string;
  up: string;
  down: string;
  upVolume: string;
  downVolume: string;
  flat: string;
  watermark: string;
  ma1: string;
  ma2: string;
  /** Line and area series. */
  accent: string;
  areaTop: string;
  areaBottom: string;
}

export function chartTheme(scheme: ThemeColors): ChartTheme {
  if (scheme === ThemeColors.PURPLE) {
    return {
      ...BASE,
      accent: "#A5AEE7", // purple-hover
      areaTop: "rgba(128, 137, 189, 0.32)",
      areaBottom: "rgba(128, 137, 189, 0)",
    };
  }
  return {
    ...BASE,
    accent: "#5FD3A0",
    areaTop: "rgba(63, 207, 142, 0.28)",
    areaBottom: "rgba(63, 207, 142, 0)",
  };
}
