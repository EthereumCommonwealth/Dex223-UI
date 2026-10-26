import { useCallback } from "react";
import { usePublicClient } from "wagmi";

import { useMarginWriteGas } from "@/app/[locale]/margin-trading/components/MarginGasSettings";
import useMarginGasEstimate from "@/app/[locale]/margin-trading/hooks/useMarginGasEstimate";
import useMarginWalletClient from "@/app/[locale]/margin-trading/hooks/useMarginWalletClient";
import {
  PositionLiquidateStatus,
  usePositionLiquidateStatusStore,
} from "@/app/[locale]/margin-trading/position/[id]/liquidate/stores/usePositionLiquidateStatusStore";
import { MarginPosition } from "@/app/[locale]/margin-trading/types";
import { MARGIN_MODULE_ABI } from "@/config/abis/marginModule";
import { isMarginDeployed } from "@/config/modules";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { MARGIN_TRADING_ADDRESS } from "@/sdk_bi/addresses";

const MAX_FREEZE_DURATION = 3600n;

export default function useLiquidatePosition(position: MarginPosition) {
  const { data: walletClient } = useMarginWalletClient("liquidatePosition");
  const publicClient = usePublicClient();
  const chainId = useCurrentChainId();
  const gasOverrides = useMarginWriteGas("liquidatePosition");
  const { setStatus, setPositionLiquidateHash, setPositionFreezeHash } =
    usePositionLiquidateStatusStore();

  useMarginGasEstimate("liquidatePosition", () => {
    if (position.isLiquidated) return;
    return {
      abi: MARGIN_MODULE_ABI,
      address: MARGIN_TRADING_ADDRESS[chainId],
      functionName: "liquidate",
      args: [BigInt(position.id), position.order.owner],
    };
  });

  const handleLiquidatePosition = useCallback(async () => {
    if (!isMarginDeployed(chainId) || !walletClient || !publicClient || !position) return;
    let failureStatus = PositionLiquidateStatus.ERROR_LIQUIDATE;
    try {
      const readPosition = () =>
        publicClient.readContract({
          abi: MARGIN_MODULE_ABI,
          address: MARGIN_TRADING_ADDRESS[chainId],
          functionName: "positions",
          args: [BigInt(position.id)],
        });
      const current = await readPosition();
      if (!current[6]) {
        setStatus(PositionLiquidateStatus.SUCCESS);
        return;
      }
      const liquidatable = await publicClient.readContract({
        abi: MARGIN_MODULE_ABI,
        address: MARGIN_TRADING_ADDRESS[chainId],
        functionName: "subjectToLiquidation",
        args: [BigInt(position.id)],
      });
      if (!liquidatable) throw new Error("Position is not liquidatable");
      const block = await publicClient.getBlock({ blockTag: "latest" });
      const frozenTime = current[7];
      const send = () =>
        walletClient.writeContract({
          ...gasOverrides,
          abi: MARGIN_MODULE_ABI,
          address: MARGIN_TRADING_ADDRESS[chainId],
          functionName: "liquidate",
          args: [BigInt(position.id), position.order.owner],
        });

      // Fresh positions and expired freezes need a freeze call; a live freeze only needs liquidation.
      if (frozenTime === 0n || block.timestamp - frozenTime > MAX_FREEZE_DURATION) {
        failureStatus = PositionLiquidateStatus.ERROR_FREEZE;
        setStatus(PositionLiquidateStatus.PENDING_FREEZE);
        const hash = await send();
        setPositionFreezeHash(hash);
        setStatus(PositionLiquidateStatus.LOADING_FREEZE);
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status !== "success") throw new Error("Freeze failed");
        const after = await readPosition();
        if (!after[6]) {
          setStatus(PositionLiquidateStatus.SUCCESS);
          return;
        }
        // The contract forbids freezing and liquidating in the same block.
        setStatus(PositionLiquidateStatus.LOADING_BLOCK_CONFIRMATION);
        await publicClient.waitForTransactionReceipt({ hash, confirmations: 2 });
      } else if (block.timestamp <= frozenTime) {
        throw new Error("Wait for the next block before liquidating");
      }

      failureStatus = PositionLiquidateStatus.ERROR_LIQUIDATE;
      setStatus(PositionLiquidateStatus.PENDING_LIQUIDATE);
      const hash = await send();
      setPositionLiquidateHash(hash);
      setStatus(PositionLiquidateStatus.LOADING_LIQUIDATE);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("Liquidation failed");
      const after = await readPosition();
      if (after[6]) throw new Error("Position is still open; retry liquidation after the freeze");
      setStatus(PositionLiquidateStatus.SUCCESS);
    } catch (error) {
      console.error(error);
      setStatus(failureStatus);
    }
  }, [
    chainId,
    gasOverrides,
    position,
    publicClient,
    setPositionFreezeHash,
    setPositionLiquidateHash,
    setStatus,
    walletClient,
  ]);

  return { handleLiquidatePosition };
}
