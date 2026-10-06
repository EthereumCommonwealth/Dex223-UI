import { PropsWithChildren } from "react";

import { seoFor } from "@/config/seo";

export const generateMetadata = seoFor("markets", "markets");

export default function Layout({ children }: PropsWithChildren) {
  return children;
}
