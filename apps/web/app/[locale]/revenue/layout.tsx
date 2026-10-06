import { PropsWithChildren } from "react";

import { seoFor } from "@/config/seo";

export const generateMetadata = seoFor("revenue", "revenue");

export default function Layout({ children }: PropsWithChildren) {
  return <div className="overflow-x-hidden w-full">{children}</div>;
}
