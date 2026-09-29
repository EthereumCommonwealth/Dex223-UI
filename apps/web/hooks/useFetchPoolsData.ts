import { useLazyQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useCallback, useMemo } from "react";
import { Address } from "viem";
import { usePublicClient } from "wagmi";
import { readContracts } from "wagmi/actions";

import { POOL_STATE_ABI } from "@/config/abis/poolState";
import { config } from "@/config/wagmi/config";
import { apolloClient } from "@/graphql/thegraph/apollo";
import { ZERO_ADDRESS } from "@/hooks/useCollectFees";
import { FeeAmount } from "@/sdk_bi/constants";
import { Currency } from "@/sdk_bi/entities/currency";
import { Pool } from "@/sdk_bi/entities/pool";
import { Tick } from "@/sdk_bi/entities/tick";

const POOL_QUERY = gql`
  query PoolsTicks($addresses: [ID!]) {
    pools(where: { id_in: $addresses }) {
      id
      liquidity
      tick
      sqrtPrice
      ticks {
        tickIdx
        liquidityGross
        liquidityNet
      }
    }
  }
`;

export const useFetchPoolData = (chainId: number) => {
  const _apolloClient = useMemo(() => {
    return apolloClient(chainId);
  }, [chainId]);

  const [triggerQuery] = useLazyQuery(POOL_QUERY, {
    client: _apolloClient,
  });

  return useCallback(
    async (key: string, address: Address, token0: Currency, token1: Currency, tier: FeeAmount) => {
      try {
        if (address === ZERO_ADDRESS) {
          return null;
        }
        // Step 1: Query GraphQL for ticks
        console.log(address);
        const queryResult = await triggerQuery({
          variables: { addresses: [address.toLowerCase()] },
        });

        const poolGqlData = queryResult.data?.pools?.[0];
        console.log("gqldata:", poolGqlData);
        if (!poolGqlData) {
          // Pool does not exist in the subgraph
          return null;
        }

        const ticks = poolGqlData.ticks
          .map(
            (_tick: any) =>
              new Tick({
                index: _tick.tickIdx,
                liquidityGross: _tick.liquidityGross,
                liquidityNet: _tick.liquidityNet,
              }),
          )
          .sort((a: Tick, b: Tick) => a.index - b.index);

        const liquidity = BigInt(poolGqlData.liquidity);

        const sqrtPriceX96 = BigInt(poolGqlData.sqrtPrice);

        const tick = +poolGqlData.tick;

        if (!sqrtPriceX96 || sqrtPriceX96 === BigInt(0)) {
          return null;
        }

        return new Pool(
          token0,
          token1,
          tier,
          sqrtPriceX96.toString(),
          liquidity.toString(),
          tick,
          ticks,
        );
      } catch (err: any) {
        console.error("Error fetching pool data:", err);
        throw new Error(err.message || "Unknown error");
      }
    },
    [triggerQuery],
  );
};
