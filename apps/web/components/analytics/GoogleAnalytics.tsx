"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * Replaces anything that identifies a user or their positions with a placeholder.
 *
 * The app routes on pool addresses, token ids, lending order ids and wallet
 * addresses. Sending those verbatim as `page_path` would put per-user identifiers
 * into Google Analytics, where they are effectively permanent and out of our
 * control. GA4's own audit for this property calls this out explicitly.
 *
 * EVM addresses and transaction hashes are always collapsed. Numeric ids are only
 * collapsed on the routes where the number identifies a user's own position -
 * deliberately not by digit length, because chain ids are long numbers too and are a
 * dimension worth keeping: `/en/pools/11155111/0xabc...def` should report as
 * `/en/pools/11155111/:address`, not lose the chain.
 */
const POSITION_ID_ROUTES = ["pool", "remove", "increase", "position", "lending-order"];

export function redactPath(pathname: string): string {
  const positionIdPattern = new RegExp(
    `(?<=/(?:${POSITION_ID_ROUTES.join("|")})/)\\d+(?=/|$)`,
    "g",
  );
  return pathname
    .replace(/0x[a-fA-F0-9]{64}/g, ":txHash")
    .replace(/0x[a-fA-F0-9]{40}/g, ":address")
    .replace(positionIdPattern, ":id");
}

/**
 * Query strings on this app can carry token addresses and amounts, so only a small
 * allowlist is forwarded. Everything else is dropped rather than redacted, because a
 * value we have not thought about is more likely to be sensitive than useful.
 */
const ALLOWED_QUERY_KEYS = new Set(["tab", "chain", "referrer", "utm_source", "utm_medium", "utm_campaign"]);

function sanitizeQuery(params: URLSearchParams): string {
  const kept = new URLSearchParams();
  params.forEach((value, key) => {
    if (ALLOWED_QUERY_KEYS.has(key)) kept.append(key, value);
  });
  const s = kept.toString();
  return s ? `?${s}` : "";
}

function PageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_ID || typeof window === "undefined" || !window.gtag) return;

    const path = redactPath(pathname) + sanitizeQuery(searchParams);
    window.gtag("event", "page_view", {
      page_path: path,
      page_location: `${window.location.origin}${path}`,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}

export default function GoogleAnalytics() {
  // No measurement id configured (local dev, previews) - render nothing rather than
  // loading a tag that would 404 or pollute the property with non-production traffic.
  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'granted'
          });
          gtag('config', '${GA_ID}', {
            send_page_view: false,
            anonymize_ip: true,
            allow_google_signals: false,
            allow_ad_personalization_signals: false
          });
        `}
      </Script>
      {/* useSearchParams needs a Suspense boundary or it opts the whole tree out of
          static rendering. */}
      <Suspense fallback={null}>
        <PageViews />
      </Suspense>
    </>
  );
}
