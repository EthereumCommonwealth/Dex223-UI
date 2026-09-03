import gql from "graphql-tag";
import { useBalance } from "wagmi";

import useCurrentChainId from "@/hooks/useCurrentChainId";
import { FeeAmount } from "@/sdk_bi/constants";
import { Currency } from "@/sdk_bi/entities/currency";
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
  fee,
}: {
  tokenA: Currency | undefined;
  tokenB: Currency | undefined;
  fee: FeeAmount | undefined;
}) => {
  const chainId = useCurrentChainId();

  const { poolAddress } = useComputePoolAddressDex({
    tokenA,
    tokenB,
    tier: fee,
  });

  // const { data: erc20BalanceToken0 } = useBalance({
  //   address: poolAddress,
  //   token: tokenA ? tokenA.wrapped.address0 : undefined,
  // });
  //
  // const { data: erc223BalanceToken0 } = useBalance({
  //   address: poolAddress,
  //   token: tokenA ? tokenA.wrapped.address1 : undefined,
  // });

  const { data: erc20BalanceToken1 } = useBalance({
    address: poolAddress,
    chainId,
    token: tokenB ? tokenB.wrapped.address0 : undefined,
  });

  const { data: erc223BalanceToken1 } = useBalance({
    address: poolAddress,
    chainId,
    token: tokenB ? tokenB.wrapped.address1 : undefined,
  });

  return { erc20BalanceToken1, erc223BalanceToken1 };
};
