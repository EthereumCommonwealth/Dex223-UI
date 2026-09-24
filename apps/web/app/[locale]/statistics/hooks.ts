import { gql, useQuery } from "@apollo/client";

import { chainToApolloClient } from "@/graphql/thegraph/apollo";
import { DexChainId } from "@/sdk_bi/chains";

export const FactoryStatsDocument = gql`
  query FactoryStatsQuery {
    factories(first: 1) {
      id
      poolCount
      txCount
      totalVolumeUSD
      totalFeesUSD
      totalValueLockedUSD
    }
  }
`;

export function useFactoryStats(chainId: DexChainId) {
  const apolloClient = chainToApolloClient[chainId];

  return useQuery(FactoryStatsDocument, {
    client: apolloClient,
    skip: !apolloClient,
    fetchPolicy: "cache-and-network",
  });
}
