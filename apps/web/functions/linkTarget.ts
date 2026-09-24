/**
 * Hosts that belong to Dex223. Links to them open in the same tab so the
 * user stays inside one product; everything else opens in a new tab.
 */
const FIRST_PARTY_HOSTS = [
  "dex223.io",
  "www.dex223.io",
  "app.dex223.io",
  "test-app.dex223.io",
  "blog.dex223.io",
];

export function isFirstPartyUrl(href: string): boolean {
  // Relative paths, anchors and query-only links stay on the current site.
  if (!/^[a-z][a-z\d+\-.]*:/i.test(href) && !href.startsWith("//")) {
    return true;
  }

  try {
    const { hostname } = new URL(href, "https://app.dex223.io");
    return FIRST_PARTY_HOSTS.includes(hostname.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Anchor attributes for a link: nothing for first-party links, and a new tab
 * without opener or referrer for third-party ones.
 */
export function linkTargetProps(href: string): { target?: "_blank"; rel?: string } {
  return isFirstPartyUrl(href) ? {} : { target: "_blank", rel: "noopener noreferrer" };
}
