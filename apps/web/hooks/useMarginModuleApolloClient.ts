import { ApolloClient, ApolloLink, concat, HttpLink, InMemoryCache } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { useMemo } from "react";

import useCurrentChainId from "@/hooks/useCurrentChainId";
import { DexChainId } from "@/sdk_bi/chains";

const marginModuleUrlMap: Record<DexChainId, string> = {
  [DexChainId.MAINNET]:
    "https://gateway.thegraph.com/api/subgraphs/id/4Zk7s54TCuxMvJVWMzDax5QRsGVRTPoXmw58gKqzZGQi",
  [DexChainId.SEPOLIA]:
    "https://api.studio.thegraph.com/query/1760635/dex-223-margin-sepolia/version/latest",
  [DexChainId.BSC_TESTNET]:
    "https://api.studio.thegraph.com/query/56540/dex223-auto-listing-chapel/version/latest/",
  [DexChainId.EOS]: "https://graph.dex223.io/subgraphs/name/dex223-auto-listing-eosevm/",
  [DexChainId.BASE]: "",
  [DexChainId.BSC]: "",
  [DexChainId.ARBITRUM]: "",
  [DexChainId.POLYGON]: "",
  [DexChainId.AVALANCHE]: "",
  [DexChainId.OPTIMISM]: "",
  [DexChainId.MONAD]: "",
  [DexChainId.UNICHAIN]: "",
  [DexChainId.PLASMA]: "",
  [DexChainId.SONIC]: "",
  [DexChainId.LINEA]: "",
  [DexChainId.INK]: "",
  [DexChainId.MANTLE]: "",
};

const authLink = setContext((_, { headers }) => {
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_AUTH_TOKEN_GQL}`,
    },
  };
});

export default function useMarginModuleApolloClient() {
  const chainId = useCurrentChainId();

  const authMiddleware = useMemo(() => {
    return new ApolloLink((operation, forward) => {
      operation.setContext(() => ({
        uri: marginModuleUrlMap[chainId],
      }));

      return forward(operation);
    });
  }, [chainId]);

  return useMemo(() => {
    return new ApolloClient({
      cache: new InMemoryCache(),
      link: authLink.concat(
        concat(
          authMiddleware,
          new HttpLink({
            uri: marginModuleUrlMap[chainId],
          }),
        ),
      ),
    });
  }, [authMiddleware, chainId]);
}
