"use client";

import { useTranslations } from "next-intl";
import { Suspense } from "react";

import SendForm from "@/app/[locale]/send/components/SendForm";
import Container from "@/components/atoms/Container";
import { ThemeColors } from "@/config/theme/colors";
import { ColorSchemeProvider } from "@/lib/color-scheme";

export default function SendPageBody({ mode }: { mode: "send" | "pay" | "invoice" }) {
  const t = useTranslations("Send");
  const title =
    mode === "pay" ? t("pay_title") : mode === "invoice" ? t("invoice_title") : t("title");
  const description =
    mode === "pay"
      ? t("pay_description")
      : mode === "invoice"
        ? t("invoice_description")
        : t("description");

  return (
    <ColorSchemeProvider value={ThemeColors.GREEN}>
      <Container>
        <div className="py-4 lg:py-[40px] flex justify-center">
          <div className="w-full sm:max-w-[600px] flex flex-col gap-4 md:gap-5">
            <header className="bg-primary-bg rounded-5 px-4 py-5 md:px-6 md:py-6">
              <h1 className="text-24 md:text-32 font-medium text-primary-text mb-2">{title}</h1>
              <p className="text-14 md:text-16 text-secondary-text">{description}</p>
            </header>
            <Suspense
              fallback={
                <div className="bg-primary-bg rounded-5 p-6 text-secondary-text">
                  {t("loading")}
                </div>
              }
            >
              <SendForm mode={mode} />
            </Suspense>
          </div>
        </div>
      </Container>
    </ColorSchemeProvider>
  );
}
