import { useMemo } from "react";

import useCurrentChainId from "@/hooks/useCurrentChainId";
import { NativeCoin } from "@/sdk_hybrid/entities/ether";

export function useNativeCurrency() {
  const chainId = useCurrentChainId();

  return useMemo(() => {
    return NativeCoin.onChain(chainId);
  }, [chainId]);
}
