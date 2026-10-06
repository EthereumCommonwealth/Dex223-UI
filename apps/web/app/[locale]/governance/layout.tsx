import { PropsWithChildren } from "react";

import { seoFor } from "@/config/seo";

export const generateMetadata = seoFor("governance", "governance");

export default function Layout({ children }: PropsWithChildren) {
  return children;
}
