import { Metadata } from "next";
import { PropsWithChildren } from "react";

import { pageMetadata } from "@/config/seo";
import { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; chainId: string; poolAddress: string }>;
}): Promise<Metadata> {
  const p = await params;
  return pageMetadata(p.locale, "pool", `pools/${p.chainId}/${p.poolAddress}`);
}

export default function Layout({ children }: PropsWithChildren) {
  return children;
}
