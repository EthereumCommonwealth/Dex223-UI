import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { Address } from "viem";
import { useAccount, useBalance } from "wagmi";

import { chainToApolloClient } from "@/graphql/thegraph/apollo";
import { DexChainId } from "@/sdk_bi/chains";
import { FeeAmount } from "@/sdk_bi/constants";
import { Currency } from "@/sdk_bi/entities/currency";
import { Token } from "@/sdk_bi/entities/token";
import { useComputePoolAddressDex } from "@/sdk_bi/utils/computePoolAddress";
export const PoolDataDocument = gql`
  query PoolDataQuery($id: String) {
    pool(id: $id) {
      totalValueLockedToken0
      totalValueLockedToken1
    }
  }
`;

export const usePoolBalances = ({
  tokenA,
  tokenB,
}: {
  tokenA: Currency | undefined;
  tokenB: Currency | undefined;
}) => {
  const { poolAddress } = useComputePoolAddressDex({
    tokenA,
    tokenB,
    tier: FeeAmount.MEDIUM,
  });

  const { data: erc20BalanceToken0 } = useBalance({
    address: poolAddress,
    token: tokenA ? tokenA.wrapped.address0 : undefined,
  });

  const { data: erc223BalanceToken0 } = useBalance({
    address: poolAddress,
    token: tokenA ? tokenA.wrapped.address1 : undefined,
  });

  const { data: erc20BalanceToken1 } = useBalance({
    address: poolAddress,
    token: tokenB ? tokenB.wrapped.address0 : undefined,
  });

  const { data: erc223BalanceToken1 } = useBalance({
    address: poolAddress,
    token: tokenB ? tokenB.wrapped.address1 : undefined,
  });

  return { erc20BalanceToken0, erc223BalanceToken0, erc20BalanceToken1, erc223BalanceToken1 };
};
