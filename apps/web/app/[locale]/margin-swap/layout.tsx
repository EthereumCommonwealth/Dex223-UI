import { Metadata } from "next";
import { redirect } from "next/navigation";
import React, { PropsWithChildren } from "react";

import MarginAvailabilityGate from "@/components/common/MarginAvailabilityGate";
import { isMarginModuleEnabled } from "@/config/modules";

export const metadata: Metadata = {
  title: "Swap",
};

export default function Layout({ children }: PropsWithChildren) {
  return isMarginModuleEnabled ? (
    <MarginAvailabilityGate>{children}</MarginAvailabilityGate>
  ) : (
    redirect("/en/swap")
  );
}
