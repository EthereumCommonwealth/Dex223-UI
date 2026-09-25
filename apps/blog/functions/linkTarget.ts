// Dex223 properties open in the same tab so the blog, the site and the app feel like one
// product. Everything else opens in a new tab with the opener detached.
const FIRST_PARTY_HOSTS = [
  "dex223.io",
  "www.dex223.io",
  "app.dex223.io",
  "test-app.dex223.io",
  "blog.dex223.io",
];

function dappHost(): string | undefined {
  try {
    return process.env.NEXT_PUBLIC_DAPP_URL
      ? new URL(process.env.NEXT_PUBLIC_DAPP_URL).hostname
      : undefined;
  } catch {
    return undefined;
  }
}

export function isExternalHref(href: string | null | undefined): boolean {
  if (!href || !/^https?:\/\//i.test(href)) {
    // Relative paths, anchors, mailto: and friends stay in the current tab.
    return false;
  }

  try {
    const { hostname } = new URL(href);
    return !FIRST_PARTY_HOSTS.includes(hostname) && hostname !== dappHost();
  } catch {
    return false;
  }
}

export const EXTERNAL_LINK_REL = "noopener noreferrer";

export function linkTargetProps(href: string | null | undefined) {
  return isExternalHref(href) ? { target: "_blank", rel: EXTERNAL_LINK_REL } : {};
}
