import { useCallback } from "react";
import { useAccount, useBalance } from "wagmi";

import { Currency } from "@/sdk_hybrid/entities/currency";

export default function useTokenBalances(currency: Currency | undefined) {
  const { address } = useAccount();

  const { data: erc20Balance, refetch: refetch20 } = useBalance({
    address: currency ? address : undefined,
    token: currency && !currency.isNative ? currency.address0 : undefined,
    query: {
      enabled: Boolean(currency),
    },
  });
  const { data: erc223Balance, refetch: refetch223 } = useBalance({
    address: currency ? address : undefined,
    token: currency && !currency.isNative ? currency.address1 : undefined,
    query: {
      enabled: Boolean(currency),
    },
  });

  const refetch = useCallback(() => {
    refetch20();
    refetch223();
  }, [refetch20, refetch223]);

  return { balance: { erc20Balance, erc223Balance }, refetch };
}
