import { redirect } from "next/navigation";

import type { Locale } from "@/i18n/routing";

// /ko, /fr, ... land on the swap page in their own language, not English.
export default async function RootPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  redirect(`/${locale}/swap`);
}
