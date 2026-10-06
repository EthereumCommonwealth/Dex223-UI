import { PropsWithChildren } from "react";

import { seoFor } from "@/config/seo";

export const generateMetadata = seoFor("statistics", "statistics");

export default function Layout({ children }: PropsWithChildren) {
  return children;
}
