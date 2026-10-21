import { useQuery } from "@tanstack/react-query";
import gql from "graphql-tag";

import { chainToApolloClient } from "@/graphql/thegraph/apollo";
import { DexChainId } from "@/sdk_bi/chains";

import { PoolState } from "./book";

const POOL_STATE = gql`
  query ChartPoolDepth($pool: ID!, $address: String!, $skip: Int!) {
    pool(id: $pool) {
      liquidity
      sqrtPrice
      token0 {
        decimals
      }
      token1 {
        decimals
      }
    }
    ticks(
      first: 1000
      skip: $skip
      where: { poolAddress: $address, liquidityNet_not: "0" }
      orderBy: tickIdx
    ) {
      tickIdx
      liquidityNet
    }
  }
`;

interface Response {
  pool: {
    liquidity: string;
    sqrtPrice: string;
    token0: { decimals: string };
    token1: { decimals: string };
  } | null;
  ticks: { tickIdx: string; liquidityNet: string }[];
}

// A pool with more initialized ticks than this is read up to here; the ticks nearest the
// price come first only by chance, so the cap is generous.
const MAX_PAGES = 5;

async function fetchPoolState(chainId: number, pool: string): Promise<PoolState | null> {
  const client = chainToApolloClient[chainId as DexChainId];
  if (!client) return null;
  const address = pool.toLowerCase();

  let head: Response["pool"] = null;
  const ticks: PoolState["ticks"] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data } = await client.query<Response>({
      query: POOL_STATE,
      variables: { pool: address, address, skip: page * 1000 },
      fetchPolicy: "network-only",
    });
    if (page === 0) head = data.pool;
    for (const t of data.ticks) {
      ticks.push({ tick: Number(t.tickIdx), liquidityNet: BigInt(t.liquidityNet) });
    }
    if (data.ticks.length < 1000) break;
  }
  if (!head || head.sqrtPrice === "0") return null;

  return {
    ticks,
    sqrtPriceX96: BigInt(head.sqrtPrice),
    liquidity: BigInt(head.liquidity),
    decimals0: Number(head.token0.decimals),
    decimals1: Number(head.token1.decimals),
  };
}

/** A pool's price and liquidity by tick, from the Dex223 subgraph. */
export function usePoolState(chainId: number, pool: string | null) {
  return useQuery({
    queryKey: ["chart-pool-depth", chainId, pool],
    queryFn: () => fetchPoolState(chainId, pool!),
    enabled: !!pool,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}
