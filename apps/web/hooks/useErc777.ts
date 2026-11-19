import { useMemo } from "react";
import { Address, isAddress, zeroAddress } from "viem";
import { useReadContract, useReadContracts } from "wagmi";

import {
  ERC777_TOKEN_INTERFACE_HASH,
  ERC1820_ABI,
  ERC1820_REGISTRY_ADDRESS,
} from "@/config/abis/erc1820";
import useCurrentChainId from "@/hooks/useCurrentChainId";

// The converter supports only ERC-20 and ERC-223. ERC-777 tokens also expose the ERC-20 interface,
// but their transfer hooks break the converter, so the UI flags them as unsupported.
export function isErc777Implementer(implementer: unknown): boolean {
  return typeof implementer === "string" && isAddress(implementer) && implementer !== zeroAddress;
}

const registryCall = (address: Address, chainId: number) =>
  ({
    abi: ERC1820_ABI,
    address: ERC1820_REGISTRY_ADDRESS,
    functionName: "getInterfaceImplementer",
    args: [address, ERC777_TOKEN_INTERFACE_HASH],
    chainId,
  }) as const;

export function useIsErc777(address?: string) {
  const chainId = useCurrentChainId();
  const enabled = !!address && isAddress(address);

  const { data, isLoading } = useReadContract({
    ...registryCall(address as Address, chainId),
    query: { enabled, retry: false },
  });

  return { isErc777: enabled && isErc777Implementer(data), isLoading: enabled && isLoading };
}

// Lower-cased addresses of the given tokens that are registered as ERC-777.
export function useErc777Addresses(addresses: Address[]) {
  const chainId = useCurrentChainId();
  const unique = useMemo(
    () => Array.from(new Set(addresses.map((a) => a.toLowerCase() as Address))),
    [addresses],
  );

  const { data } = useReadContracts({
    contracts: unique.map((a) => registryCall(a, chainId)),
    query: { enabled: unique.length > 0 },
  });

  return useMemo(() => {
    const flagged = new Set<string>();
    data?.forEach((res, i) => {
      if (res.status === "success" && isErc777Implementer(res.result)) flagged.add(unique[i]);
    });
    return flagged;
  }, [data, unique]);
}
