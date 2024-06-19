import JSBI from "jsbi";
import { useCallback, useMemo, useState } from "react";
import { Address, formatUnits, getAbiItem } from "viem";
import {
  useAccount,
  useBlockNumber,
  usePublicClient,
  useReadContract,
  useReadContracts,
  useSimulateContract,
  useWalletClient,
  useWriteContract,
} from "wagmi";

import { NONFUNGIBLE_POSITION_MANAGER_ABI } from "@/config/abis/nonfungiblePositionManager";
import { useTokens } from "@/hooks/useTokenLists";
import addToast from "@/other/toast";
import { NONFUNGIBLE_POSITION_MANAGER_ADDRESS } from "@/sdk_hybrid/addresses";
import { DexChainId } from "@/sdk_hybrid/chains";
import { FeeAmount } from "@/sdk_hybrid/constants";
import { Currency } from "@/sdk_hybrid/entities/currency";
import { CurrencyAmount } from "@/sdk_hybrid/entities/fractions/currencyAmount";
import { Price } from "@/sdk_hybrid/entities/fractions/price";
import { Pool } from "@/sdk_hybrid/entities/pool";
import { Position } from "@/sdk_hybrid/entities/position";
import { Token, TokenStandard } from "@/sdk_hybrid/entities/token";
import {
  GasFeeModel,
  RecentTransactionTitleTemplate,
  stringifyObject,
  useRecentTransactionsStore,
} from "@/stores/useRecentTransactionsStore";

import { AllowanceStatus } from "./useAllowance";
import { usePool } from "./usePools";

export type PositionInfo = {
  nonce: bigint;
  operator: `0x${string}`;
  token0: `0x${string}`;
  token1: `0x${string}`;
  tier: FeeAmount;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
  feeGrowthInside0LastX128: bigint;
  feeGrowthInside1LastX128: bigint;
  tokensOwed0: bigint;
  tokensOwed1: bigint;
  tokenId: bigint | undefined;
};

export function usePositionFromTokenId(tokenId: bigint) {
  const { positions, loading } = usePositionsFromTokenIds(tokenId ? [tokenId] : undefined);

  return useMemo(() => {
    return {
      loading,
      position: positions?.[0],
    };
  }, [loading, positions]);
}
export function usePositionsFromTokenIds(tokenIds: bigint[] | undefined) {
  const { chainId } = useAccount();
  const positionsContracts = useMemo(() => {
    if (!tokenIds) {
      return [];
    }

    return tokenIds.map((tokenId) => {
      return {
        address: NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId as DexChainId],
        abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
        functionName: "positions",
        args: [tokenId],
      };
    });
  }, [tokenIds, chainId]);

  const { data: positionsData, isLoading: positionsLoading } = useReadContracts({
    contracts: positionsContracts,
  });

  return useMemo(() => {
    return {
      loading: positionsLoading,
      positions: positionsData
        ?.map((pos, i) => {
          if (!pos || pos.error) {
            return undefined;
          }

          const [
            nonce,
            operator,
            token0,
            token1,
            tier,
            tickLower,
            tickUpper,
            liquidity,
            feeGrowthInside0LastX128,
            feeGrowthInside1LastX128,
            tokensOwed0,
            tokensOwed1,
          ] = pos.result as any;
          return {
            token0,
            token1,
            tier,
            tickLower,
            tickUpper,
            liquidity,
            tokenId: tokenIds?.[i],
          };
        })
        .filter((pos) => Boolean(pos)) as PositionInfo[],
    };
  }, [positionsData, positionsLoading, tokenIds]);
}
export default function usePositions() {
  const { address: account, chainId } = useAccount();

  const { data: balance, isLoading: balanceLoading } = useReadContract({
    address: NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId as DexChainId],
    abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
    functionName: "balanceOf",
    args: account && [account],
    query: {
      enabled: Boolean(account),
    },
  });

  const tokenIdsArgs = useMemo(() => {
    if (balance && account) {
      const tokenRequests = [];
      for (let i = 0; i < Number(balance); i++) {
        tokenRequests.push([account, i]);
      }
      return tokenRequests;
    }
    return [];
  }, [account, balance]);

  const tokenIdsContracts = useMemo(() => {
    return tokenIdsArgs.map((tokenId) => ({
      abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
      functionName: "tokenOfOwnerByIndex",
      args: tokenId,
      address: NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId as DexChainId],
    }));
  }, [chainId, tokenIdsArgs]);

  const { data: tokenIdsData, isLoading: tokenIdsLoading } = useReadContracts({
    contracts: tokenIdsContracts,
  });

  const { positions, loading: positionsLoading } = usePositionsFromTokenIds(
    tokenIdsData
      ?.filter((value) => !!value.result && typeof value.result === "bigint")
      .map((value) => value.result as bigint),
  );

  return {
    positions,
    loading: positionsLoading || tokenIdsLoading || balanceLoading,
  };
}

