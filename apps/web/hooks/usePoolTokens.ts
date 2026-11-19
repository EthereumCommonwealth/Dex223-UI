import { gql, useQuery } from "@apollo/client";
import { useMemo } from "react";
import { Address, getAddress, isAddress } from "viem";

import { CHAIN_SUBGRAPH_URL, chainToApolloClient } from "@/graphql/thegraph/apollo";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { DexChainId } from "@/sdk_bi/chains";
import { Token } from "@/sdk_bi/entities/token";

const PoolTokensDocument = gql`
  query PoolTokensQuery($first: Int!) {
    pools(first: $first) {
      token0 {
        id
        addressERC223
        symbol
        name
        decimals
      }
      token1 {
        id
        addressERC223
        symbol
        name
        decimals
      }
    }
  }
`;

// Only chains whose Apollo client queries that chain's own core subgraph. The BSC testnet client
// points at the Sepolia URL, and most other chains have no subgraph yet.
const POOL_TOKEN_CHAINS = new Set<DexChainId>([DexChainId.MAINNET, DexChainId.SEPOLIA]);

type SubgraphToken = {
  id: string;
  addressERC223: string | null;
  symbol: string | null;
  name: string | null;
  decimals: string | null;
};

// Every token that has a pool on this chain's factory, read from the core subgraph. A pool can
// exist for a token that no enabled token list carries (for example a token listed only in a
// retired autolisting), and such a token is still tradeable through that pool.
export function usePoolTokens(): { tokens: Token[]; isLoading: boolean } {
  const chainId = useCurrentChainId();
  const apolloClient =
    POOL_TOKEN_CHAINS.has(chainId) && CHAIN_SUBGRAPH_URL[chainId]
      ? chainToApolloClient[chainId]
      : undefined;

  const { data, loading } = useQuery<{ pools: { token0: SubgraphToken; token1: SubgraphToken }[] }>(
    PoolTokensDocument,
    {
      variables: { first: 1000 },
      skip: !apolloClient,
      client: apolloClient || chainToApolloClient[DexChainId.SEPOLIA],
    },
  );

  const tokens = useMemo(() => {
    if (!data?.pools) return [];

    const map = new Map<string, Token>();
    data.pools.forEach(({ token0, token1 }) => {
      [token0, token1].forEach((t) => {
        // Tokens without decimals() cannot be priced or amounted, and an ERC-223 address is
        // required to build a Token, so both are skipped.
        if (!t || t.decimals == null || !t.addressERC223) return;
        if (!isAddress(t.id) || !isAddress(t.addressERC223)) return;
        const key = t.id.toLowerCase();
        if (map.has(key)) return;
        map.set(
          key,
          new Token(
            chainId,
            getAddress(t.id) as Address,
            getAddress(t.addressERC223) as Address,
            +t.decimals,
            t.symbol || "Unknown",
            t.name || "Unknown",
            "/images/tokens/placeholder.svg",
          ),
        );
      });
    });
    return [...map.values()];
  }, [chainId, data]);

  return { tokens, isLoading: loading };
}
