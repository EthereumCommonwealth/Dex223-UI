"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import Container from "@/components/atoms/Container";
import EmptyStateIcon from "@/components/atoms/EmptyStateIconNew";
import Button, { ButtonColor } from "@/components/buttons/Button";
import { Link } from "@/i18n/routing";

// Keeps a render crash inside the page so the header and wallet stay usable,
// instead of replacing the whole app with Next's blank "Application error" screen.
export default function PageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("PageError");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container>
      <div className="flex flex-col items-center text-center py-10 md:py-20">
        <EmptyStateIcon iconName="warning" size={200} className="mb-4" />
        <h1 className="text-24 md:text-32 font-medium mb-2">{t("title")}</h1>
        <p className="text-secondary-text text-16 max-w-[480px] mb-6">{t("description")}</p>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button fullWidth onClick={reset}>
            {t("try_again")}
          </Button>
          <Link href="/swap">
            <Button fullWidth colorScheme={ButtonColor.LIGHT_GREEN}>
              {t("go_to_swap")}
            </Button>
          </Link>
        </div>
      </div>
    </Container>
  );
}
