"use client";

import ExternalTextLink from "@repo/ui/external-text-link";
import { useLocale, useTranslations } from "next-intl";
import React from "react";

import { GUIDES } from "@/app/[locale]/guidelines/guides";
import Container from "@/components/atoms/Container";
import Svg from "@/components/atoms/Svg";
import { Link } from "@/i18n/routing";
import { useManageTokensDialogStore } from "@/stores/useManageTokensDialogStore";

function InternalTextLink({ href, text }: { href: string; text: string }) {
  return (
    <Link href={href} className="flex items-center text-green hocus:text-green-hover duration-200">
      <span>{text}</span>
      <Svg iconName="forward" size={24} className="flex-shrink-0" />
    </Link>
  );
}

function GuidelineCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-primary-bg py-4 px-5 rounded-5">
      <h2 className="text-24 font-medium mb-1">{title}</h2>
      <p className="text-secondary-text mb-3">{subtitle}</p>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

export default function GuidelinesPage() {
  const t = useTranslations("Guidelines");
  const locale = useLocale();
  const tNav = useTranslations("Navigation");
  const {
    setIsOpen: setManageTokensOpen,
    setActiveTab: setManageTokensActiveTab,
    setContent: setManageTokensContent,
  } = useManageTokensDialogStore();

  return (
    <Container>
      <div className="md:py-5 py-4">
        <h1 className="mb-2 text-24 lg:text-40">{t("title")}</h1>
        <p className="text-secondary-text text-14 md:text-16 mb-5">{t("description")}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <GuidelineCard
            title={t("getting_started_title")}
            subtitle={t("getting_started_subtitle")}
          >
            <InternalTextLink href="/guidelines/swap" text={t("guides.swap.title")} />
            <InternalTextLink href="/guidelines/converter" text={t("guides.converter.title")} />
            <InternalTextLink href="/guidelines/fiat" text={t("guides.fiat.title")} />
            <InternalTextLink href="/portfolio" text={tNav("portfolio")} />
          </GuidelineCard>

          <GuidelineCard title={t("tokens_title")} subtitle={t("tokens_subtitle")}>
            <InternalTextLink
              href="/guidelines/token-listing"
              text={t("guides.token-listing.title")}
            />
            <InternalTextLink href="/guidelines/token-lists" text={t("guides.token-lists.title")} />
            <button
              type="button"
              onClick={() => {
                setManageTokensContent("default");
                setManageTokensActiveTab(0);
                setManageTokensOpen(true);
              }}
              className="flex items-center text-green hocus:text-green-hover duration-200 text-left"
            >
              <span>{tNav("token_lists")}</span>
              <Svg iconName="forward" size={24} className="flex-shrink-0" />
            </button>
            <InternalTextLink href="/create-token" text={tNav("create_token")} />
          </GuidelineCard>

          <GuidelineCard title={t("learn_more_title")} subtitle={t("learn_more_subtitle")}>
            <a
              href={`https://blog.dex223.io/${locale}`}
              className="flex items-center text-green hocus:text-green-hover duration-200"
            >
              <span>{tNav("blog")}</span>
              <Svg iconName="forward" size={24} className="flex-shrink-0" />
            </a>
            <ExternalTextLink
              text={tNav("useful_front_page")}
              href="https://dexaran.github.io/erc223/"
            />
            <ExternalTextLink
              text={tNav("useful_losses_calculator")}
              href="https://dexaran.github.io/erc20-losses/"
            />
            <InternalTextLink href="/statistics" text={tNav("token_statistics")} />
          </GuidelineCard>

          <GuidelineCard title={t("all_guides_title")} subtitle={t("all_guides_subtitle")}>
            {GUIDES.map((guide) => (
              <InternalTextLink
                key={guide.slug}
                href={`/guidelines/${guide.slug}`}
                text={t(`guides.${guide.slug}.title`)}
              />
            ))}
          </GuidelineCard>
        </div>
      </div>
    </Container>
  );
}
