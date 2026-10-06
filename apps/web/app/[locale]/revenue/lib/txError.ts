export type TxErrorCategory =
  | "rejected"
  | "insufficient_funds"
  | "out_of_gas"
  | "reverted"
  | "unknown";

/**
 * Sorts a wallet / viem error into the few cases the Revenue dialogs can explain.
 * viem nests the cause, so every message along the chain is checked.
 */
export function getTxErrorCategory(error: unknown): TxErrorCategory {
  const parts: string[] = [];
  let current: any = error;
  for (let depth = 0; current && depth < 6; depth++) {
    if (typeof current === "string") {
      parts.push(current);
      break;
    }
    parts.push(
      String(current.name ?? ""),
      String(current.shortMessage ?? ""),
      String(current.message ?? ""),
    );
    if (current.code === 4001) return "rejected";
    current = current.cause;
  }
  const text = parts.join(" ").toLowerCase();

  if (/userrejected|user rejected|user denied|rejected the request|request rejected/.test(text)) {
    return "rejected";
  }
  if (/insufficient funds|insufficientfunds/.test(text)) return "insufficient_funds";
  if (/out of gas|intrinsic gas too low|gas too low|gas limit too low/.test(text)) {
    return "out_of_gas";
  }
  if (/revert/.test(text)) return "reverted";
  return "unknown";
}
