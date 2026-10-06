import { Metadata } from "next";
import { PropsWithChildren } from "react";

import { pageMetadata } from "@/config/seo";
import { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; address: string }>;
}): Promise<Metadata> {
  const p = await params;
  return pageMetadata(p.locale, "token_listing_contracts", `token-listing/contracts/${p.address}`);
}

export default function Layout({ children }: PropsWithChildren) {
  return children;
}
