import { PropsWithChildren } from "react";

import { seoFor } from "@/config/seo";

export const generateMetadata = seoFor("token_listing_contracts", "token-listing/contracts");

export default function Layout({ children }: PropsWithChildren) {
  return children;
}
