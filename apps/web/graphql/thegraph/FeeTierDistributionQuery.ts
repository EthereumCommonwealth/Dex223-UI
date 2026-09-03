import { ApolloError, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useMemo } from "react";

import useCurrentChainId from "@/hooks/useCurrentChainId";

import { FeeTierDistributionQuery } from "./__generated__/types-and-hooks";
import { apolloClient } from "./apollo";

const query = gql`
  query FeeTierDistribution($token0: String!, $token1: String!) {
    _meta {
      block {
        number
      }
    }
    asToken0: pools(
      orderBy: totalValueLockedToken0
      orderDirection: desc
      where: { token0: $token0, token1: $token1 }
    ) {
      id
      feeTier
      totalValueLockedToken0
      totalValueLockedToken1
    }
    asToken1: pools(
      orderBy: totalValueLockedToken0
      orderDirection: desc
      where: { token0: $token1, token1: $token0 }
    ) {
      id
      feeTier
      totalValueLockedToken0
      totalValueLockedToken1
    }
  }
`;

export default function useFeeTierDistributionQuery(
  token0: string | undefined,
  token1: string | undefined,
  interval: number,
): { error?: ApolloError; isLoading: boolean; data?: FeeTierDistributionQuery } {
  const chainId = useCurrentChainId();

  const shouldSkip = useMemo(() => {
    return !token0 || !token1 || !chainId;
  }, [token0, token1, chainId]);

  const _apolloClient = useMemo(() => {
    return apolloClient(chainId);
  }, [chainId]);

  const {
    data,
    loading: isLoading,
    error,
  } = useQuery(query, {
    variables: {
      token0: token0?.toLowerCase(),
      token1: token1?.toLowerCase(),
    },
    pollInterval: interval > 0 ? interval : undefined,
    client: _apolloClient,
    skip: shouldSkip,
  });

  return useMemo(
    () => ({
      error,
      isLoading: shouldSkip ? true : isLoading,
      data: shouldSkip ? undefined : data,
    }),
    [data, error, isLoading, shouldSkip],
  );
}
