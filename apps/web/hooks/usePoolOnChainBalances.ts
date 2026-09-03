import { useMemo } from "react";
import { Address, formatUnits, isAddressEqual, zeroAddress } from "viem";
import { useReadContracts } from "wagmi";

import { ERC20_ABI } from "@/config/abis/erc20";
import { POOL_ABI } from "@/config/abis/pool";
import { DexChainId } from "@/sdk_bi/chains";

export type PoolTokenBalance = {
  erc20: bigint;
  erc223: bigint;
  total: bigint;
  decimals: number;
  formatted: number;
};

export type PoolOnChainBalances = {
  token0: PoolTokenBalance;
  token1: PoolTokenBalance;
};

/** Keyed by lowercased pool address. */
export type PoolBalancesByAddress = Record<string, PoolOnChainBalances>;

type TokenKey = "token0" | "token1";
const TOKEN_KEYS: TokenKey[] = ["token0", "token1"];

type TokenPair = readonly [Address, Address];

type BalanceTarget = {
  pool: string;
  key: TokenKey;
  standard: "erc20" | "erc223";
  address: Address;
};

type DecimalsTarget = {
  pool: string;
  key: TokenKey;
  address: Address;
};

/**
 * Reads what a set of pools actually holds, straight from the token contracts.
 *
 * The subgraph's `totalValueLockedToken0/1` are running sums of Mint/Burn/Swap event
 * amounts, so they only match reality while every event matches the transfers around
 * it. When that assumption breaks the UI keeps reporting tokens the pool does not
 * have - the D223/USDC 0.3% pool reports 400.04 USDC against 0.04 actually held - which
 * is why balances shown to users are read on-chain instead.
 *
 * The pool contract is also the only trustworthy source for each token's ERC-223
 * counterpart: the subgraph's `addressERC223` echoes the ERC-20 address for tokens
 * whose wrapper it never indexed, which would silently drop half of a pool's holdings.
 * That same pool holds every one of its 312 D223 on the ERC-223 side.
 *
 * Pools whose reads fail are left out of the map rather than reported as empty, so one
 * bad pool costs its own row and not the whole table.
 */
