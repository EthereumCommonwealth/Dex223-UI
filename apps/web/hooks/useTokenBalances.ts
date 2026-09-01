import { useCallback } from "react";
import { Address } from "viem";
import { useAccount, useBalance } from "wagmi";

import useCurrentChainId from "@/hooks/useCurrentChainId";
import { Currency } from "@/sdk_bi/entities/currency";

export default function useTokenBalances(currency: Currency | undefined | null, address?: Address) {
  const { address: userAddress } = useAccount();
  const chainId = useCurrentChainId();

  const _address = address || userAddress;

  const { data: erc20Balance, refetch: refetch20 } = useBalance({
    address: currency ? _address : undefined,
    chainId,
    token: currency && !currency.isNative ? currency.address0 : undefined,
    query: {
      enabled: Boolean(currency),
    },
  });
  const { data: erc223Balance, refetch: refetch223 } = useBalance({
    address: currency ? _address : undefined,
    chainId,
    token: currency && !currency.isNative ? currency.address1 : undefined,
    query: {
      enabled: Boolean(currency),
    },
  });

  const refetch = useCallback(() => {
    // console.log("Balances refetching...");
    refetch20();
    refetch223();
  }, [refetch20, refetch223]);

  return { balance: { erc20Balance, erc223Balance }, refetch };
}
