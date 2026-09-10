import type { MetadataRoute } from "next";

import { SITE_URL, isIndexable } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  // The previous public/robots.txt was an unconditional "Disallow: /", which is correct
  // for the test deployment but shipped to production too - Search Console reports the
  // application as "URL is unknown to Google", never crawled. Gate it on the deployment
  // instead of blocking everywhere.
  if (!isIndexable()) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Routes keyed by a position or pool identifier are per-user and endless;
        // there is nothing for a crawler to gain and they would burn crawl budget.
        disallow: [
          "/*/remove/",
          "/*/increase/",
          "/*/pool/",
          "/*/margin-trading/position/",
          "/*/margin-trading/lending-order/",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
