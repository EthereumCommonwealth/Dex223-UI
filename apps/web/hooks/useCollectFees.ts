import { useCallback, useMemo } from "react";
import { encodeFunctionData, getAbiItem } from "viem";
import { useAccount, usePublicClient, useSimulateContract, useWalletClient } from "wagmi";

import {
  useCollectFeesGasLimitStore,
  useCollectFeesGasSettings,
} from "@/app/[locale]/pool/[tokenId]/stores/useCollectFeesGasSettings";
import {
  CollectFeesStatus,
  useCollectFeesStatusStore,
} from "@/app/[locale]/pool/[tokenId]/stores/useCollectFeesStatusStore";
import {
  useCollectFeesStore,
  useRefreshStore,
  useTokensOutCode,
} from "@/app/[locale]/pool/[tokenId]/stores/useCollectFeesStore";
import { NONFUNGIBLE_POSITION_MANAGER_ABI } from "@/config/abis/nonfungiblePositionManager";
import { getTransactionWithRetries } from "@/functions/getTransactionWithRetries";
import { IIFE } from "@/functions/iife";
import { NONFUNGIBLE_POSITION_MANAGER_ADDRESS } from "@/sdk_hybrid/addresses";
import { DexChainId } from "@/sdk_hybrid/chains";
import { CurrencyAmount } from "@/sdk_hybrid/entities/fractions/currencyAmount";
import { Token } from "@/sdk_hybrid/entities/token";
import { Standard } from "@/sdk_hybrid/standard";
import {
  RecentTransactionTitleTemplate,
  stringifyObject,
  useRecentTransactionsStore,
} from "@/stores/useRecentTransactionsStore";

import useCurrentChainId from "./useCurrentChainId";
import useDeepEffect from "./useDeepEffect";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const MAX_UINT128 = BigInt(2) ** BigInt(128) - BigInt(1);

const useCollectFees = () => {
  const { poolAddress, pool, tokenId } = useCollectFeesStore();

  const chainId = useCurrentChainId();
  const { address } = useAccount();
  const recipient = address || ZERO_ADDRESS;
  const { refreshKey } = useRefreshStore();

  const { data: collectResult } = useSimulateContract({
    address: NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId as DexChainId],
    abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
    functionName: "collect",
    args: [
      {
        pool: poolAddress!,
        tokenId: tokenId!,
        recipient: recipient,
        amount0Max: MAX_UINT128,
        amount1Max: MAX_UINT128,
        tokensOutCode: 0,
      },
    ],
    query: {
      enabled: Boolean(tokenId),
    },
    // @ts-ignore
    dependencies: [tokenId, refreshKey],
  });

  return useMemo(() => {
    if (!pool || !collectResult?.result) return [undefined, undefined] as [undefined, undefined];
    return [collectResult?.result[0], collectResult?.result[1]] as [bigint, bigint];
  }, [pool, collectResult]);
};

const useCollectFeesParams = () => {
  const { token0Standard, token1Standard, poolAddress, pool, tokenId } = useCollectFeesStore();
  const tokensOutCode = useTokensOutCode();
  const chainId = useCurrentChainId();

  const { address } = useAccount();
  const recipient = address || ZERO_ADDRESS;

  const fees = useCollectFees();

  const collectFeesParams = useMemo(() => {
    if (!pool) return undefined;
    const collectArgs = {
      pool: poolAddress!,
      tokenId: tokenId!,
      recipient: recipient,
      amount0Max: MAX_UINT128,
      amount1Max: MAX_UINT128,
      tokensOutCode,
    };
    const nativeCoinAmount = pool.token0.isNative
      ? fees[0]
      : pool.token1.isNative
        ? fees[1]
        : undefined;

    const tokenAddress = !pool.token0.isNative
      ? token0Standard === Standard.ERC20
        ? pool.token0.wrapped.address0
        : pool.token0.wrapped.address1
      : token1Standard === Standard.ERC20
        ? pool.token1.wrapped.address0
        : pool.token1.wrapped.address1;

    if (nativeCoinAmount) {
      const encodedCoolectParams = encodeFunctionData({
        abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
        functionName: "collect" as const,
        args: [{ ...collectArgs, recipient: ZERO_ADDRESS }] as const,
      });

      const encodedUnwrapParams = encodeFunctionData({
        abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
        functionName: "unwrapWETH9",
        args: [nativeCoinAmount, recipient],
      });
      const encodedSweepParams = encodeFunctionData({
        abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
        functionName: "sweepToken",
        args: [tokenAddress, nativeCoinAmount, recipient],
      });

      return {
        address: NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId],
        abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
        functionName: "multicall" as const,
        args: [[encodedCoolectParams, encodedUnwrapParams, encodedSweepParams]] as const,
      };
    }

    const params = {
      address: NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId],
      abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
      functionName: "collect" as const,
      args: [collectArgs] as const,
    };

    return params;
  }, [
    pool,
    chainId,
    poolAddress,
    tokenId,
    tokensOutCode,
    recipient,
    fees,
    token0Standard,
    token1Standard,
  ]);

  return { collectFeesParams };
};

