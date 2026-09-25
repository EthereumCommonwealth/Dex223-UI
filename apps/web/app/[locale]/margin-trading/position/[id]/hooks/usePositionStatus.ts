import { useReadContract } from "wagmi";

import { MarginPosition } from "@/app/[locale]/margin-trading/types";
import { MARGIN_MODULE_ABI } from "@/config/abis/marginModule";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { MARGIN_TRADING_ADDRESS } from "@/sdk_bi/addresses";

export default function usePositionStatus(position: MarginPosition) {
  const chainId = useCurrentChainId();
  const { data } = useReadContract({
    abi: MARGIN_MODULE_ABI,
    address: MARGIN_TRADING_ADDRESS[chainId],
    functionName: "getPositionStatus",
    args: [BigInt(position?.id || 0)],
    query: {
      enabled: !!position,
    },
  });

  return { expectedBalance: data?.[0], actualBalance: data?.[1] };
}
