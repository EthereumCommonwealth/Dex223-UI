import { PropsWithChildren } from "react";

import { seoFor } from "@/config/seo";

export const generateMetadata = seoFor("pay", "pay", { noindex: true });

export default function Layout({ children }: PropsWithChildren) {
  return children;
}
