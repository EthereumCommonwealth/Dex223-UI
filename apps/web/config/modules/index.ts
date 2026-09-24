import { Address } from "viem";

import { REVENUE_ADDRESS, ZERO_ADDRESS } from "@/sdk_bi/addresses";
import { DexChainId } from "@/sdk_bi/chains";

export const isMarginModuleEnabled = true;

export function isRevenueDeployed(chainId: DexChainId): boolean {
  return REVENUE_ADDRESS[chainId]?.toLowerCase() !== ZERO_ADDRESS.toLowerCase();
}

/** Fee voting is Phase 2. Page exists as Coming soon. */
export const isGovernanceVotingEnabled = false;

export function getRevenueAddress(chainId: DexChainId): Address | undefined {
  return isRevenueDeployed(chainId) ? REVENUE_ADDRESS[chainId] : undefined;
}
