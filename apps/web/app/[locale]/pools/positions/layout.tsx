import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PropsWithChildren } from "react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Liquidity");
  return { title: t("liquidity_title") };
}
export default function Layout({ children }: PropsWithChildren) {
  return <>{children}</>;
}
