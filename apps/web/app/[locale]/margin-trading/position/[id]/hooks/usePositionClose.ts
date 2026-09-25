import { useCallback } from "react";
import { getAbiItem } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

import {
  PositionCloseStatus,
  usePositionCloseStatusStore,
} from "@/app/[locale]/margin-trading/position/[id]/stores/usePositionCloseStatusStore";
import { MarginPosition } from "@/app/[locale]/margin-trading/types";
import { MARGIN_MODULE_ABI } from "@/config/abis/marginModule";
import { isMarginDeployed } from "@/config/modules";
import { getTransactionWithRetries } from "@/functions/getTransactionWithRetries";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { MARGIN_TRADING_ADDRESS } from "@/sdk_bi/addresses";
import {
  GasFeeModel,
  RecentTransactionTitleTemplate,
  stringifyObject,
  useRecentTransactionsStore,
} from "@/stores/useRecentTransactionsStore";

export default function usePositionClose({ position }: { position: MarginPosition }) {
  const { setStatus, setPositionCloseHash } = usePositionCloseStatusStore();
  const chainId = useCurrentChainId();
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { addRecentTransaction } = useRecentTransactionsStore();

  const handlePositionClose = useCallback(async () => {
    // Never build a transaction against the zero address on chains without a margin deployment.
    if (!isMarginDeployed(chainId)) {
      return;
    }

    if (!walletClient || !publicClient || !address) {
      return;
    }

    setStatus(PositionCloseStatus.PENDING_CLOSE);

    const params = {
      abi: MARGIN_MODULE_ABI,
      address: MARGIN_TRADING_ADDRESS[chainId],
      functionName: "positionClose" as const,
      args: [BigInt(position.id), true] as const,
    };

    const closePositionHash = await walletClient.writeContract({
      ...params,
      account: undefined,
    });
    setStatus(PositionCloseStatus.LOADING_CLOSE);
    setPositionCloseHash(closePositionHash);

    const transaction = await getTransactionWithRetries({
      hash: closePositionHash,
      publicClient,
    });

    const nonce = transaction.nonce;

    addRecentTransaction(
      {
        hash: closePositionHash,
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
          abi: [getAbiItem({ name: "positionClose", abi: MARGIN_MODULE_ABI })],
        },
        title: {
          template: RecentTransactionTitleTemplate.CLOSE_MARGIN_POSITION,
          symbol: position.loanAsset.symbol!,
          positionId: position.id,
          logoURI: position.loanAsset?.logoURI || "/images/tokens/placeholder.svg",
        },
      },
      address,
    );

    const receipt = await publicClient.waitForTransactionReceipt({ hash: closePositionHash });

    if (receipt.status === "success") {
      setStatus(PositionCloseStatus.SUCCESS);
    } else {
      setStatus(PositionCloseStatus.ERROR_CLOSE);
    }

    return;
  }, [
    addRecentTransaction,
    address,
    chainId,
    position.id,
    position.loanAsset?.logoURI,
    position.loanAsset.symbol,
    publicClient,
    setPositionCloseHash,
    setStatus,
    walletClient,
  ]);

  return { handlePositionClose };
}
