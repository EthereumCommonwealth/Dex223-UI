export function leverageUint8(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 100) {
    throw new Error("Leverage must be a whole number from 1 to 100");
  }
  return n;
}