const COLLECT_FEES_DEFAULT_GAS_LIMIT = BigInt(250000);
export function useCollectFeesEstimatedGas() {
  const { address } = useAccount();
  const { collectFeesParams } = useCollectFeesParams();
  const publicClient = usePublicClient();
  const { setEstimatedGas } = useCollectFeesGasLimitStore();

  useDeepEffect(() => {
    IIFE(async () => {
      if (!collectFeesParams || !address) {
        setEstimatedGas(COLLECT_FEES_DEFAULT_GAS_LIMIT);
        console.log("Can't estimate gas");
        return;
      }

      try {
        const estimated = await publicClient?.estimateContractGas(collectFeesParams as any);
        if (estimated) {
          setEstimatedGas(estimated + BigInt(10000));
        } else {
          setEstimatedGas(COLLECT_FEES_DEFAULT_GAS_LIMIT);
        }
        // console.log(estimated);
      } catch (e) {
        console.log(e);
        setEstimatedGas(COLLECT_FEES_DEFAULT_GAS_LIMIT);
      }
    });
  }, [publicClient, address, collectFeesParams]);
}

export function usePositionFees(): {
  fees: [bigint, bigint] | [undefined, undefined];
  handleCollectFees: () => void;
} {
  const { pool } = useCollectFeesStore();
  const { setStatus, setHash, setErrorType } = useCollectFeesStatusStore();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const { address } = useAccount();
  const chainId = useCurrentChainId();
  const { addRecentTransaction } = useRecentTransactionsStore();

  const fees = useCollectFees();

  const { collectFeesParams } = useCollectFeesParams();

  const { gasSettings, customGasLimit, gasModel } = useCollectFeesGasSettings();

  const handleCollectFees = useCallback(async () => {
    setStatus(CollectFeesStatus.INITIAL);
    if (!publicClient || !walletClient || !chainId || !address || !pool || !collectFeesParams) {
      return;
    }
    setStatus(CollectFeesStatus.PENDING);

    const params = collectFeesParams;

    try {
      const estimatedGas = await publicClient.estimateContractGas(params as any);
      const gasToUse = customGasLimit ? customGasLimit : estimatedGas + BigInt(30000); // set custom gas here if user changed it

      const { request } = await publicClient.simulateContract({
        ...(params as any),
        ...gasSettings,
        gas: gasToUse,
      });
      const hash = await walletClient.writeContract(request);

      setHash(hash);
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
            ...stringifyObject({ ...gasSettings, model: gasModel }),
            gas: gasToUse.toString(),
          },
          params: {
            ...stringifyObject(params),
            abi: [getAbiItem({ name: "collect", abi: NONFUNGIBLE_POSITION_MANAGER_ABI })],
          },
          title: {
            template: RecentTransactionTitleTemplate.COLLECT,
            symbol0: pool.token0.symbol!,
            symbol1: pool.token1.symbol!,
            amount0: CurrencyAmount.fromRawAmount(
              pool.token0,
              (fees[0] || BigInt(0)).toString(),
            ).toSignificant(2),
            amount1: CurrencyAmount.fromRawAmount(
              pool.token1,
              (fees[1] || BigInt(0)).toString(),
            ).toSignificant(2),
            logoURI0: (pool?.token0 as Token).logoURI!,
            logoURI1: (pool?.token1 as Token).logoURI!,
          },
        },
        address,
      );
      if (hash) {
        setStatus(CollectFeesStatus.LOADING);
        await publicClient.waitForTransactionReceipt({ hash });
        setStatus(CollectFeesStatus.SUCCESS);
        return { success: true };
      }
    } catch (error) {
      console.error(error);
      setStatus(CollectFeesStatus.ERROR);
    }
  }, [
    addRecentTransaction,
    address,
    chainId,
    fees,
    pool,
    publicClient,
    walletClient,
    setHash,
    collectFeesParams,
    setStatus,
    customGasLimit,
    gasSettings,
    gasModel,
  ]);

  return {
    fees,
    handleCollectFees,
  };
}
