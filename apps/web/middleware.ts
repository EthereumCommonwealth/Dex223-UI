import { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";

import { locales, routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

function rewriteConverterHostPath(pathname: string): string | null {
  if (pathname.includes("converter")) {
    return null;
  }

  if (pathname === "/" || pathname === "") {
    return "/converter";
  }

  for (const locale of locales) {
    if (pathname === `/${locale}` || pathname === `/${locale}/`) {
      return `/${locale}/converter`;
    }
  }

  return null;
}

// Account and id-keyed routes. Google may still fetch a linked URL, so mark
// them noindex even when robots.txt also skips them.
const PRIVATE_PATH =
  /^\/(?:[a-z]{2}\/)?(?:portfolio|pools\/positions|send|pay|dev|requests|multisig|remove\/|increase\/|pool\/|margin-trading\/(?:position|lending-order))(?:\/|$)/;

export default function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";

  if (host.startsWith("converter.")) {
    const rewrittenPath = rewriteConverterHostPath(request.nextUrl.pathname);
    if (rewrittenPath) {
      const url = request.nextUrl.clone();
      url.pathname = rewrittenPath;
      return handleI18nRouting(
        new NextRequest(url, {
          headers: request.headers,
          method: request.method,
        }),
      );
    }
  }

  const response = handleI18nRouting(request);
  if (PRIVATE_PATH.test(request.nextUrl.pathname)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

export const config = {
  matcher: [
    // Enable a redirect to a matching locale at the root
    "/",

    // Set a cookie to remember the previous locale for
    // all requests that have a locale prefix
    "/(en|es|zh|ko|fr|pt|ru)/:path*",

    // Enable redirects that add missing locales
    // (e.g. `/pathnames` -> `/en/pathnames`). `rewards` is excluded: those
    // paths belong to the rewards app (see next.config.js), which has its own
    // locale handling under /rewards/<locale>. Metadata files (icons, manifest,
    // share image) are served from the root and must not get a locale prefix.
    "/((?!_next|_vercel|favicon.ico|icon.svg|apple-icon|manifest.webmanifest|opengraph-image|images|robots.txt|sitemap.xml|static|api|rewards).*)",
  ],
};
