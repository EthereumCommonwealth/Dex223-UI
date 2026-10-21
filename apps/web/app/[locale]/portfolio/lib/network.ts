import { useAccount } from "wagmi";

import { networks } from "@/config/networks";

/**
 * A connected wallet on a chain this build does not list should not be shown
 * the development fallback chain's balances.
 */
export function usePortfolioNetworkSupported() {
  const { chainId, isConnected } = useAccount();

  return !isConnected || chainId == null || networks.some((network) => network.chainId === chainId);
}
