import { PropsWithChildren } from "react";

import { seoFor } from "@/config/seo";

export const generateMetadata = seoFor("send", "send", { noindex: true });

export default function Layout({ children }: PropsWithChildren) {
  return children;
}
