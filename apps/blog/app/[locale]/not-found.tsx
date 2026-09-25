"use client";

import { useTranslations } from "next-intl";

import Container from "@/components/atoms/Container";
import Svg from "@/components/atoms/Svg";
import { Link } from "@/i18n/routing";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <Container className="px-4">
      <div className="mt-6 md:mt-10 rounded-5 bg-primary-bg flex flex-col items-center justify-center text-center min-h-[400px] gap-3 px-6 py-10 bg-empty-article-not-found bg-right-top bg-no-repeat max-md:bg-size-180">
        <h1 className="text-24 md:text-32">{t("title")}</h1>
        <p className="text-secondary-text max-w-[480px]">{t("description")}</p>
        <Link
          href="/"
          className="mt-3 inline-flex items-center gap-2 min-h-12 px-6 rounded-3 bg-green text-black font-medium hocus:bg-green-hover duration-200"
        >
          <Svg iconName="back" />
          {t("back_to_blog")}
        </Link>
      </div>
    </Container>
  );
}
