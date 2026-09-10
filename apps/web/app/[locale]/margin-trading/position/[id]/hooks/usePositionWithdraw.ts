import { useCallback } from "react";
import { encodeFunctionData, parseUnits } from "viem";
import { usePublicClient, useWalletClient } from "wagmi";

import { calculateInterestRate } from "@/app/[locale]/margin-trading/lending-order/[id]/edit/hooks/useEditOrder";
import {
  PositionWithdrawStatus,
  useWithdrawPositionStatusStore,
} from "@/app/[locale]/margin-trading/position/[id]/stores/usePositionWithdrawStatusStore";
import { MarginPosition } from "@/app/[locale]/margin-trading/types";
import { MARGIN_MODULE_ABI } from "@/config/abis/marginModule";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { MARGIN_TRADING_ADDRESS, ORACLE_ADDRESS } from "@/sdk_bi/addresses";
import { Currency } from "@/sdk_bi/entities/currency";

export default function usePositionWithdraw({ position }: { position: MarginPosition }) {
  const { setStatus } = useWithdrawPositionStatusStore();
  const chainId = useCurrentChainId();
  const { data: walletClient } = useWalletClient();

  const publicClient = usePublicClient();

  const handlePositionWithdraw = useCallback(async () => {
    if (!walletClient || !publicClient) {
      return;
    }

    setStatus(PositionWithdrawStatus.PENDING_WITHDRAW);

    try {
      const encodedWithdrawData = position.assetsWithBalances
        .filter((asset) => !!asset.balance)
        .map((assetWithBalance) => {
          return encodeFunctionData({
            abi: MARGIN_MODULE_ABI,
            functionName: "positionWithdraw",
            args: [
              BigInt(position.id), // _orderId
              assetWithBalance.asset.wrapped.address0,
            ],
          });
        });

      const withdrawPositionHash = await walletClient.writeContract({
        abi: MARGIN_MODULE_ABI,
        address: MARGIN_TRADING_ADDRESS[chainId],
        functionName: "multicall",
        args: [encodedWithdrawData],
        account: undefined,
      });
      setStatus(PositionWithdrawStatus.LOADING_WITHDRAW);

      const receipt = await publicClient.waitForTransactionReceipt({ hash: withdrawPositionHash });

      if (receipt.status === "success") {
        setStatus(PositionWithdrawStatus.SUCCESS);
      } else {
        setStatus(PositionWithdrawStatus.ERROR_WITHDRAW);
      }
    } catch (e) {
      console.error(e);
      setStatus(PositionWithdrawStatus.ERROR_WITHDRAW);
    }

    return;
  }, [chainId, position.assetsWithBalances, position.id, publicClient, setStatus, walletClient]);

  return { handlePositionWithdraw };
}
