import { PoolState } from "@/hooks/usePools";

export function isListablePoolState(state: PoolState | undefined): boolean {
  return state === PoolState.EXISTS || state === PoolState.EXISTS_WITH_NO_LIQUIDITY;
}
