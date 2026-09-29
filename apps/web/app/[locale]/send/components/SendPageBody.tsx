"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import { type ReactNode, Suspense, useState } from "react";

import SendForm from "@/app/[locale]/send/components/SendForm";
import Collapse from "@/components/atoms/Collapse";
import Container from "@/components/atoms/Container";
import Svg from "@/components/atoms/Svg";
import { ThemeColors } from "@/config/theme/colors";
import { Link } from "@/i18n/routing";
import { ColorSchemeProvider } from "@/lib/color-scheme";

const bold = (chunks: ReactNode) => <b className="font-medium text-secondary-text">{chunks}</b>;

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
              <p className="mt-3 inline-flex items-center gap-2 rounded-2 bg-secondary-bg px-3 py-1.5 text-12 md:text-14 text-yellow-light">
                <Svg iconName="info" size={16} aria-hidden className="shrink-0" />
                {t("testnet_note")}
              </p>
            </header>
            <WhySafeSend />
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

// Open by default: most visitors arrive without knowing why this differs from a wallet's send.
function WhySafeSend() {
  const t = useTranslations("Send");
  const [isOpened, setIsOpened] = useState(true);

  return (
    <section className="overflow-hidden text-14 rounded-2 bg-gradient-to-r from-primary-bg to-secondary-bg">
      <button
        type="button"
        onClick={() => setIsOpened(!isOpened)}
        aria-expanded={isOpened}
        className="min-h-10 px-4 md:px-6 py-2 flex items-center justify-between gap-3 text-left font-medium w-full text-14 text-secondary-text bg-gradient-to-r via-50% via-primary-bg from-green-bg to-green-bg/0 border-l-4 border-green rounded-2"
      >
        <span>{t("why_title")}</span>
        <Svg
          className={clsx(isOpened ? "-rotate-180" : "", "duration-200 shrink-0")}
          iconName="small-expand-arrow"
        />
      </button>
      <Collapse open={isOpened}>
        <div className="px-4 md:px-6 py-3 flex flex-col gap-3 text-tertiary-text">
          <p>{t.rich("why_problem", { b: bold })}</p>
          <p>{t.rich("why_fix", { b: bold })}</p>
          <p>
            {t.rich("why_erc20", {
              b: bold,
              convert: (chunks) => (
                <Link
                  href="/converter"
                  className="text-green underline hocus:text-green-hover duration-200"
                >
                  {chunks}
                </Link>
              ),
            })}
          </p>
          <p>{t.rich("why_modes", { b: bold })}</p>
        </div>
      </Collapse>
    </section>
  );
}
