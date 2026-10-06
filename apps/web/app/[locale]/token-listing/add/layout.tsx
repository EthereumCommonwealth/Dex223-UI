import { PropsWithChildren } from "react";

import { seoFor } from "@/config/seo";

export const generateMetadata = seoFor("token_listing_add", "token-listing/add");

export default function Layout({ children }: PropsWithChildren) {
  return children;
}
