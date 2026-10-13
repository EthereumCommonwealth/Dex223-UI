import { useEffect, useState } from "react";

import { useMarginSwapTokensStore } from "@/app/[locale]/margin-swap/stores/useMarginSwapTokensStore";
import { getDefaultStandard } from "@/functions/getDefaultStandard";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { useSwapTokens } from "@/hooks/useTokenLists";
import { DexChainId } from "@/sdk_bi/chains";
import { Token } from "@/sdk_bi/entities/token";

// Pair preselected on the margin swap page when no tokens are picked yet, so the trading chart shows
// right away: the chain's native coin against this token. Sepolia D223 has a live WETH pool. It is
// spelled out here because otherwise it only arrives through the core subgraph, which Studio often
// rate-limits.
const DEFAULT_MARGIN_SWAP_TOKEN_B: Partial<Record<DexChainId, Token>> = {
  [DexChainId.SEPOLIA]: new Token(
    DexChainId.SEPOLIA,
    "0xc7231d0F96e83cE98E0650fc4Be8Ca92e2E24cc5",
    "0xD22051AccB04Cee5d5Eaed03aD032C3d8925Cdc3",
    18,
    "D223",
    "Dex223 (test)",
    "/images/tokens/DEX.svg",
  ),
};

export function useMarginSwapDefaultPair() {
  const [isInitialized, setIsInitialized] = useState(false);
  const chainId = useCurrentChainId();
  const { tokens, isLoading } = useSwapTokens();
  const { tokenA, tokenB, setTokenA, setTokenB, setTokenAStandard, setTokenBStandard } =
    useMarginSwapTokensStore();

  useEffect(() => {
    if (isInitialized || tokens.length < 1 || isLoading) return;
    setIsInitialized(true);

    const defaultTokenB = DEFAULT_MARGIN_SWAP_TOKEN_B[chainId];
    if (tokenA || tokenB || !defaultTokenB) return;

    const native = tokens.find((t) => t.isNative);
    if (!native) return;

    const listed = tokens.find((t) => t.isToken && t.equals(defaultTokenB));
    setTokenA(native);
    setTokenAStandard(getDefaultStandard(native));
    setTokenB(listed || defaultTokenB);
    setTokenBStandard(getDefaultStandard(listed || defaultTokenB));
  }, [
    chainId,
    isInitialized,
    isLoading,
    setTokenA,
    setTokenAStandard,
    setTokenB,
    setTokenBStandard,
    tokenA,
    tokenB,
    tokens,
  ]);
}
