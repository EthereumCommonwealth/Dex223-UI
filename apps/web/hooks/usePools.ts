import { useMemo } from "react";

import useCurrentChainId from "@/hooks/useCurrentChainId";
import { useFetchPoolData } from "@/hooks/useFetchPoolsData";
import { FeeAmount } from "@/sdk_bi/constants";
import { Currency } from "@/sdk_bi/entities/currency";
import { Pool } from "@/sdk_bi/entities/pool";
import { getPoolAddressKey, useComputePoolAddressesDex } from "@/sdk_bi/utils/computePoolAddress";
import { _usePoolsStore, usePoolAddresses, usePoolsStore } from "@/stores/usePoolsStore";

import useDeepEffect from "./useDeepEffect";
import useDeepMemo from "./useDeepMemo";

export enum PoolState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  EXISTS_WITH_NO_LIQUIDITY,
  INVALID,
  IDLE,
}

export type PoolParams = {
  currencyA: Currency | undefined;
  currencyB: Currency | undefined;
  tier: FeeAmount | undefined;
};

export type PoolsParams = PoolParams[];

export type PoolResult = [PoolState, Pool | null];
export type PoolsResult = PoolResult[];

// TODO: mb we need add additional logic to update pool data on liquidity data changes

export function useStorePools(poolsParams: PoolsParams): PoolsResult {
  const setStatus = _usePoolsStore((state) => state.setStatus);
  const pools = _usePoolsStore((state) => state.pools);
  const chainId = useCurrentChainId();
  const { addresses } = usePoolAddresses();

  const poolKeys = useMemo(() => {
    if (!chainId) return [];
    return poolsParams.map(({ currencyA, currencyB, tier }) => {
      if (!currencyA || !currencyB || !tier) return undefined;
      if (currencyA.wrapped.equals(currencyB.wrapped)) return undefined;
      const token0 = currencyA.wrapped.sortsBefore(currencyB.wrapped) ? currencyA : currencyB;
      const token1 = currencyA.wrapped.sortsBefore(currencyB.wrapped) ? currencyB : currencyA;
      return getPoolAddressKey({
        addressTokenA: token0.wrapped.address0,
        addressTokenB: token1.wrapped.address0,
        chainId,
        tier,
      });
    });
  }, [poolsParams, chainId]);

  const poolTokens: ({ token0: Currency; token1: Currency; tier: FeeAmount } | undefined)[] =
    useMemo(() => {
      if (!chainId) return [...Array(poolsParams.length)];

      return poolsParams.map(({ currencyA, currencyB, tier }) => {
        if (!currencyA || !currencyB || !tier) {
          return undefined;
        }
        const tokenA = currencyA;
        const tokenB = currencyB;
        if (tokenA.wrapped.equals(tokenB.wrapped)) return undefined;
        return {
          token0: tokenA.wrapped.sortsBefore(tokenB.wrapped) ? tokenA : tokenB,
          token1: tokenA.wrapped.sortsBefore(tokenB.wrapped) ? tokenB : tokenA,
          tier,
        };
      });
    }, [chainId, poolsParams]);

  const poolAddressesParams = useMemo(() => {
    return poolTokens.map((poolToken) => {
      if (!poolToken)
        return {
          tokenA: undefined,
          tokenB: undefined,
          tier: undefined,
        };
      const { token0, token1, tier } = poolToken;
      return {
        tokenA: token0,
        tokenB: token1,
        tier,
      };
    });
  }, [poolTokens]);

  useComputePoolAddressesDex(poolAddressesParams);

  const fetchPoolData = useFetchPoolData(chainId);

  useDeepEffect(() => {
    poolKeys.forEach((key, index) => {
      if (!key || !addresses[key] || !addresses[key].address) return;
      const poolRecord = pools[key];

      const shouldFetch =
        !poolRecord ||
        poolRecord.status === PoolState.IDLE ||
        (poolRecord.lastUpdated && poolRecord.lastUpdated < Date.now() - 60000);

      if (shouldFetch && poolRecord?.status !== PoolState.LOADING && poolTokens[index]) {
        setStatus(key, PoolState.LOADING);

        const { token0, token1, tier } = poolTokens[index];
        const address = addresses[key].address;

        fetchPoolData(key, address, token0, token1, tier)
          .then((pool) => {
            console.log(pool);
            if (pool) {
              setStatus(key, PoolState.EXISTS, pool);
            } else {
              setStatus(key, PoolState.NOT_EXISTS);
            }
          })
          .catch((err) => {
            setStatus(key, PoolState.INVALID, undefined, err.message);
          });
      }
    });
  }, [poolKeys, setStatus, fetchPoolData, poolTokens, addresses, pools]);

  // Provide the result to the hook consumer:
  return useDeepMemo(() => {
    return poolKeys.map((key) => {
      if (!key) return [PoolState.INVALID, null];

      const poolRecord = pools[key];
      if (!poolRecord) return [PoolState.NOT_EXISTS, null];

      switch (poolRecord.status) {
        case PoolState.EXISTS:
          return [PoolState.EXISTS, poolRecord.pool ?? null];
        case PoolState.NOT_EXISTS:
          return [PoolState.NOT_EXISTS, null];
        case PoolState.INVALID:
          return [PoolState.INVALID, null];
        case PoolState.LOADING:
          return [PoolState.LOADING, null];
        case PoolState.IDLE:
          return [PoolState.IDLE, null];
        default:
          return [PoolState.LOADING, null]; // Fallback just in case
      }
    });
  }, [poolKeys, pools]);
}

export function usePool(poolParamas: PoolParams): [PoolState, Pool | null] {
  const poolsParams = useDeepMemo(() => [poolParamas], [poolParamas]);
  return useStorePools(poolsParams)[0];
}
