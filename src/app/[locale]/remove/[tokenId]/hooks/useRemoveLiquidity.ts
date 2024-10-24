import JSBI from "jsbi";
import { useCallback, useState } from "react";
import { Address, formatUnits, getAbiItem } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

import { ERC20_ABI } from "@/config/abis/erc20";
import { NONFUNGIBLE_POSITION_MANAGER_ABI } from "@/config/abis/nonfungiblePositionManager";
import { AllowanceStatus } from "@/hooks/useAllowance";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import useTransactionDeadline from "@/hooks/useTransactionDeadline";
import { NONFUNGIBLE_POSITION_MANAGER_ADDRESS } from "@/sdk_hybrid/addresses";
import { DexChainId } from "@/sdk_hybrid/chains";
import { Currency } from "@/sdk_hybrid/entities/currency";
import { Percent } from "@/sdk_hybrid/entities/fractions/percent";
import { Position } from "@/sdk_hybrid/entities/position";
import { toHex } from "@/sdk_hybrid/utils/calldata";
import {
  GasFeeModel,
  RecentTransactionTitleTemplate,
  stringifyObject,
  useRecentTransactionsStore,
} from "@/stores/useRecentTransactionsStore";
import { useTransactionSettingsStore } from "@/stores/useTransactionSettingsStore";

export default function useRemoveLiquidity({
  percentage,
  tokenId,
}: {
  percentage: number;
  tokenId: string | undefined;
}) {
  const [status, setStatus] = useState(AllowanceStatus.INITIAL);
  const [removeLiquidityHash, setRemoveLiquidityHash] = useState(undefined as string | undefined);
  const { slippage, deadline: _deadline } = useTransactionSettingsStore();
  const deadline = useTransactionDeadline(_deadline);
  const { address: accountAddress } = useAccount();

  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const { addRecentTransaction } = useRecentTransactionsStore();
  const chainId = useCurrentChainId();

  const handleRemoveLiquidity = useCallback(
    async (tokenA: Currency | null, tokenB: Currency | null, position?: Position) => {
      setRemoveLiquidityHash(undefined);
      if (
        !position ||
        !publicClient ||
        !walletClient ||
        !accountAddress ||
        !tokenA ||
        !tokenB ||
        !chainId ||
        !tokenId
      ) {
        return;
      }
      setStatus(AllowanceStatus.PENDING);

      try {
        const percent = new Percent(percentage, 100);
        const partialPosition = new Position({
          pool: position.pool,
          liquidity: percent.multiply(position.liquidity).quotient,
          tickLower: position.tickLower,
          tickUpper: position.tickUpper,
        });

        const TEST_ALLOWED_SLIPPAGE = new Percent(2, 100);

        // get amounts
        const { amount0: amount0Desired, amount1: amount1Desired } = position.mintAmounts;

        // adjust for slippage
        const minimumAmounts = partialPosition.burnAmountsWithSlippage(TEST_ALLOWED_SLIPPAGE); // options.slippageTolerance
        const amount0Min = toHex(minimumAmounts.amount0);
        const amount1Min = toHex(minimumAmounts.amount1);

        const decreaseParams: {
          tokenId: any;
          liquidity: any;
          amount0Min: any;
          amount1Min: any;
          deadline: bigint;
        } = {
          tokenId: toHex(JSBI.BigInt(tokenId)) as any,
          liquidity: toHex(partialPosition.liquidity) as any,
          amount0Min: amount0Min as any,
          amount1Min: amount1Min as any,
          deadline,
        };
        const params = {
          account: accountAddress as Address,
          abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
          functionName: "decreaseLiquidity" as const,
          address: NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId as DexChainId],
          args: [decreaseParams] as [typeof decreaseParams],
        };

        const estimatedGas = await publicClient.estimateContractGas(params);

        const { request } = await publicClient.simulateContract({
          ...params,
          gas: estimatedGas + BigInt(30000),
        });

        const hash = await walletClient.writeContract({ ...request, account: undefined });
        setRemoveLiquidityHash(hash);

        const transaction = await publicClient.getTransaction({
          hash,
        });

        const nonce = transaction.nonce;

        addRecentTransaction(
          {
            hash,
            nonce,
            chainId,
            gas: {
              model: GasFeeModel.EIP1559,
              gas: (estimatedGas + BigInt(30000)).toString(),
              maxFeePerGas: undefined,
              maxPriorityFeePerGas: undefined,
            },
            params: {
              ...stringifyObject(params),
              abi: [getAbiItem({ name: "approve", abi: ERC20_ABI })],
            },
            title: {
              symbol0: tokenA.symbol!,
              symbol1: tokenB.symbol!,
              template: RecentTransactionTitleTemplate.REMOVE,
              amount0: formatUnits(BigInt(minimumAmounts.amount0.toString()), tokenA.decimals),
              amount1: formatUnits(BigInt(minimumAmounts.amount1.toString()), tokenB.decimals),
              logoURI0: tokenA.logoURI || "",
              logoURI1: tokenB.logoURI || "",
            },
          },
          accountAddress,
        );
        if (hash) {
          setStatus(AllowanceStatus.LOADING);
          await publicClient.waitForTransactionReceipt({ hash });
          setStatus(AllowanceStatus.SUCCESS);
          return { success: true };
        }
      } catch (e) {
        console.log(e);
        setStatus(AllowanceStatus.ERROR);
      }
    },
    [
      accountAddress,
      addRecentTransaction,
      chainId,
      deadline,
      percentage,
      publicClient,
      walletClient,
      tokenId,
      setRemoveLiquidityHash,
    ],
  );

  const resetRemoveLiquidity = () => {
    setStatus(AllowanceStatus.INITIAL);
    setRemoveLiquidityHash(undefined);
  };

  return { handleRemoveLiquidity, status, removeLiquidityHash, resetRemoveLiquidity };
}
