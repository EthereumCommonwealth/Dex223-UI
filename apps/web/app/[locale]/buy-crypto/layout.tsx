import { PropsWithChildren } from "react";

import { seoFor } from "@/config/seo";

export const generateMetadata = seoFor("buy_crypto", "buy-crypto");

export default function Layout({ children }: PropsWithChildren) {
  return children;
}
