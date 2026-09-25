import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PropsWithChildren } from "react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Revenue");
  return { title: t("title") };
}
export default function Layout({ children }: PropsWithChildren) {
  return <div className="overflow-x-hidden w-full">{children}</div>;
}
