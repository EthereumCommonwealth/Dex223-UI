import { encodeFunctionData } from "viem";

const REFUND_ETH_ABI = [
  { inputs: [], name: "refundETH", outputs: [], stateMutability: "payable", type: "function" },
] as const;

/** Calldata of `refundETH()` on the router and the position manager (both inherit it). */
export const REFUND_ETH_CALLDATA = encodeFunctionData({
  abi: REFUND_ETH_ABI,
  functionName: "refundETH",
});

/**
 * The calls of a multicall that sends native ETH, with `refundETH()` appended.
 *
 * The router and the position manager wrap only the ETH a swap or a mint actually uses. A swap
 * that reaches its price limit, or a mint whose price moved within the slippage allowance, uses
 * less than the `value` sent. What is left stays in the contract, and `refundETH()` pays the
 * contract's whole ETH balance to whoever calls it. Calling it last in the same multicall returns
 * the unused ETH to the sender in the same transaction.
 */
export function withRefundETH(calls: readonly `0x${string}`[]): `0x${string}`[] {
  return [...calls, REFUND_ETH_CALLDATA];
}
