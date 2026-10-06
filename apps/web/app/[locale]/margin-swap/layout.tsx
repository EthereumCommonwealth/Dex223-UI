import { redirect } from "next/navigation";
import React, { PropsWithChildren } from "react";

import MarginAvailabilityGate from "@/components/common/MarginAvailabilityGate";
import { isMarginModuleEnabled } from "@/config/modules";
import { seoFor } from "@/config/seo";

export const generateMetadata = seoFor("margin_swap", "margin-swap");

export default function Layout({ children }: PropsWithChildren) {
  return isMarginModuleEnabled ? (
    <MarginAvailabilityGate>{children}</MarginAvailabilityGate>
  ) : (
    redirect("/en/swap")
  );
}
