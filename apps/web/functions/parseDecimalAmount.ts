import { parseUnits } from "viem";

export function parseDecimalAmount(value: string, decimals: number): bigint | undefined {
  const text = value.trim();
  if (!/^\d+(\.\d+)?$/.test(text)) return undefined;
  const fraction = text.split(".")[1];
  if (fraction && fraction.length > decimals) return undefined;
  try {
    return parseUnits(text, decimals);
  } catch {
    return undefined;
  }
}
