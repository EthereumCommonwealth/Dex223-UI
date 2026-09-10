/**
 * Canonical origin for this deployment.
 *
 * sitemap.ts previously hardcoded https://test-app.dex223.io, so every URL it
 * advertised pointed at the test deployment regardless of where it was built.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://test-app.dex223.io"
).replace(/\/$/, "");

/**
 * Only the production origin should be crawlable. Test and preview deployments
 * serving an indexable robots.txt would compete with production for the same
 * queries and split ranking signals.
 */
export function isIndexable(): boolean {
  return process.env.NEXT_PUBLIC_ENV === "production" && !/test-|staging|preview|localhost/.test(SITE_URL);
}
