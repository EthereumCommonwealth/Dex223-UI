import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useMemo } from "react";
import { useReadContracts } from "wagmi";

import { POOL_STATE_ABI } from "@/config/abis/poolState";
import { apolloClient } from "@/graphql/thegraph/apollo";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { FeeAmount } from "@/sdk_hybrid/constants";
import { Currency } from "@/sdk_hybrid/entities/currency";
import { Pool } from "@/sdk_hybrid/entities/pool";
import { Tick } from "@/sdk_hybrid/entities/tick";
import {
  getPoolAddressKey,
  useComputePoolAddressesDex,
} from "@/sdk_hybrid/utils/computePoolAddress";
import { usePoolsStore } from "@/stores/usePoolsStore";

import useDeepEffect from "./useDeepEffect";
import useDeepMemo from "./useDeepMemo";

export enum PoolState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID,
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
// TODO: mb we need to add loading state

const query = gql`
  query PoolsTicks($addresses: [ID!]) {
    pools(where: { id_in: $addresses }) {
      id
      ticks {
        tickIdx
        liquidityGross
        liquidityNet
      }
    }
  }
`;

export const usePools = (poolsParams: PoolsParams): PoolsResult => {
  const { pools, addPool } = usePoolsStore();
  const chainId = useCurrentChainId();

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
  const poolAddresses = useComputePoolAddressesDex(poolAddressesParams);

  console.log(poolAddresses);
  console.log(chainId);

  const _apolloClient = useMemo(() => {
    return apolloClient(chainId);
  }, [chainId]);

  const { data, loading } = useQuery(query, {
    variables: {
      addresses: poolAddresses.map((p) => p?.address?.toLowerCase()),
    },
    client: _apolloClient,
  });

  const ticksMap = useMemo(() => {
    const _temp: { [key: string]: Tick[] } = {};

    if (data?.pools) {
      for (let i = 0; i < data.pools.length; i++) {
        _temp[data.pools[i].id] = data.pools[i].ticks.map(
          (_tick: any) =>
            new Tick({
              index: _tick.tickIdx,
              liquidityGross: _tick.liquidityGross,
              liquidityNet: _tick.liquidityNet,
            }),
        );
      }
    }

    return _temp;
  }, [data?.pools]);

  const slot0Contracts = useMemo(() => {
    return poolAddresses.map((address) => {
      return {
        abi: POOL_STATE_ABI,
        address: address?.address,
        functionName: "slot0",
      };
    });
  }, [poolAddresses]);

  const liquidityContracts = useMemo(() => {
    return poolAddresses.map((address) => {
      return {
        abi: POOL_STATE_ABI,
        address: address?.address,
        functionName: "liquidity",
      };
    });
  }, [poolAddresses]);

  const { data: slot0Data, isLoading: slot0Loading } = useReadContracts({
    contracts: slot0Contracts,
  });

  const { data: liquidityData, isLoading: liquidityLoading } = useReadContracts({
    contracts: liquidityContracts,
  });

  useDeepEffect(() => {
    poolTokens.forEach((tokens, index) => {
      if (!tokens || slot0Loading || liquidityLoading || !chainId) return;
      if (!slot0Data || slot0Data[index].error) return;
      if (!liquidityData || liquidityData[index].error) return;
      if (!slot0Data[index]) return;
      if (!liquidityData[index]) return;
      const [sqrtPriceX96, tick] = slot0Data[index].result as [bigint, number];
      if (!sqrtPriceX96 || sqrtPriceX96 === BigInt(0)) return [PoolState.NOT_EXISTS, null];

      const { token0, token1, tier } = tokens;

      const key = getPoolAddressKey({
        addressTokenA: token0.wrapped.address0,
        addressTokenB: token1.wrapped.address0,
        chainId,
        tier,
      });

      const existedPool = pools[key];
      if (existedPool) return;

      const liquidity = liquidityData[index].result as bigint;
      try {
        const ticks =
          poolAddresses?.[index]?.address && ticksMap
            ? ticksMap[poolAddresses[index]!.address!.toLowerCase()]?.sort(
                (a, b) => a.index - b.index,
              )
            : undefined;

        if (!ticks) {
          return;
        }

        const newPool = new Pool(
          token0,
          token1,
          tier,
          sqrtPriceX96.toString(),
          liquidity.toString(),
          tick,
          ticks,
        );
        addPool(key, newPool);
        return [PoolState.EXISTS, newPool];
      } catch (error) {
        console.error("Error when constructing the pool", error);
        return [PoolState.NOT_EXISTS, null];
      }
    });
  }, [
    poolsParams,
    poolTokens,
    slot0Data,
    liquidityData,
    slot0Loading,
    liquidityLoading,
    pools,
    addPool,
    chainId,
    poolAddresses,
    ticksMap,
  ]);

  //
  const poolKeys = useDeepMemo(() => {
    return poolTokens.map((poolToken) => {
      if (!poolToken) return undefined;
      const { tier, token0, token1 } = poolToken;
      if (!token0 || !token1 || !tier || !chainId) return undefined;
      return getPoolAddressKey({
        addressTokenA: token0.wrapped.address0,
        addressTokenB: token1.wrapped.address0,
        chainId,
        tier,
      });
    });
  }, [poolsParams, chainId]);

  return useDeepMemo(() => {
    return poolKeys.map((key) => {
      if (!key) return [PoolState.INVALID, null];
      const pool = pools[key];
      if (!pool) {
        return [PoolState.NOT_EXISTS, null];
      }
      return [PoolState.EXISTS, pool];
    });
  }, [pools, poolKeys]);
};

export function usePool(poolParamas: PoolParams): [PoolState, Pool | null] {
  const poolsParams = useDeepMemo(() => [poolParamas], [poolParamas]);
  return usePools(poolsParams)[0];
}
