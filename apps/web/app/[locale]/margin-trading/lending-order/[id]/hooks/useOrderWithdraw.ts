import { useCallback } from "react";
import { getAbiItem, parseUnits } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

import {
  OrderWithdrawStatus,
  useWithdrawOrderStatusStore,
} from "@/app/[locale]/margin-trading/lending-order/[id]/stores/useWithdrawOrderStatusStore";
import { LendingOrder } from "@/app/[locale]/margin-trading/types";
import { MARGIN_MODULE_ABI } from "@/config/abis/marginModule";
import { getTransactionWithRetries } from "@/functions/getTransactionWithRetries";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { MARGIN_TRADING_ADDRESS } from "@/sdk_bi/addresses";
import { Currency } from "@/sdk_bi/entities/currency";
import {
  GasFeeModel,
  RecentTransactionTitleTemplate,
  stringifyObject,
  useRecentTransactionsStore,
} from "@/stores/useRecentTransactionsStore";

export default function useOrderWithdraw({
  order,
  currency,
  amountToWithdraw,
}: {
  order: LendingOrder;
  currency: Currency;
  amountToWithdraw: string;
}) {
  const { setStatus, setWithdrawHash } = useWithdrawOrderStatusStore();
  const chainId = useCurrentChainId();
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();

  const publicClient = usePublicClient();
  const { addRecentTransaction } = useRecentTransactionsStore();

  const handleOrderWithdraw = useCallback(async () => {
    if (!walletClient || !publicClient || !address) {
      return;
    }

    setStatus(OrderWithdrawStatus.PENDING_WITHDRAW);

    const params = {
      abi: MARGIN_MODULE_ABI,
      address: MARGIN_TRADING_ADDRESS[chainId],
      functionName: "orderWithdraw" as const,
      args: [BigInt(order.id), parseUnits(amountToWithdraw, currency.decimals ?? 18)] as const,
    };

    try {
      const withdrawHash = await walletClient.writeContract({
        ...params,
        account: undefined,
      });
      setStatus(OrderWithdrawStatus.LOADING_WITHDRAW);

      setWithdrawHash(withdrawHash);

      const transaction = await getTransactionWithRetries({
        hash: withdrawHash,
        publicClient,
      });

      const nonce = transaction.nonce;

      addRecentTransaction(
        {
          hash: withdrawHash,
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
            abi: [getAbiItem({ name: "orderWithdraw", abi: MARGIN_MODULE_ABI })],
          },
          title: {
            symbol: currency.symbol!,
            template: RecentTransactionTitleTemplate.WITHDRAW,
            amount: amountToWithdraw,
            logoURI: currency?.logoURI || "/images/tokens/placeholder.svg",
            standard: order.baseAssetStandard,
          },
        },
        address,
      );

      const receipt = await publicClient.waitForTransactionReceipt({ hash: withdrawHash });
      if (receipt.status === "success") {
        setStatus(OrderWithdrawStatus.SUCCESS);
      } else {
        setStatus(OrderWithdrawStatus.ERROR_WITHDRAW);
      }
    } catch (e) {
      console.error(e);
      setStatus(OrderWithdrawStatus.ERROR_WITHDRAW);
    }

    return;
  }, [
    addRecentTransaction,
    address,
    amountToWithdraw,
    chainId,
    currency.decimals,
    currency?.logoURI,
    currency.symbol,
    order,
    publicClient,
    setStatus,
    setWithdrawHash,
    walletClient,
  ]);

  return { handleOrderWithdraw };
}
