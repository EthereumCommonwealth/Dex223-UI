import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import React from "react";

import BorrowMarketPageContent from "@/app/[locale]/margin-trading/components/BorrowMarketPageContent";

type SP = Record<string, string | string[] | undefined>;

export default async function MarginTrading({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;

  let defaultTab = 0;

  if (sp.tab === "lending-orders") {
    defaultTab = 1;
  }
  if (sp.tab === "margin-positions") {
    defaultTab = 2;
  }

  const tSeo = await getTranslations("Seo");

  return (
    <>
      <h1 className="sr-only">{tSeo("margin_trading.title")}</h1>
      <BorrowMarketPageContent defaultTab={defaultTab} />
    </>
  );
}

// function RedirectPage() {
//   redirect("/en/swap");
// }
