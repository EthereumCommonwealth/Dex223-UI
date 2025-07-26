import { useCallback } from "react";
import { getAbiItem } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

import {
  OpenOrderStatus,
  useOpenOrderStatusStore,
} from "@/app/[locale]/margin-trading/lending-order/[id]/stores/useOpenOrderStatusStore";
import { LendingOrder } from "@/app/[locale]/margin-trading/types";
import { SwapError } from "@/app/[locale]/swap/stores/useSwapStatusStore";
import { MARGIN_MODULE_ABI } from "@/config/abis/marginModule";
import { getTransactionWithRetries } from "@/functions/getTransactionWithRetries";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { MARGIN_TRADING_ADDRESS } from "@/sdk_bi/addresses";
import { DexChainId } from "@/sdk_bi/chains";
import {
  GasFeeModel,
  RecentTransactionTitleTemplate,
  stringifyObject,
  useRecentTransactionsStore,
} from "@/stores/useRecentTransactionsStore";

export default function useOrderOpen({ order }: { order: LendingOrder }) {
  const { setOpenOrderHash, setStatus, setErrorType } = useOpenOrderStatusStore();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { addRecentTransaction } = useRecentTransactionsStore();
  const chainId = useCurrentChainId();
  const { address } = useAccount();

  const handleOrderOpen = useCallback(
    async (orderId: number) => {
      if (!walletClient || !publicClient || !address) {
        return;
      }

      setStatus(OpenOrderStatus.PENDING_OPEN_ORDER);
      try {
        const params = {
          abi: MARGIN_MODULE_ABI,
          address: MARGIN_TRADING_ADDRESS[DexChainId.SEPOLIA],
          functionName: "setOrderStatus" as const,
          args: [BigInt(orderId), true] as const,
        };

        const hash = await walletClient.writeContract({
          ...params,
        });

        setOpenOrderHash(hash);

        setStatus(OpenOrderStatus.LOADING_OPEN_ORDER);

        const transaction = await getTransactionWithRetries({
          hash,
          publicClient,
        });

        const nonce = transaction.nonce;

        addRecentTransaction(
          {
            hash,
            nonce,
            chainId,
            gas: {
              model: GasFeeModel.EIP1559,
              gas: "0",
              maxFeePerGas: undefined,
              maxPriorityFeePerGas: undefined,
            },
            params: {
              ...stringifyObject(params),
              abi: [getAbiItem({ name: "setOrderStatus", abi: MARGIN_MODULE_ABI })],
            },
            title: {
              symbol: order.baseAsset.symbol!,
              orderId,
              template: RecentTransactionTitleTemplate.OPEN_LENDING_ORDER,
              logoURI: order.baseAsset?.logoURI || "/images/tokens/placeholder.svg",
            },
          },
          address,
        );

        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status === "success") {
          setStatus(OpenOrderStatus.SUCCESS);
        }

        if (receipt.status === "reverted") {
          setErrorType(SwapError.UNKNOWN);
          setStatus(OpenOrderStatus.ERROR_OPEN_ORDER);
        }
      } catch (e) {
        setStatus(OpenOrderStatus.ERROR_OPEN_ORDER);
      }
    },
    [
      walletClient,
      publicClient,
      address,
      setStatus,
      setOpenOrderHash,
      addRecentTransaction,
      chainId,
      order.baseAsset.symbol,
      order.baseAsset?.logoURI,
      setErrorType,
    ],
  );

  return { handleOrderOpen };
}
