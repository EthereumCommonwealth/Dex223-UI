import { PropsWithChildren } from "react";

import { seoFor } from "@/config/seo";

export const generateMetadata = seoFor("positions", "pools/positions", { noindex: true });

export default function Layout({ children }: PropsWithChildren) {
  return <>{children}</>;
}
