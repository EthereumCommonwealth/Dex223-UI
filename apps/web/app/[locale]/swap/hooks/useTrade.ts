import { useEffect } from "react";
import { encodePacked, parseUnits } from "viem";
import { useAccount, usePublicClient } from "wagmi";

import { useMarginSwapAmountsStore } from "@/app/[locale]/margin-swap/stores/useMarginSwapAmountsStore";
import { useMarginSwapTokensStore } from "@/app/[locale]/margin-swap/stores/useMarginSwapTokensStore";
import { useMarginSwapTradeStore } from "@/app/[locale]/margin-swap/stores/useMarginSwapTradeStore";
import { useSwapAmountsStore } from "@/app/[locale]/swap/stores/useSwapAmountsStore";
import { useSwapTokensStore } from "@/app/[locale]/swap/stores/useSwapTokensStore";
import { TradeError, useSwapTradeStore } from "@/app/[locale]/swap/stores/useSwapTradeStore";
import { EXPERIMENTAL_POOL_ABI } from "@/config/abis/pool_experimental";
import { IIFE } from "@/functions/iife";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { useDebounce } from "@/hooks/useDebounce";
import { PoolsResult, PoolState, useStorePools } from "@/hooks/usePools";
import { ZERO_ADDRESS } from "@/sdk_bi/addresses";
import { FeeAmount, TradeType } from "@/sdk_bi/constants";
import { Currency } from "@/sdk_bi/entities/currency";
import { CurrencyAmount } from "@/sdk_bi/entities/fractions/currencyAmount";
import { Pool } from "@/sdk_bi/entities/pool";
import { Route } from "@/sdk_bi/entities/route";
import { Trade } from "@/sdk_bi/entities/trade";
import { NEGATIVE_ONE, ONE } from "@/sdk_bi/internalConstants";
import { computePoolAddressDex } from "@/sdk_bi/utils/computePoolAddress";
import { TickMath } from "@/sdk_bi/utils/tickMath";

function filterPools(poolStates: PoolsResult): Pool[] {
  return poolStates
    .filter((state): state is [PoolState, Pool] => state[1] !== null) // Type guard to remove null Pools
    .map(([, pool]) => pool); // Extract the Pool objects
}

export function useTrade() {
  return useSwapTradeStore((state) => ({
    trade: state.trade,
    error: state.error,
    loading: state.loading,
  }));
}

export function useMarginTrade() {
  return useMarginSwapTradeStore((state) => ({
    trade: state.trade,
    error: state.error,
    loading: state.loading,
  }));
}

type QuoteResult = { fee: number; output: bigint; pool: Pool } | null;
type Quote = { fee: number; output: bigint; pool: Pool };

export type TokenTrade = Trade<Currency, Currency, TradeType>;
const poolsFees = [FeeAmount.LOW, FeeAmount.MEDIUM, FeeAmount.HIGH];

