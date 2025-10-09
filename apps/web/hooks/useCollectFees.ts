import { useCallback, useMemo } from "react";
import { encodeFunctionData, formatUnits, getAbiItem, parseUnits } from "viem";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useSimulateContract,
  useWalletClient,
} from "wagmi";

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
import { SwapStatus } from "@/app/[locale]/swap/stores/useSwapStatusStore";
import { ERC20_ABI } from "@/config/abis/erc20";
import { NONFUNGIBLE_POSITION_MANAGER_ABI } from "@/config/abis/nonfungiblePositionManager";
import { WETH9_ABI } from "@/config/abis/weth9";
import { getTransactionWithRetries } from "@/functions/getTransactionWithRetries";
import { IIFE } from "@/functions/iife";
import addToast from "@/other/toast";
import { NONFUNGIBLE_POSITION_MANAGER_ADDRESS } from "@/sdk_bi/addresses";
import { DexChainId } from "@/sdk_bi/chains";
import { CurrencyAmount } from "@/sdk_bi/entities/fractions/currencyAmount";
import { Token } from "@/sdk_bi/entities/token";
import { wrappedTokens } from "@/sdk_bi/entities/weth9";
import { Standard } from "@/sdk_bi/standard";
import { MAX_SAFE_INTEGER } from "@/sdk_bi/utils/sqrt";
import {
  GasFeeModel,
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

  const { data } = useReadContract({
    account: address,
    address: NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId],
    abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
    functionName: "positions",
    args: [tokenId!],
    query: {
      enabled: Boolean(tokenId),
    },
  });

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

    return {
      address: NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId],
      abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
      functionName: "collect" as const,
      args: [collectArgs] as const,
    };
  }, [pool, chainId, poolAddress, tokenId, tokensOutCode, recipient]);

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

const unwrapGasLimitMap: Record<DexChainId, { base: bigint; additional: bigint }> = {
  [DexChainId.MAINNET]: { base: BigInt(50000), additional: BigInt(12000) },
  [DexChainId.SEPOLIA]: { base: BigInt(46200), additional: BigInt(10000) },
  [DexChainId.BSC_TESTNET]: { base: BigInt(46200), additional: BigInt(10000) },
  [DexChainId.EOS]: { base: BigInt(46200), additional: BigInt(10000) },
  [DexChainId.APE_CHAIN]: { base: BigInt(46200), additional: BigInt(10000) },
};

const defaultUnwrapValue = BigInt(46000);

export function useUnwrapWETH9() {
  const { address } = useAccount();
  const chainId = useCurrentChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { addRecentTransaction } = useRecentTransactionsStore();

  const gasLimit = useMemo(() => {
    if (unwrapGasLimitMap[chainId]) {
      return unwrapGasLimitMap[chainId].additional + unwrapGasLimitMap[chainId].base;
    }

    return defaultUnwrapValue;
  }, [chainId]);

  const handleUnwrap = useCallback(
    async (amount: bigint) => {
      if (!walletClient || !publicClient || !address) {
        return;
      }

      try {
        const params = {
          address: wrappedTokens[chainId].address0,
          abi: WETH9_ABI,
          functionName: "withdraw",
          args: [amount],
        };
        const hash = await walletClient.writeContract(params);

        if (hash) {
          const transaction = await getTransactionWithRetries({ hash, publicClient });

          if (transaction) {
            const transaction = await publicClient.getTransaction({
              hash,
              blockTag: "pending" as any,
            });

            const nonce = transaction.nonce;

            addRecentTransaction(
              {
                hash,
                nonce,
                chainId,
                gas: {
                  model: GasFeeModel.EIP1559,
                  gas: gasLimit.toString(),
                  maxFeePerGas: undefined,
                  maxPriorityFeePerGas: undefined,
                },
                params: {
                  ...stringifyObject(params),
                  abi: [getAbiItem({ name: "withdraw", abi: WETH9_ABI })],
                },
                title: {
                  symbol: "ETH",
                  template: RecentTransactionTitleTemplate.UNWRAP,
                  amount: formatUnits(amount, 18),
                  logoURI: "/images/tokens/ETH.svg",
                },
              },
              address,
            );

            // no await needed, function should return hash without waiting
            // waitAndReFetch(hash);

            return { success: true as const, hash };
          }
        }

        return { success: false as const };
      } catch (e) {
        console.log(e);
        addToast((e as any).toString(), "error");
        return { success: false as const };
      }
    },
    [addRecentTransaction, address, chainId, gasLimit, publicClient, walletClient],
  );

  return { handleUnwrap };
}

export function usePositionFees(): {
  fees: [bigint, bigint] | [undefined, undefined];
  handleCollectFees: () => void;
  isETHPool: boolean;
} {
  const { handleUnwrap } = useUnwrapWETH9();
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

  const nativeCoinAmount = pool?.token0.isNative
    ? fees[0]
    : pool?.token1.isNative
      ? fees[1]
      : undefined;

  const handleCollectFees = useCallback(async () => {
    setStatus(CollectFeesStatus.INITIAL);
    if (!publicClient || !walletClient || !chainId || !address || !pool || !collectFeesParams) {
      return;
    }
    setStatus(CollectFeesStatus.PENDING);

    try {
      const estimatedGas = await publicClient.estimateContractGas(collectFeesParams as any);
      const gasToUse = customGasLimit ? customGasLimit : estimatedGas + BigInt(30000); // set custom gas here if user changed it

      const { request } = await publicClient.simulateContract({
        ...(collectFeesParams as any),
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
            ...stringifyObject(collectFeesParams),
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

        if (nativeCoinAmount) {
          // openConfirmInWalletAlert(t("confirm_action_in_your_wallet_alert"));

          setStatus(CollectFeesStatus.UNWRAP_PENDING);
          const result = await handleUnwrap(nativeCoinAmount);

          if (!result?.success) {
            setStatus(CollectFeesStatus.UNWRAP_ERROR);

            // closeConfirmInWalletAlert();
            return;
          } else {
            // setApproveHash(result.hash);
            setStatus(CollectFeesStatus.UNWRAP_LOADING);
            // closeConfirmInWalletAlert();

            const approveReceipt = await publicClient.waitForTransactionReceipt({
              hash: result.hash,
            });

            if (approveReceipt.status === "success") {
              setStatus(CollectFeesStatus.UNWRAP_SUCCESS);
            }

            if (approveReceipt.status === "reverted") {
              setStatus(CollectFeesStatus.UNWRAP_ERROR);
              return;
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setStatus(CollectFeesStatus.ERROR);
    }
  }, [
    setStatus,
    publicClient,
    walletClient,
    chainId,
    address,
    pool,
    collectFeesParams,
    customGasLimit,
    gasSettings,
    setHash,
    addRecentTransaction,
    gasModel,
    fees,
    nativeCoinAmount,
    handleUnwrap,
  ]);

  return {
    fees,
    handleCollectFees,
    isETHPool: Boolean(pool?.token0.isNative) || Boolean(pool?.token1.isNative),
  };
}
