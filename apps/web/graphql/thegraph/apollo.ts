import {
  ApolloClient,
  ApolloLink,
  concat,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

import { DexChainId } from "@/sdk_bi/chains";

const CHAIN_SUBGRAPH_URL: Record<DexChainId, string> = {
  // [ChainId.MAINNET]: "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3?source=uniswap",
  // [ChainId.ARBITRUM_ONE]:
  //   "https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-arbitrum-one?source=uniswap",
  // [ChainId.OPTIMISM]:
  //   "https://api.thegraph.com/subgraphs/name/ianlapham/optimism-post-regenesis?source=uniswap",
  // [ChainId.POLYGON]:
  //   "https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-polygon?source=uniswap",
  // [ChainId.CELO]: "https://api.thegraph.com/subgraphs/name/jesse-sawa/uniswap-celo?source=uniswap",
  // [ChainId.BNB]: "https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-bsc?source=uniswap",
  // [ChainId.AVALANCHE]:
  //   "https://api.thegraph.com/subgraphs/name/lynnshaoyu/uniswap-v3-avax?source=uniswap",
  // [ChainId.BASE]:
  //   "https://api.studio.thegraph.com/query/48211/uniswap-v3-base/version/latest?source=uniswap",
  [DexChainId.MAINNET]:
    "https://gateway.thegraph.com/api/subgraphs/id/78wjdcwJTbTmvhnUcyXjZVDPk5kWGFuosEuEWDimvHf2",
  [DexChainId.SEPOLIA]:
    "https://gateway.thegraph.com/api/subgraphs/id/9oohHEx5ivUXguYBGVJojrKuBQHLtLzg7df1pUC6mg8w",
  // [DexChainId.CALLISTO]: "",
  [DexChainId.BSC_TESTNET]: "https://api.studio.thegraph.com/query/56540/dex223-v1-chapel/1.0.82",
  [DexChainId.EOS]: "https://graph.dex223.io/subgraphs/name/dex223-eosevm",
};

const httpLink = new HttpLink({ uri: CHAIN_SUBGRAPH_URL[DexChainId.MAINNET] });

export function getAuthMiddleware(chainId: DexChainId) {
  return new ApolloLink((operation, forward) => {
    operation.setContext(() => ({
      uri:
        chainId && CHAIN_SUBGRAPH_URL[chainId]
          ? CHAIN_SUBGRAPH_URL[chainId]
          : CHAIN_SUBGRAPH_URL[DexChainId.SEPOLIA],
    }));

    return forward(operation);
  });
}

const authLink = setContext((_, { headers }) => {
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: `Bearer ${process.env.NEXT_PUBLIC_AUTH_TOKEN_GQL}`,
    },
  };
});

export function apolloClient(chainId: DexChainId) {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: authLink.concat(concat(getAuthMiddleware(chainId), httpLink)),
  });
}

export const chainToApolloClient: Record<DexChainId, ApolloClient<NormalizedCacheObject>> = {
  [DexChainId.MAINNET]: new ApolloClient({
    cache: new InMemoryCache(),
    link: authLink.concat(concat(getAuthMiddleware(DexChainId.MAINNET), httpLink)),
  }),
  // [ChainId.ARBITRUM_ONE]: new ApolloClient({
  //   cache: new InMemoryCache(),
  //   uri: CHAIN_SUBGRAPH_URL[ChainId.ARBITRUM_ONE],
  // }),
  // [ChainId.OPTIMISM]: new ApolloClient({
  //   cache: new InMemoryCache(),
  //   uri: CHAIN_SUBGRAPH_URL[ChainId.OPTIMISM],
  // }),
  // [ChainId.POLYGON]: new ApolloClient({
  //   cache: new InMemoryCache(),
  //   uri: CHAIN_SUBGRAPH_URL[ChainId.POLYGON],
  // }),
  // [ChainId.CELO]: new ApolloClient({
  //   cache: new InMemoryCache(),
  //   uri: CHAIN_SUBGRAPH_URL[ChainId.CELO],
  // }),
  // [ChainId.BNB]: new ApolloClient({
  //   cache: new InMemoryCache(),
  //   uri: CHAIN_SUBGRAPH_URL[ChainId.BNB],
  // }),
  // [ChainId.AVALANCHE]: new ApolloClient({
  //   cache: new InMemoryCache(),
  //   uri: CHAIN_SUBGRAPH_URL[ChainId.AVALANCHE],
  // }),
  [DexChainId.SEPOLIA]: new ApolloClient({
    cache: new InMemoryCache(),
    link: authLink.concat(concat(getAuthMiddleware(DexChainId.SEPOLIA), httpLink)),
  }),
  [DexChainId.BSC_TESTNET]: new ApolloClient({
    cache: new InMemoryCache(),
    uri: CHAIN_SUBGRAPH_URL[DexChainId.SEPOLIA],
  }),
  [DexChainId.EOS]: new ApolloClient({
    cache: new InMemoryCache(),
    uri: CHAIN_SUBGRAPH_URL[DexChainId.EOS],
  }),
  // [DexChainId.CALLISTO]: new ApolloClient({
  //   cache: new InMemoryCache(),
  //   uri: CHAIN_SUBGRAPH_URL[DexChainId.CALLISTO],
  // }),
};
