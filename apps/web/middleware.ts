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

  return handleI18nRouting(request);
}

export const config = {
  matcher: [
    // Enable a redirect to a matching locale at the root
    "/",

    // Set a cookie to remember the previous locale for
    // all requests that have a locale prefix
    "/(es|en|zh)/:path*",

    // Enable redirects that add missing locales
    // (e.g. `/pathnames` -> `/en/pathnames`). `rewards` is excluded: those
    // paths belong to the rewards app (see next.config.js), which has its own
    // locale handling under /rewards/<locale>.
    "/((?!_next|_vercel|favicon.ico|images|robots.txt|sitemap.xml|static|api|rewards).*)",
  ],
};
