import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";

type Messages = Record<string, any>;

/**
 * Overlays a locale's messages on top of English.
 *
 * Translation files are partial - Spanish shipped with only the Navigation section of
 * twelve, Chinese with less - and next-intl renders the key path when a message is
 * missing. Loading a locale file on its own therefore filled most of the UI with
 * strings like "Swap.title", which is why every non-English locale was disabled in the
 * switcher.
 *
 * Falling back per-key means a partially translated locale shows English for whatever
 * is not translated yet, so languages can be enabled and filled in incrementally
 * instead of needing all 428 keys before anything is usable.
 */
function deepMerge(base: Messages, override: Messages): Messages {
  const out: Messages = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value === null || value === undefined) continue;
    // An empty string is "not translated yet", not a deliberate blank.
    if (typeof value === "string" && value.trim() === "") continue;
    if (typeof value === "object" && !Array.isArray(value) && typeof base[key] === "object") {
      out[key] = deepMerge(base[key], value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  const fallback = (await import(`../messages/${routing.defaultLocale}.json`)).default;

  if (locale === routing.defaultLocale) {
    return { locale, messages: fallback };
  }

  let translated: Messages = {};
  try {
    translated = (await import(`../messages/${locale}.json`)).default;
  } catch {
    // A locale listed in routing without a message file yet still renders in English
    // rather than failing the request.
    translated = {};
  }

  return {
    locale,
    messages: deepMerge(fallback, translated),
  };
});
