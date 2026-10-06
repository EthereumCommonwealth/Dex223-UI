import { PropsWithChildren } from "react";

import { seoFor } from "@/config/seo";

export const generateMetadata = seoFor("swap", "swap");

export default function Layout({ children }: PropsWithChildren) {
  return <>{children}</>;
}
