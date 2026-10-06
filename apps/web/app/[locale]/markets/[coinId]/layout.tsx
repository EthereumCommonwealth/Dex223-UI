import { Metadata } from "next";
import { PropsWithChildren } from "react";

import { pageMetadata } from "@/config/seo";
import { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; coinId: string }>;
}): Promise<Metadata> {
  const p = await params;
  return pageMetadata(p.locale, "markets", `markets/${p.coinId}`);
}

export default function Layout({ children }: PropsWithChildren) {
  return children;
}
