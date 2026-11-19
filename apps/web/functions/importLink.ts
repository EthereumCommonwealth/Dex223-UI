/**
 * Tokens named in an /add link (bounty #139, Figma page 31, section "/add link: confirm before
 * import"). Opening /add?tokenA=...&tokenB=...&chainId=... never writes to the token lists on load:
 * a token that is not already trusted goes through ImportFromLinkDialog, and only its Import
 * button saves anything.
 *
 * This module has no runtime imports so the node tests can load it directly.
 */

export type LinkTokenParam = "tokenA" | "tokenB";

export interface LinkTokenRequest {
  param: LinkTokenParam;
  /** The raw value from the URL. */
  value: string;
  /** chainId from the link, or the app's network when the link has none. */
  chainId: number;
}

/** First checks, before anything is read from the chain (flow: valid address, link network). */
export type LinkPreflight =
  | { kind: "invalid_address" }
  | { kind: "unsupported_network" }
  | { kind: "wrong_network" }
  | { kind: "ok" };

/** 0x plus 40 hex characters. A checksum is not required: links are often typed by hand. */
export function isTokenAddress(value: string | null | undefined): value is string {
  return typeof value === "string" && /^0x[0-9a-fA-F]{40}$/.test(value);
}

export function preflightLinkToken(
  request: LinkTokenRequest,
  currentChainId: number,
  supportedChainIds: readonly number[],
): LinkPreflight {
  if (!isTokenAddress(request.value)) return { kind: "invalid_address" };
  if (!supportedChainIds.includes(request.chainId)) return { kind: "unsupported_network" };
  if (request.chainId !== currentChainId) return { kind: "wrong_network" };
  return { kind: "ok" };
}

/**
 * The URL without the given token parameters. Other parameters (chainId, tier) stay, in order.
 * `url` is a path with an optional query string, e.g. "/en/add?tokenA=0x...&tier=3000".
 */
export function withoutLinkParams(url: string, params: readonly LinkTokenParam[]): string {
  const [path, query = ""] = url.split("?");
  const search = new URLSearchParams(query);
  params.forEach((param) => search.delete(param));
  const rest = search.toString();
  return rest ? `${path}?${rest}` : path;
}

/** "/en/add?tokenA=0x1c7D...7C7238&chainId=11155111": the link as shown under the token card. */
export function describeLink(url: string): string {
  return url.replace(
    /0x[0-9a-fA-F]{40}/g,
    (address) => `${address.slice(0, 6)}...${address.slice(-6)}`,
  );
}

/** Which token parameters of an /add link still need a decision, in order (tokenA, then tokenB). */
export function pendingLinkTokens(
  values: Partial<Record<LinkTokenParam, string | null | undefined>>,
  chainId: number,
): LinkTokenRequest[] {
  return (["tokenA", "tokenB"] as const)
    .filter((param) => !!values[param])
    .map((param) => ({ param, value: values[param] as string, chainId }));
}

export interface ImportLinkActions<T> {
  /** Writes the token to the Custom token list. Only called from the dialog's Import button. */
  save: (token: T) => Promise<void> | void;
  /** Sets the token in the /add form. */
  select: (param: LinkTokenParam, token: T) => void;
  /** Removes the token parameter from the URL (history.replaceState). */
  removeParam: (param: LinkTokenParam) => void;
  /** Shows "Token imported successfully". */
  notifyImported: () => void;
}

/** Import (box checked): save, select, toast. */
export async function confirmLinkImport<T>(
  param: LinkTokenParam,
  token: T,
  actions: ImportLinkActions<T>,
): Promise<void> {
  await actions.save(token);
  actions.select(param, token);
  actions.notifyImported();
}

/** "Use {SYMBOL}" for a token already in the lists, or "Use official {SYMBOL}": select only. */
export function selectLinkToken<T>(
  param: LinkTokenParam,
  token: T,
  actions: Pick<ImportLinkActions<T>, "select">,
): void {
  actions.select(param, token);
}

/** Don't import, Don't use, Close, Esc or a backdrop click: nothing saved, the parameter goes. */
export function cancelLinkImport<T>(
  param: LinkTokenParam,
  actions: Pick<ImportLinkActions<T>, "removeParam">,
): void {
  actions.removeParam(param);
}
