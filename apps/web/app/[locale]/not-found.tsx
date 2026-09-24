"use client";

import { useTranslations } from "next-intl";

import Container from "@/components/atoms/Container";
import EmptyStateIcon from "@/components/atoms/EmptyStateIconNew";
import Button, { ButtonColor } from "@/components/buttons/Button";
import { Link } from "@/i18n/routing";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <Container>
      <div className="flex flex-col items-center text-center py-10 md:py-20">
        <EmptyStateIcon iconName="search" size={200} className="mb-4" />
        <h1 className="text-24 md:text-32 font-medium mb-2">{t("title")}</h1>
        <p className="text-secondary-text text-16 max-w-[480px] mb-6">{t("description")}</p>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link href="/swap">
            <Button fullWidth>{t("go_to_swap")}</Button>
          </Link>
          <Link href="/pools">
            <Button fullWidth colorScheme={ButtonColor.LIGHT_GREEN}>
              {t("view_pools")}
            </Button>
          </Link>
        </div>
      </div>
    </Container>
  );
}
