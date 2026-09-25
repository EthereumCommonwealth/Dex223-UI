"use client";

import { useTranslations } from "next-intl";

import Container from "@/components/atoms/Container";
import Badge from "@/components/badges/Badge";
import { ThemeColors } from "@/config/theme/colors";
import { Link } from "@/i18n/routing";
import { ColorSchemeProvider } from "@/lib/color-scheme";

export default function GovernancePage() {
  const t = useTranslations("Governance");

  return (
    <ColorSchemeProvider value={ThemeColors.GREEN}>
      <Container>
        <div className="py-4 lg:py-[40px] flex justify-center">
          <div className="w-full sm:max-w-[600px] flex flex-col gap-4 md:gap-5">
            <header className="bg-primary-bg rounded-5 px-4 py-5 md:px-6 md:py-6 flex flex-col gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-24 md:text-32 font-medium text-primary-text">{t("title")}</h1>
                <Badge color="green_outline" text={t("coming_soon_badge")} />
              </div>
              <p className="text-14 md:text-16 text-secondary-text">{t("description")}</p>
            </header>

            <section className="bg-primary-bg rounded-5 px-4 py-5 md:px-6 md:py-6 flex flex-col gap-3">
              <h2 className="text-18 font-medium">{t("planned_title")}</h2>
              <ul className="list-disc pl-5 text-14 text-secondary-text flex flex-col gap-2">
                <li>{t("planned_listing_fees")}</li>
                <li>{t("planned_protocol_share")}</li>
                <li>{t("planned_execution")}</li>
              </ul>
              <p className="text-14 text-tertiary-text mt-2">{t("phase_note")}</p>
              <Link href="/revenue" className="text-14 text-green hocus:underline w-fit">
                {t("revenue_link")}
              </Link>
            </section>
          </div>
        </div>
      </Container>
    </ColorSchemeProvider>
  );
}
