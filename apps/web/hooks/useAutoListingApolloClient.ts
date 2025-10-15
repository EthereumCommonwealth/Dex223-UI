import { ApolloClient, ApolloLink, concat, HttpLink, InMemoryCache } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { useMemo } from "react";

import useCurrentChainId from "@/hooks/useCurrentChainId";
import { DexChainId } from "@/sdk_bi/chains";

const autoListingUrlMap: Record<DexChainId, string> = {
  [DexChainId.MAINNET]:
    "https://gateway.thegraph.com/api/subgraphs/id/4Zk7s54TCuxMvJVWMzDax5QRsGVRTPoXmw58gKqzZGQi",
  [DexChainId.SEPOLIA]:
    "https://gateway.thegraph.com/api/subgraphs/id/DTv1kY8trcCLBQVU2CcSEQ4mQpe7TMzcKgVqmt4ew7bY",
  [DexChainId.BSC_TESTNET]:
    "https://api.studio.thegraph.com/query/56540/dex223-auto-listing-chapel/version/latest/",
  [DexChainId.EOS]: "https://graph.dex223.io/subgraphs/name/dex223-auto-listing-eosevm/",
  [DexChainId.APE_CHAIN]:
    "https://gateway.thegraph.com/api/subgraphs/id/DYyX3trDs5ek4ehjedhBa3j3zqa3dpqDYudy7DufswBM",
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

export default function useAutoListingApolloClient() {
  const chainId = useCurrentChainId();

  const authMiddleware = useMemo(() => {
    return new ApolloLink((operation, forward) => {
      operation.setContext(() => ({
        uri: autoListingUrlMap[chainId],
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
            uri: autoListingUrlMap[chainId],
          }),
        ),
      ),
    });
  }, [authMiddleware, chainId]);
}