export function usePositionFromPositionInfo(positionDetails: PositionInfo) {
  const tokens = useTokens();

  const tokenA = useMemo(() => {
    let tokenStandard: TokenStandard | undefined = undefined;
    const token = tokens.find((t) => {
      if (t.address0 === positionDetails?.token0) {
        tokenStandard = "ERC-20";
        return true;
      } else if (t.address1 === positionDetails?.token0) {
        tokenStandard = "ERC-223";
        return true;
      }
    });
    if (token && tokenStandard) return { token, tokenStandard };
  }, [positionDetails?.token0, tokens]);

  const tokenB = useMemo(() => {
    let tokenStandard: TokenStandard | undefined = undefined;
    const token = tokens.find((t) => {
      if (t.address0 === positionDetails?.token1) {
        tokenStandard = "ERC-20";
        return true;
      } else if (t.address1 === positionDetails?.token1) {
        tokenStandard = "ERC-223";
        return true;
      }
    });
    if (token && tokenStandard) return { token, tokenStandard };
  }, [positionDetails?.token1, tokens]);

  const pool = usePool({
    currencyA: tokenA?.token,
    currencyB: tokenB?.token,
    tier: positionDetails?.tier,
  });

  return useMemo(() => {
    if (pool[1] && positionDetails) {
      return new Position({
        pool: pool[1],
        tickLower: positionDetails.tickLower,
        tickUpper: positionDetails.tickUpper,
        liquidity: JSBI.BigInt(positionDetails.liquidity.toString()),
      });
    }
  }, [pool, positionDetails]);
}

const MAX_UINT128 = BigInt(2) ** BigInt(128) - BigInt(1);

export function usePositionFees({
  poolAddress,
  pool,
  tokenId,
  asWETH = false,
}: {
  pool?: Pool;
  tokenId?: bigint;
  asWETH?: boolean;
  poolAddress?: Address;
}): {
  fees: [CurrencyAmount<Currency>, CurrencyAmount<Currency>] | [undefined, undefined];
  handleCollectFees: (params: { tokensOutCode: number }) => void;
  status: AllowanceStatus;
} {
  const [status, setStatus] = useState(AllowanceStatus.INITIAL);
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const { address, chainId } = useAccount();
  const { addRecentTransaction } = useRecentTransactionsStore();

  const result = useReadContract({
    address: NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId as DexChainId],
    abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
    functionName: "ownerOf",
    args: [tokenId!],
    query: {
      enabled: Boolean(tokenId),
    },
  });
  const recipient = result.data! || address;
  const latestBlockNumber = useBlockNumber();

  // TODO: is this result cached? wrong numbers in UI, but in metamask — ok
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
      enabled: Boolean(tokenId && result.data),
    },
  });

  const { writeContract } = useWriteContract();

  const handleCollectFees = useCallback(
    async ({ tokensOutCode }: { tokensOutCode: number }) => {
      if (!publicClient || !walletClient || !chainId || !address || !pool || !collectResult) {
        return;
      }
      setStatus(AllowanceStatus.PENDING);

      const params = {
        address: NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId as DexChainId],
        abi: NONFUNGIBLE_POSITION_MANAGER_ABI,
        functionName: "collect" as const,
        args: [
          {
            pool: poolAddress!,
            tokenId: tokenId!,
            recipient: recipient,
            amount0Max: MAX_UINT128,
            amount1Max: MAX_UINT128,
            tokensOutCode,
          },
        ] as const,
      };

      try {
        const estimatedGas = await publicClient.estimateContractGas(params);

        const { request } = await publicClient.simulateContract({
          ...params,
          gas: estimatedGas + BigInt(30000),
        });
        const hash = await walletClient.writeContract(request);

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
              abi: [getAbiItem({ name: "collect", abi: NONFUNGIBLE_POSITION_MANAGER_ABI })],
            },
            title: {
              template: RecentTransactionTitleTemplate.COLLECT,
              symbol0: pool.token0.symbol!,
              symbol1: pool.token1.symbol!,
              amount0: CurrencyAmount.fromRawAmount(
                pool.token0,
                collectResult.result[0].toString(),
              ).toSignificant(2),
              amount1: CurrencyAmount.fromRawAmount(
                pool.token1,
                collectResult.result[1].toString(),
              ).toSignificant(2),
              logoURI0: (pool?.token0 as Token).logoURI!,
              logoURI1: (pool?.token1 as Token).logoURI!,
            },
          },
          address,
        );
        if (hash) {
          setStatus(AllowanceStatus.LOADING);
          await publicClient.waitForTransactionReceipt({ hash });
          setStatus(AllowanceStatus.SUCCESS);
          return { success: true };
        }
      } catch (error) {
        console.error(error);
        setStatus(AllowanceStatus.INITIAL);
        addToast("Unexpected error, please contact support", "error");
      }
    },
    [
      addRecentTransaction,
      address,
      chainId,
      collectResult,
      pool,
      publicClient,
      tokenId,
      walletClient,
      poolAddress,
      recipient,
    ],
  );

  return {
    fees:
      pool && collectResult?.result
        ? [
            CurrencyAmount.fromRawAmount(pool.token0, collectResult.result[0].toString()),
            CurrencyAmount.fromRawAmount(pool.token1, collectResult.result[1].toString()),
          ]
        : [undefined, undefined],
    handleCollectFees,
    status,
  };
}