export function usePoolsOnChainBalances({
  poolAddresses,
  chainId,
}: {
  poolAddresses: Address[] | undefined;
  chainId: DexChainId | undefined;
}): { balances: PoolBalancesByAddress; isLoading: boolean; isError: boolean } {
  // Lowercased and deduplicated so a pool listed twice is read once and every lookup
  // against the returned map agrees on the key.
  const pools = useMemo(
    () => Array.from(new Set((poolAddresses ?? []).map((address) => address.toLowerCase()))),
    [poolAddresses],
  );

  const tokensEnabled = Boolean(pools.length && chainId);

  const {
    data: tokenPairsData,
    isLoading: tokensLoading,
    isError: tokensError,
  } = useReadContracts({
    contracts: pools.flatMap((pool) =>
      TOKEN_KEYS.map((functionName) => ({
        address: pool as Address,
        abi: POOL_ABI,
        functionName,
        chainId,
      })),
    ),
    query: { enabled: tokensEnabled },
  });

  const tokenPairs = useMemo(() => {
    const pairs: Record<string, Record<TokenKey, TokenPair>> = {};

    pools.forEach((pool, poolIndex) => {
      const poolPairs = TOKEN_KEYS.map(
        (_, keyIndex) =>
          tokenPairsData?.[poolIndex * TOKEN_KEYS.length + keyIndex]?.result as
            | TokenPair
            | undefined,
      );

      if (poolPairs.some((pair) => !pair)) {
        return;
      }

      pairs[pool] = { token0: poolPairs[0]!, token1: poolPairs[1]! };
    });

    return pairs;
  }, [pools, tokenPairsData]);

  // Every contract a pool can hold its pair under, minus the duplicates. A token whose
  // ERC-223 counterpart is unset, or is the ERC-20 itself, lives in a single contract -
  // reading it twice would double the balance we report.
  const { balanceTargets, decimalsTargets } = useMemo(() => {
    const balanceTargets: BalanceTarget[] = [];
    const decimalsTargets: DecimalsTarget[] = [];

    for (const pool of pools) {
      const pair = tokenPairs[pool];

      if (!pair) {
        continue;
      }

      for (const key of TOKEN_KEYS) {
        const [erc20, erc223] = pair[key];

        balanceTargets.push({ pool, key, standard: "erc20", address: erc20 });

        if (erc223 && !isAddressEqual(erc223, zeroAddress) && !isAddressEqual(erc223, erc20)) {
          balanceTargets.push({ pool, key, standard: "erc223", address: erc223 });
        }

        // Decimals come from the ERC-20 side; the ERC-223 counterpart mirrors it.
        decimalsTargets.push({ pool, key, address: erc20 });
      }
    }

    return { balanceTargets, decimalsTargets };
  }, [pools, tokenPairs]);

  const balancesEnabled = Boolean(balanceTargets.length && chainId);

  const {
    data: balancesData,
    isLoading: balancesLoading,
    isError: balancesError,
  } = useReadContracts({
    contracts: [
      ...balanceTargets.map((target) => ({
        address: target.address,
        abi: ERC20_ABI,
        functionName: "balanceOf" as const,
        args: [target.pool as Address] as const,
        chainId,
      })),
      ...decimalsTargets.map((target) => ({
        address: target.address,
        abi: ERC20_ABI,
        functionName: "decimals" as const,
        chainId,
      })),
    ],
    query: { enabled: balancesEnabled },
  });

  return useMemo(() => {
    const isError = tokensError || balancesError;
    // Without the error guard a round of reverting token0()/token1() leaves tokenPairs
    // empty forever, which would pin the UI on a skeleton instead of surfacing the failure.
    const isLoading =
      !isError &&
      (tokensLoading ||
        balancesLoading ||
        (tokensEnabled && !tokenPairsData) ||
        (balancesEnabled && !balancesData));

    const expected = balanceTargets.length + decimalsTargets.length;

    if (!expected || !balancesData || balancesData.length !== expected) {
      return { balances: {}, isLoading, isError };
    }

    const decimalsByPool: Record<string, Partial<Record<TokenKey, number>>> = {};
    const amountsByPool: Record<string, Record<TokenKey, { erc20: bigint; erc223: bigint }>> = {};
    // A read that failed is not a zero balance. Reporting it as one would understate the
    // pool by exactly the amount this hook exists to show accurately, so a pool with any
    // failed read is dropped instead.
    const failed = new Set<string>();

    decimalsTargets.forEach((target, i) => {
      const entry = balancesData[balanceTargets.length + i];

      if (entry.status !== "success") {
        failed.add(target.pool);
        return;
      }

      decimalsByPool[target.pool] = {
        ...decimalsByPool[target.pool],
        [target.key]: Number(entry.result as number),
      };
    });

    balanceTargets.forEach((target, i) => {
      const entry = balancesData[i];

      if (entry.status !== "success") {
        failed.add(target.pool);
        return;
      }

      const poolAmounts = (amountsByPool[target.pool] ??= {
        token0: { erc20: 0n, erc223: 0n },
        token1: { erc20: 0n, erc223: 0n },
      });

      poolAmounts[target.key][target.standard] = entry.result as bigint;
    });

    const balances: PoolBalancesByAddress = {};

    for (const pool of Object.keys(amountsByPool)) {
      const decimals = decimalsByPool[pool];

      if (failed.has(pool) || decimals?.token0 === undefined || decimals?.token1 === undefined) {
        continue;
      }

      balances[pool] = TOKEN_KEYS.reduce((acc, key) => {
        const amounts = amountsByPool[pool][key];
        const total = amounts.erc20 + amounts.erc223;

        acc[key] = {
          ...amounts,
          total,
          decimals: decimals[key]!,
          formatted: Number(formatUnits(total, decimals[key]!)),
        };

        return acc;
      }, {} as PoolOnChainBalances);
    }

    return { balances, isLoading, isError };
  }, [
    balanceTargets,
    decimalsTargets,
    balancesData,
    tokenPairsData,
    tokensLoading,
    balancesLoading,
    tokensError,
    balancesError,
    tokensEnabled,
    balancesEnabled,
  ]);
}

/** Single-pool view of {@link usePoolsOnChainBalances}. */
export function usePoolOnChainBalances({
  poolAddress,
  chainId,
}: {
  poolAddress: Address | undefined;
  chainId: DexChainId | undefined;
}): { balances: PoolOnChainBalances | undefined; isLoading: boolean; isError: boolean } {
  const poolAddresses = useMemo(() => (poolAddress ? [poolAddress] : []), [poolAddress]);

  const { balances, isLoading, isError } = usePoolsOnChainBalances({ poolAddresses, chainId });

  return {
    balances: poolAddress ? balances[poolAddress.toLowerCase()] : undefined,
    isLoading,
    isError,
  };
}
