import { Address } from "viem";

import {
  FEE_COLLECTOR_ADDRESS,
  MARGIN_TRADING_ADDRESS,
  REVENUE_ADDRESS,
  ZERO_ADDRESS,
} from "@/sdk_bi/addresses";
import { DexChainId } from "@/sdk_bi/chains";

export const isMarginModuleEnabled = true;

/**
 * The margin module only works on chains where its contract is deployed. The address map uses
 * the zero address for chains without a deployment, and nothing may be sent there.
 */
export function isMarginDeployed(chainId: DexChainId | undefined): boolean {
  if (!isMarginModuleEnabled || !chainId) {
    return false;
  }

  const address = MARGIN_TRADING_ADDRESS[chainId];
  return Boolean(address) && address.toLowerCase() !== ZERO_ADDRESS.toLowerCase();
}

export function isRevenueDeployed(chainId: DexChainId): boolean {
  return REVENUE_ADDRESS[chainId]?.toLowerCase() !== ZERO_ADDRESS.toLowerCase();
}

/** Fee voting is Phase 2. Page exists as Coming soon. */
export const isGovernanceVotingEnabled = false;

export function getRevenueAddress(chainId: DexChainId): Address | undefined {
  return isRevenueDeployed(chainId) ? REVENUE_ADDRESS[chainId] : undefined;
}

export function getFeeCollectorAddress(chainId: DexChainId): Address | undefined {
  const address = FEE_COLLECTOR_ADDRESS[chainId];
  return address && address.toLowerCase() !== ZERO_ADDRESS.toLowerCase() ? address : undefined;
}
