import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";

type Messages = { [key: string]: string | Messages };

// Untranslated keys fall back to English instead of throwing MISSING_MESSAGE.
function withFallback(fallback: Messages, messages: Messages): Messages {
  const result: Messages = { ...fallback };

  for (const [key, value] of Object.entries(messages)) {
    const base = result[key];
    result[key] =
      typeof value === "object" && typeof base === "object" ? withFallback(base, value) : value;
  }

  return result;
}

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  const messages: Messages = (await import(`../messages/${locale}.json`)).default;

  if (locale === routing.defaultLocale) {
    return { locale, messages };
  }

  const fallback: Messages = (await import(`../messages/${routing.defaultLocale}.json`)).default;

  return {
    locale,
    messages: withFallback(fallback, messages),
  };
});
