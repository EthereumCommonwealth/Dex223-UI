"use client";

import { useEffect, useRef } from "react";

import { SwapStatus, useSwapStatusStore } from "@/app/[locale]/swap/stores/useSwapStatusStore";
import { trackEvent } from "@/lib/analytics";

/**
 * Reports the swap funnel to GA4 by watching the status machine, rather than by
 * scattering gtag calls through the swap code. One place to audit, and it cannot
 * double-fire because it only reacts to a change of status.
 */
export function useSwapAnalytics(context: {
  tokenIn?: string;
  tokenOut?: string;
  chainId?: number;
}) {
  const { status } = useSwapStatusStore();
  const previous = useRef<SwapStatus | null>(null);

  useEffect(() => {
    if (previous.current === status) return;
    const from = previous.current;
    previous.current = status;

    // The first render reports INITIAL, which is not a transition anyone took.
    if (from === null) return;

    const params = {
      token_in: context.tokenIn,
      token_out: context.tokenOut,
      chain_id: context.chainId,
    };

    switch (status) {
      case SwapStatus.PENDING_APPROVE:
        trackEvent("swap_approve_started", params);
        break;
      case SwapStatus.PENDING:
        trackEvent("swap_started", params);
        break;
      case SwapStatus.SUCCESS:
        trackEvent("swap_completed", params);
        break;
      case SwapStatus.ERROR:
        trackEvent("swap_failed", params);
        break;
      case SwapStatus.APPROVE_ERROR:
        trackEvent("swap_approve_failed", params);
        break;
      default:
        break;
    }
  }, [status, context.tokenIn, context.tokenOut, context.chainId]);
}
