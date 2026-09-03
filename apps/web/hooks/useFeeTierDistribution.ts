import { useMemo } from "react";
import { Address, isAddress } from "viem";

import useCurrentChainId from "@/hooks/useCurrentChainId";
import { usePoolsOnChainBalances } from "@/hooks/usePoolOnChainBalances";
import { FeeAmount } from "@/sdk_bi/constants";
import { Currency } from "@/sdk_bi/entities/currency";
import { useGlobalBlockNumber } from "@/shared/hooks/useGlobalBlockNumber";
import { useStorePools } from "@/shared/hooks/usePools";

import useFeeTierDistributionQuery from "../graphql/thegraph/FeeTierDistributionQuery";
import { PoolsParams, PoolState } from "./usePools";

// maximum number of blocks past which we consider the data stale
const MAX_DATA_BLOCK_AGE = 20;

type FeeTierPool = {
  id?: string;
  feeTier: FeeAmount;
};

interface FeeTierDistribution {
  isLoading: boolean;
  isError: boolean;
  largestUsageFeeTier?: FeeAmount;

  // distributions as percentages of overall liquidity
  distributions?: Record<FeeAmount, number | undefined>;
}

export function useFeeTierDistribution(tokenA?: Currency, tokenB?: Currency): FeeTierDistribution {
  const { isLoading, error, distributions } = usePoolTVL(tokenA, tokenB);

  const poolParams: PoolsParams = useMemo(
    () => [
      { currencyA: tokenA, currencyB: tokenB, tier: FeeAmount.LOW },
      { currencyA: tokenA, currencyB: tokenB, tier: FeeAmount.MEDIUM },
      { currencyA: tokenA, currencyB: tokenB, tier: FeeAmount.HIGH },
    ],
    [tokenA, tokenB],
  );
  const [poolStateLow, poolStateMedium, poolStateHigh] = useStorePools(poolParams, {
    refreshOnBlock: false,
  });

  return useMemo(() => {
    if (isLoading || error || !distributions) {
      return {
        isLoading,
        isError: !!error,
        distributions,
      };
    }

    const largestUsageFeeTier = Object.keys(distributions)
      .map((d) => Number(d))
      .filter((d: FeeAmount) => distributions[d] !== 0 && distributions[d] !== undefined)
      .reduce(
        (a: FeeAmount, b: FeeAmount) => ((distributions[a] ?? 0) > (distributions[b] ?? 0) ? a : b),
        -1,
      );

    const percentages =
      !isLoading &&
      !error &&
      distributions &&
      poolStateLow[0] !== PoolState.LOADING &&
      poolStateMedium[0] !== PoolState.LOADING &&
      poolStateHigh[0] !== PoolState.LOADING
        ? {
            [FeeAmount.LOW]:
              poolStateLow[0] === PoolState.EXISTS
                ? (distributions[FeeAmount.LOW] ?? 0) * 100
                : undefined,
            [FeeAmount.MEDIUM]:
              poolStateMedium[0] === PoolState.EXISTS
                ? (distributions[FeeAmount.MEDIUM] ?? 0) * 100
                : undefined,
            [FeeAmount.HIGH]:
              poolStateHigh[0] === PoolState.EXISTS
                ? (distributions[FeeAmount.HIGH] ?? 0) * 100
                : undefined,
          }
        : undefined;

    return {
      isLoading,
      isError: !!error,
      distributions: percentages,
      largestUsageFeeTier: largestUsageFeeTier === -1 ? undefined : largestUsageFeeTier,
    };
  }, [distributions, error, isLoading, poolStateHigh, poolStateLow, poolStateMedium]);
}

function usePoolTVL(tokenA?: Currency, tokenB?: Currency) {
  const { blockNumber } = useGlobalBlockNumber();
  const chainId = useCurrentChainId();

  const { isLoading, error, data } = useFeeTierDistributionQuery(
    tokenA?.wrapped.address0,
    tokenB?.wrapped.address0,
    30000,
  );

  const { asToken0, asToken1, _meta } = data ?? {};
  const allPools = useMemo(
    () => ([...(asToken0 ?? []), ...(asToken1 ?? [])] as FeeTierPool[]),
    [asToken0, asToken1],
  );
  const poolAddresses = useMemo(
    () =>
      allPools
        .map((pool) => pool.id)
        .filter((id): id is Address => Boolean(id && isAddress(id))),
    [allPools],
  );
  const { balances, isLoading: balancesLoading, isError: balancesError } = usePoolsOnChainBalances({
    poolAddresses,
    chainId,
  });

  return useMemo(() => {
    if (!blockNumber || !_meta || !asToken0 || !asToken1) {
      return {
        isLoading: isLoading || balancesLoading,
        error: error || (balancesError ? new Error("Failed to read pool balances") : undefined),
      };
    }

    if (blockNumber - BigInt(_meta?.block?.number ?? 0) > MAX_DATA_BLOCK_AGE) {
      console.log(`Graph stale (latest block: ${blockNumber})`);
      return {
        isLoading: isLoading || balancesLoading,
        error,
      };
    }

    if (balancesLoading) {
      return {
        isLoading: true,
        error,
      };
    }

    const missingBalance = poolAddresses.some((pool) => !balances[pool.toLowerCase()]);
    const balanceReadError =
      balancesError || (poolAddresses.length > 0 && missingBalance)
        ? new Error("Failed to read pool balances")
        : undefined;

    if (balanceReadError) {
      return {
        isLoading,
        error: error || balanceReadError,
      };
    }

    const tvlByFeeTier = allPools.reduce<Record<FeeAmount, [number, number]>>(
      (acc, value) => {
        const poolBalances = value.id ? balances[value.id.toLowerCase()] : undefined;
        if (!poolBalances) {
          return acc;
        }

        const feeTier = value.feeTier as FeeAmount;
        acc[feeTier][0] += poolBalances.token0.formatted;
        acc[feeTier][1] += poolBalances.token1.formatted;
        return acc;
      },
      {
        [FeeAmount.LOW]: [0, 0],
        [FeeAmount.MEDIUM]: [0, 0],
        [FeeAmount.HIGH]: [0, 0],
      },
    );

    const [sumToken0Tvl, sumToken1Tvl] = Object.values(tvlByFeeTier).reduce<[number, number]>(
      (acc, [tv0, tv1]) => {
        acc[0] += tv0;
        acc[1] += tv1;
        return acc;
      },
      [0, 0],
    );

    const mean = (
      tvl0: number,
      tvl1: number,
      sumTvl0: number,
      sumTvl1: number,
    ): number | undefined =>
      tvl0 === 0 && tvl1 === 0 ? undefined : (tvl0 + tvl1) / (sumTvl0 + sumTvl1 || 1); // prevent divide by zero

    const distributions: Record<FeeAmount, number | undefined> = {
      [FeeAmount.LOW]: mean(...tvlByFeeTier[FeeAmount.LOW], sumToken0Tvl, sumToken1Tvl),
      [FeeAmount.MEDIUM]: mean(...tvlByFeeTier[FeeAmount.MEDIUM], sumToken0Tvl, sumToken1Tvl),
      [FeeAmount.HIGH]: mean(...tvlByFeeTier[FeeAmount.HIGH], sumToken0Tvl, sumToken1Tvl),
    };

    return {
      isLoading,
      error,
      distributions,
    };
  }, [
    _meta,
    asToken0,
    asToken1,
    isLoading,
    balancesLoading,
    balancesError,
    balances,
    error,
    blockNumber,
    allPools,
    poolAddresses,
  ]);
}
