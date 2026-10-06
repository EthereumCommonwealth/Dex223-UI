import { PropsWithChildren } from "react";

import { seoFor } from "@/config/seo";

export const generateMetadata = seoFor("multisig", "multisig", { noindex: true });

export default function Layout({ children }: PropsWithChildren) {
  return children;
}
