import { isMarginDeployed } from "@/config/modules";
import { networks } from "@/config/networks";
import useCurrentChainId from "@/hooks/useCurrentChainId";

/** True when the margin module contract is deployed on the connected or selected chain. */
export default function useIsMarginAvailable(): boolean {
  const chainId = useCurrentChainId();

  return isMarginDeployed(chainId);
}

/**
 * Borrow/Lend stays Coming soon on app.dex223.io.
 * That site is the production build (NEXT_PUBLIC_ENV=production), where the only
 * network is Ethereum and the margin contract is not deployed.
 * test-app.dex223.io is the development build, so the nav opens there when any
 * listed network has the contract (Sepolia). The page still refuses a chain
 * that has no deployment.
 */
export function isBorrowLendComingSoon(): boolean {
  if (process.env.NEXT_PUBLIC_ENV === "production") {
    return true;
  }

  return !networks.some((network) => isMarginDeployed(network.chainId));
}
