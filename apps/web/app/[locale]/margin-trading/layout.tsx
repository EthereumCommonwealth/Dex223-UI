import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import React, { PropsWithChildren } from "react";

import MarginAvailabilityGate from "@/components/common/MarginAvailabilityGate";
import { isMarginModuleEnabled } from "@/config/modules";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Margin");
  return { title: t("page_title") };
}

export default function Layout({ children }: PropsWithChildren) {
  return isMarginModuleEnabled ? (
    <MarginAvailabilityGate>{children}</MarginAvailabilityGate>
  ) : (
    redirect("/en/swap")
  );
}
