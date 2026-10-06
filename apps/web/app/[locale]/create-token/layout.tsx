import { PropsWithChildren } from "react";

import { seoFor } from "@/config/seo";

export const generateMetadata = seoFor("create_token", "create-token");

export default function Layout({ children }: PropsWithChildren) {
  return children;
}
