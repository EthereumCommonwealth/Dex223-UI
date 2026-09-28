import { headers } from "next/headers";

/**
 * Canonical origin for this deployment.
 *
 * sitemap.ts previously hardcoded https://test-app.dex223.io, so every URL it
 * advertised pointed at the test deployment regardless of where it was built.
 * Production builds that omit NEXT_PUBLIC_SITE_URL must still advertise
 * https://app.dex223.io, or robots.txt keeps the whole app out of Google.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NEXT_PUBLIC_ENV === "production"
    ? "https://app.dex223.io"
    : "https://test-app.dex223.io")
).replace(/\/$/, "");

const PRODUCTION_HOST = "app.dex223.io";

async function requestHost(): Promise<string> {
  try {
    const headerList = await headers();
    const raw = headerList.get("x-forwarded-host") || headerList.get("host") || "";
    return raw.split(",")[0].trim().split(":")[0].toLowerCase();
  } catch {
    return "";
  }
}

/**
 * Only https://app.dex223.io should be crawlable. Test, preview, and the
 * converter subdomain stay blocked so they do not compete with production.
 * The live Host is the signal: production builds were shipping the test-app
 * default and Search Console reported every app URL as unknown to Google.
 */
export async function indexingOrigin(): Promise<{ url: string; indexable: boolean }> {
  const host = await requestHost();

  if (host === PRODUCTION_HOST) {
    return { url: `https://${PRODUCTION_HOST}`, indexable: true };
  }

  if (host) {
    return { url: `https://${host}`, indexable: false };
  }

  const indexable =
    process.env.NEXT_PUBLIC_ENV === "production" &&
    !/test-|staging|preview|localhost/.test(SITE_URL);

  return { url: SITE_URL, indexable };
}
