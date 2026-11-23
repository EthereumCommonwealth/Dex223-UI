import { isTradingPaused } from "@/functions/tradingPause";
import useCurrentChainId from "@/hooks/useCurrentChainId";

/** True when new trades are paused on the connected or selected chain (see functions/tradingPause.ts). */
export default function useIsTradingPaused(): boolean {
  const chainId = useCurrentChainId();

  return isTradingPaused(chainId);
}
