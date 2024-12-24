import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { locales } from "@/i18n/routing";

export default async function LocaleLayout({ children, params: { locale } }: any) {
  // Ensure that the incoming `locale` is valid
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  return <>{children}</>;
}