export function useTradeComputation() {
  const { tokenA, tokenB } = useSwapTokensStore();
  const { typedValue } = useSwapAmountsStore();

  const pools = useStorePools(
    poolsFees.map((fee) => ({ currencyA: tokenA, currencyB: tokenB, tier: fee })),
  );

  const debounced = useDebounce(typedValue, 300);
  const client = usePublicClient();
  const { address } = useAccount();
  const chainId = useCurrentChainId();

  const { setTrade, setError, setLoading } = useSwapTradeStore();

  // 1) Immediate loading any time raw input changes
  //
  // 1. As soon as tokens OR pools change, check for NO_POOLS
  //
  useEffect(() => {
    if (!tokenA || !tokenB) {
      // no valid pair yet
      return;
    }
    console.log("Poasdsd:", pools);
    const valid = filterPools(pools);
    if (valid.length === 0) {
      setError(TradeError.NO_POOLS);
      setTrade(null);
      setLoading(false);
    } else {
      // clear that error if pools now exist
      setError(null);
    }
  }, [tokenA, tokenB, pools, setError, setLoading, setTrade]);

  //
  // 2. Immediately set loading when user types—but skip if no pools
  //
  useEffect(() => {
    const validPools = filterPools(pools);

    // 1) User cleared the field → clear trade & loading, but leave `error` alone
    if (!+typedValue) {
      setTrade(null);
      setLoading(false);
      return;
    }

    // 2) No pools → leave the NO_POOLS error intact, don’t spin
    if (validPools.length === 0) {
      return;
    }

    // 3) Valid input & pools → clear any previous runtime errors and start loading
    setError(null);
    setLoading(true);
  }, [typedValue, pools, setTrade, setError, setLoading]);

  useEffect(() => {
    let active = true;

    if (typedValue !== debounced) {
      return;
    }

    // early exits
    if (!tokenA || !tokenB || !+debounced) {
      setLoading(false);
      return;
    }

    const validPools = filterPools(pools);
    if (validPools.length === 0) {
      // already handled by effect #1
      return;
    }

    IIFE(async () => {
      // kick off all quoteSwap calls in parallel
      const settled = await Promise.allSettled<QuoteResult>(
        validPools.map(async (pool) => {
          const poolAddress = await computePoolAddressDex({
            addressTokenA: pool.token0.wrapped.address0,
            addressTokenB: pool.token1.wrapped.address0,
            tier: pool.fee,
            chainId,
          });
          if (!poolAddress || !client) return null;

          const zeroForOne = tokenA.equals(pool.token0.wrapped);
          const sqrtLimit = zeroForOne
            ? TickMath.MIN_SQRT_RATIO + ONE
            : TickMath.MAX_SQRT_RATIO - ONE;

          const { result } = await client.simulateContract({
            address: poolAddress,
            abi: EXPERIMENTAL_POOL_ABI,
            functionName: "quoteSwap",
            args: [
              ZERO_ADDRESS,
              zeroForOne,
              parseUnits(debounced, tokenA.decimals),
              sqrtLimit,
              false,
              encodePacked(
                ["address", "uint24", "address"],
                [tokenA.wrapped.address0, pool.fee, tokenB.wrapped.address0],
              ),
            ],
          });

          if (result >= 0n) return null;
          return { fee: pool.fee, output: result * NEGATIVE_ONE, pool };
        }),
      );

      if (!active) return;

      // collect only fulfilled + non-null results
      const quotes: Quote[] = settled.reduce<Quote[]>((acc, res) => {
        if (res.status === "fulfilled" && res.value) {
          // here `res.value` is guaranteed to be non-null Quote
          acc.push(res.value);
        }
        return acc;
      }, []);

      if (quotes.length === 0) {
        setError(TradeError.NO_LIQUIDITY);
        setTrade(null);
        setLoading(false);
        return;
      }

      // pick the best output
      const best = quotes.reduce((a, b) => (b.output > a.output ? b : a));

      const trade = Trade.createUncheckedTrade({
        route: new Route([best.pool], tokenA, tokenB),
        inputAmount: CurrencyAmount.fromRawAmount(
          tokenA,
          parseUnits(debounced, tokenA.decimals).toString(),
        ),
        outputAmount: CurrencyAmount.fromRawAmount(tokenB, best.output),
        tradeType: TradeType.EXACT_INPUT,
      });

      if (!active) return;
      setTrade(trade);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [
    tokenA,
    tokenB,
    debounced,
    pools,
    client,
    address,
    chainId,
    setTrade,
    setError,
    setLoading,
    typedValue,
  ]);
}

export function useMarginTradeComputation() {
  const { tokenA, tokenB } = useMarginSwapTokensStore();
  const { typedValue } = useMarginSwapAmountsStore();

  const pools = useStorePools(
    poolsFees.map((fee) => ({ currencyA: tokenA, currencyB: tokenB, tier: fee })),
  );

  const debounced = useDebounce(typedValue, 300);
  const client = usePublicClient();
  const { address } = useAccount();
  const chainId = useCurrentChainId();

  const { setTrade, setError, setLoading } = useMarginSwapTradeStore();

  // 1) Immediate loading any time raw input changes
  //
  // 1. As soon as tokens OR pools change, check for NO_POOLS
  //
  useEffect(() => {
    if (!tokenA || !tokenB) {
      // no valid pair yet
      return;
    }
    const valid = filterPools(pools);
    if (valid.length === 0) {
      setError(TradeError.NO_POOLS);
      setTrade(null);
      setLoading(false);
    } else {
      // clear that error if pools now exist
      setError(null);
    }
  }, [tokenA, tokenB, pools, setError, setLoading, setTrade]);

  //
  // 2. Immediately set loading when user types—but skip if no pools
  //
  useEffect(() => {
    const validPools = filterPools(pools);

    // 1) User cleared the field → clear trade & loading, but leave `error` alone
    if (!+typedValue) {
      setTrade(null);
      setLoading(false);
      return;
    }

    // 2) No pools → leave the NO_POOLS error intact, don’t spin
    if (validPools.length === 0) {
      return;
    }

    // 3) Valid input & pools → clear any previous runtime errors and start loading
    setError(null);
    setLoading(true);
  }, [typedValue, pools, setTrade, setError, setLoading]);

  useEffect(() => {
    let active = true;

    if (typedValue !== debounced) {
      return;
    }

    // early exits
    if (!tokenA || !tokenB || !+debounced) {
      setLoading(false);
      return;
    }

    const validPools = filterPools(pools);

    if (validPools.length === 0) {
      // already handled by effect #1
      return;
    }

    IIFE(async () => {
      // kick off all quoteSwap calls in parallel
      const settled = await Promise.allSettled<QuoteResult>(
        validPools.map(async (pool) => {
          const poolAddress = await computePoolAddressDex({
            addressTokenA: pool.token0.wrapped.address0,
            addressTokenB: pool.token1.wrapped.address0,
            tier: pool.fee,
            chainId,
          });
          if (!poolAddress || !address || !client) return null;

          const zeroForOne = tokenA.equals(pool.token0.wrapped);
          const sqrtLimit = zeroForOne
            ? TickMath.MIN_SQRT_RATIO + ONE
            : TickMath.MAX_SQRT_RATIO - ONE;

          const { result } = await client.simulateContract({
            address: poolAddress,
            abi: EXPERIMENTAL_POOL_ABI,
            functionName: "quoteSwap",
            args: [
              address,
              zeroForOne,
              parseUnits(debounced, tokenA.decimals),
              sqrtLimit,
              false,
              encodePacked(
                ["address", "uint24", "address"],
                [tokenA.wrapped.address0, pool.fee, tokenB.wrapped.address0],
              ),
            ],
          });

          if (result >= 0n) return null;
          return { fee: pool.fee, output: result * NEGATIVE_ONE, pool };
        }),
      );

      if (!active) return;

      // collect only fulfilled + non-null results
      const quotes: Quote[] = settled.reduce<Quote[]>((acc, res) => {
        if (res.status === "fulfilled" && res.value) {
          // here `res.value` is guaranteed to be non-null Quote
          acc.push(res.value);
        }
        return acc;
      }, []);

      if (quotes.length === 0) {
        setError(TradeError.NO_LIQUIDITY);
        setTrade(null);
        setLoading(false);
        return;
      }

      const best = quotes.reduce((a, b) => (b.output > a.output ? b : a));

      const trade = Trade.createUncheckedTrade({
        route: new Route([best.pool], tokenA, tokenB),
        inputAmount: CurrencyAmount.fromRawAmount(
          tokenA,
          parseUnits(debounced, tokenA.decimals).toString(),
        ),
        outputAmount: CurrencyAmount.fromRawAmount(tokenB, best.output),
        tradeType: TradeType.EXACT_INPUT,
      });

      if (!active) return;
      setTrade(trade);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [
    tokenA,
    tokenB,
    debounced,
    pools,
    client,
    address,
    chainId,
    setTrade,
    setError,
    setLoading,
    typedValue,
  ]);
}
