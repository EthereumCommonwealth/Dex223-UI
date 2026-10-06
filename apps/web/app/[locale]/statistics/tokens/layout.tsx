import { PropsWithChildren } from "react";

import { seoFor } from "@/config/seo";

export const generateMetadata = seoFor("statistics", "statistics/tokens");

export default function Layout({ children }: PropsWithChildren) {
  return children;
}
