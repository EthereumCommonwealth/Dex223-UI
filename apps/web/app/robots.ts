import type { MetadataRoute } from "next";

import { indexingOrigin } from "@/config/site";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { url, indexable } = await indexingOrigin();

  // Test and preview deployments must not compete with production.
  if (!indexable) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Account pages and routes keyed by a position, order, or pool id are
        // private or unbounded. Keep them out of the crawl.
        disallow: [
          "/*/portfolio",
          "/*/pools/positions",
          "/*/send",
          "/*/pay",
          "/*/dev",
          "/*/multisig",
          "/*/requests",
          "/*/remove/",
          "/*/increase/",
          "/*/pool/",
          "/*/margin-trading/position/",
          "/*/margin-trading/lending-order/",
          "/api/",
        ],
      },
    ],
    sitemap: `${url}/sitemap.xml`,
    host: url,
  };
}
