import { PropsWithChildren } from "react";

import { seoFor } from "@/config/seo";

export const generateMetadata = seoFor("guidelines", "guidelines");

export default function Layout({ children }: PropsWithChildren) {
  return children;
}
