import { ThemeColors } from "@/config/theme/colors";

// Values from packages/tailwind-config/tailwind-presets.js. The chart draws on canvas, so
// it needs literal colors rather than Tailwind classes.
const BASE = {
  text: "#858D8C", // tertiary-text
  textStrong: "#D1DEDF", // primary-text
  grid: "rgba(56, 60, 58, 0.45)", // secondary-border
  crosshair: "#575A58", // primary-border
  crosshairLabel: "#2E2F2F", // quaternary-bg
  // Candles keep market semantics on every page: up is green, down is red.
  up: "#70C59E",
  down: "#D24B4B",
  upVolume: "rgba(112, 197, 158, 0.28)",
  downVolume: "rgba(210, 75, 75, 0.28)",
};

export interface ChartTheme {
  text: string;
  textStrong: string;
  grid: string;
  crosshair: string;
  crosshairLabel: string;
  up: string;
  down: string;
  upVolume: string;
  downVolume: string;
  /** Line and area series, markers for the viewer's own trades. */
  accent: string;
  areaTop: string;
  areaBottom: string;
}

export function chartTheme(scheme: ThemeColors): ChartTheme {
  if (scheme === ThemeColors.PURPLE) {
    return {
      ...BASE,
      accent: "#A5AEE7", // purple-hover
      areaTop: "rgba(128, 137, 189, 0.35)",
      areaBottom: "rgba(128, 137, 189, 0.02)",
    };
  }
  return {
    ...BASE,
    accent: "#7DA491", // green
    areaTop: "rgba(125, 164, 145, 0.35)",
    areaBottom: "rgba(125, 164, 145, 0.02)",
  };
}
