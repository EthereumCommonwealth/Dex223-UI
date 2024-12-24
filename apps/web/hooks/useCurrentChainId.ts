import { useMemo } from "react";
import { useAccount } from "wagmi";

import { useConnectWalletStore } from "@/components/dialogs/stores/useConnectWalletStore";
import { DEX_SUPPORTED_CHAINS, DexChainId } from "@/sdk_hybrid/chains";

export default function useCurrentChainId() {
  const { chainId } = useAccount();
  const { chainToConnect } = useConnectWalletStore();

  return useMemo(() => {
    if (chainId && DEX_SUPPORTED_CHAINS.includes(chainId)) {
      return chainId as DexChainId;
    }

    return chainToConnect;
  }, [chainId, chainToConnect]);
}
