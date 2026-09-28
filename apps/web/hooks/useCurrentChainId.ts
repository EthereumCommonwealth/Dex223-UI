import { useMemo } from "react";
import { useAccount } from "wagmi";

import { useConnectWalletStore } from "@/components/dialogs/stores/useConnectWalletStore";
import { networks } from "@/config/networks";
import { DexChainId } from "@/sdk_bi/chains";

export default function useCurrentChainId() {
  const { chainId } = useAccount();
  const { chainToConnect } = useConnectWalletStore();

  return useMemo(() => {
    if (chainId && networks.some((network) => network.chainId === chainId)) {
      return chainId as DexChainId;
    }

    return chainToConnect;
  }, [chainId, chainToConnect]);
}
