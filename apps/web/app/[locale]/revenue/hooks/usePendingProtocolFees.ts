import { gql, useQuery } from "@apollo/client";
import { useMemo } from "react";
import { Address } from "viem";
import { useReadContract, useReadContracts } from "wagmi";

import { FEE_COLLECTOR_ABI } from "@/config/abis/feeCollector";
import { POOL_STATE_ABI } from "@/config/abis/poolState";
import { getFeeCollectorAddress } from "@/config/modules";
import { chainToApolloClient } from "@/graphql/thegraph/apollo";
import { FACTORY_ADDRESS } from "@/sdk_bi/addresses";
import { DexChainId } from "@/sdk_bi/chains";

// Same batch size as the keeper, so one transaction stays well under the block gas limit.
export const COLLECT_BATCH_SIZE = 50;

const PoolIdsDocument = gql`
  query PoolIdsQuery($first: Int!) {
    pools(first: $first) {
      id
    }
  }
`;

export default function usePendingProtocolFees(chainId: DexChainId) {
  const configuredCollector = getFeeCollectorAddress(chainId);

  // The subgraph lists the pools of FACTORY_ADDRESS. The collector skips pools of any other factory.
  const { data: collectorFactory } = useReadContract({
    abi: FEE_COLLECTOR_ABI,
    address: configuredCollector,
    functionName: "factory",
    chainId,
    query: { enabled: Boolean(configuredCollector) },
  });
  const feeCollectorAddress =
    collectorFactory && collectorFactory.toLowerCase() === FACTORY_ADDRESS[chainId]?.toLowerCase()
      ? configuredCollector
      : undefined;

  const { data: poolsData } = useQuery<{ pools: { id: string }[] }>(PoolIdsDocument, {
    variables: { first: 1000 },
    client: chainToApolloClient[chainId],
    skip: !feeCollectorAddress || !chainToApolloClient[chainId],
  });

  const poolAddresses = useMemo(
    () => (poolsData?.pools ?? []).map((pool) => pool.id as Address),
    [poolsData],
  );

  const { data: protocolFees, refetch } = useReadContracts({
    contracts: poolAddresses.map((address) => ({
      abi: POOL_STATE_ABI,
      address,
      functionName: "protocolFees" as const,
      chainId,
    })),
    query: { enabled: Boolean(feeCollectorAddress) && poolAddresses.length > 0 },
  });

  // collectProtocol leaves 1 wei of each token in the pool, so only more than that is collectable.
  const pendingPools = useMemo(
    () =>
      poolAddresses.filter((_, index) => {
        const fees = protocolFees?.[index]?.result as readonly [bigint, bigint] | undefined;
        return Boolean(fees && (fees[0] > 1n || fees[1] > 1n));
      }),
    [poolAddresses, protocolFees],
  );

  return { feeCollectorAddress, pendingPools, refetchPendingPools: refetch };
}
