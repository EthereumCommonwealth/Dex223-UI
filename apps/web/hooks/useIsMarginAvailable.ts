import { isMarginDeployed } from "@/config/modules";
import useCurrentChainId from "@/hooks/useCurrentChainId";

/** True when the margin module contract is deployed on the connected or selected chain. */
export default function useIsMarginAvailable(): boolean {
  const chainId = useCurrentChainId();

  return isMarginDeployed(chainId);
}
