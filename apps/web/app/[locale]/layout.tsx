import { notFound } from "next/navigation";
import { getMessages } from "next-intl/server";
import { PropsWithChildren } from "react";

import { Providers } from "@/app/[locale]/providers";
import Footer from "@/components/common/Footer";
import Header from "@/components/common/Header";
import { Locale, routing } from "@/i18n/routing";
interface Props {
  params: Promise<{
    locale: string;
  }>;
}

export default async function RootLayout({ children, params }: PropsWithChildren<Props>) {
  const locale = (await params).locale;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <>
      <Providers messages={messages} locale={locale as Locale}>
        <div className="grid h-[100vh] grid-rows-layout">
          <Header />
          <div>{children}</div>
          <Footer />
        </div>
      </Providers>
    </>
  );
}
