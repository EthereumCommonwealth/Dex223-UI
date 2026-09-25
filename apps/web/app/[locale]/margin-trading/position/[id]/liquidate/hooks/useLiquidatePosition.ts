import { useCallback } from "react";
import { usePublicClient, useWalletClient } from "wagmi";

import {
  PositionLiquidateStatus,
  usePositionLiquidateStatusStore,
} from "@/app/[locale]/margin-trading/position/[id]/liquidate/stores/usePositionLiquidateStatusStore";
import { MarginPosition } from "@/app/[locale]/margin-trading/types";
import { MARGIN_MODULE_ABI } from "@/config/abis/marginModule";
import { isMarginDeployed } from "@/config/modules";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { MARGIN_TRADING_ADDRESS } from "@/sdk_bi/addresses";

export default function useLiquidatePosition(position: MarginPosition) {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const chainId = useCurrentChainId();

  const { setStatus, setPositionLiquidateHash, setPositionFreezeHash } =
    usePositionLiquidateStatusStore();

  const handleLiquidatePosition = useCallback(async () => {
    // Never build a transaction against the zero address on chains without a margin deployment.
    if (!isMarginDeployed(chainId)) {
      return;
    }

    if (!position || !walletClient || !publicClient) {
      return;
    }

    setStatus(PositionLiquidateStatus.PENDING_FREEZE);
    //add check for position already freezed and liquidator is same

    const positionFreezeHash = await walletClient.writeContract({
      abi: MARGIN_MODULE_ABI,
      address: MARGIN_TRADING_ADDRESS[chainId],
      functionName: "liquidate",
      args: [BigInt(position.id), position.order.owner],
    });
    setStatus(PositionLiquidateStatus.LOADING_FREEZE);
    setPositionFreezeHash(positionFreezeHash);
    const receipt = await publicClient.waitForTransactionReceipt({ hash: positionFreezeHash });

    if (receipt.status === "success") {
      setStatus(PositionLiquidateStatus.PENDING_LIQUIDATE);
      const positionLiquidateHash = await walletClient.writeContract({
        abi: MARGIN_MODULE_ABI,
        address: MARGIN_TRADING_ADDRESS[chainId],
        functionName: "liquidate",
        args: [BigInt(position.id), position.order.owner],
      });
      setPositionLiquidateHash(positionLiquidateHash);
      setStatus(PositionLiquidateStatus.LOADING_LIQUIDATE);

      const receiptLiquidate = await publicClient.waitForTransactionReceipt({
        hash: positionLiquidateHash,
      });

      if (receiptLiquidate.status === "success") {
        setStatus(PositionLiquidateStatus.SUCCESS);
      } else {
        setStatus(PositionLiquidateStatus.ERROR_LIQUIDATE);
      }
    } else {
      setStatus(PositionLiquidateStatus.ERROR_FREEZE);
    }
  }, [
    chainId,
    position,
    publicClient,
    setPositionFreezeHash,
    setPositionLiquidateHash,
    setStatus,
    walletClient,
  ]);

  return { handleLiquidatePosition };
}