function getRatio(
  lower: Price<Currency, Currency>,
  current: Price<Currency, Currency>,
  upper: Price<Currency, Currency>,
) {
  try {
    if (+current < +lower) {
      return 100;
    } else if (+current > +upper) {
      return 0;
    }

    const a = Number.parseFloat(lower.toSignificant(15));
    const b = Number.parseFloat(upper.toSignificant(15));
    const c = Number.parseFloat(current.toSignificant(15));

    const ratio = Math.floor(
      (1 / ((Math.sqrt(a * b) - Math.sqrt(b * c)) / (c - Math.sqrt(b * c)) + 1)) * 100,
    );

    if (ratio < 0 || ratio > 100) {
      throw Error("Out of range");
    }

    return ratio;
  } catch {
    return undefined;
  }
}
export function usePositionPrices({
  position,
  showFirst,
}: {
  position: Position | undefined;
  showFirst: boolean;
}) {
  const minPrice = useMemo(() => {
    if (showFirst) {
      return position?.token0PriceUpper.invert();
    }

    return position?.token0PriceLower;
  }, [position?.token0PriceLower, position?.token0PriceUpper, showFirst]);

  const maxPrice = useMemo(() => {
    if (showFirst) {
      return position?.token0PriceLower.invert();
    }

    return position?.token0PriceUpper;
  }, [position?.token0PriceLower, position?.token0PriceUpper, showFirst]);

  const currentPrice = useMemo(() => {
    if (showFirst) {
      return position?.pool.token1Price;
    }

    return position?.pool.token0Price;
  }, [position?.pool.token0Price, position?.pool.token1Price, showFirst]);

  const [minPriceString, maxPriceString, currentPriceString] = useMemo(() => {
    if (minPrice && maxPrice && currentPrice) {
      return [minPrice.toSignificant(), maxPrice.toSignificant(), currentPrice.toSignificant()];
    }

    return ["0", "0", "0"];
  }, [currentPrice, maxPrice, minPrice]);

  const ratio = useMemo(() => {
    if (minPrice && currentPrice && maxPrice) {
      return getRatio(minPrice, currentPrice, maxPrice);
    }
  }, [currentPrice, maxPrice, minPrice]);

  return {
    minPriceString,
    maxPriceString,
    currentPriceString,
    ratio,
  };
}

export function usePositionRangeStatus({ position }: { position: Position | undefined }) {
  const below =
    position?.pool && typeof position?.tickUpper === "number"
      ? position.pool.tickCurrent < position.tickLower
      : undefined;
  const above =
    position?.pool && typeof position?.tickLower === "number"
      ? position.pool.tickCurrent >= position.tickUpper
      : undefined;
  const inRange: boolean =
    typeof below === "boolean" && typeof above === "boolean" ? !below && !above : false;

  const removed = position ? JSBI.equal(position.liquidity, JSBI.BigInt(0)) : false;

  return {
    inRange,
    removed,
  };
}
