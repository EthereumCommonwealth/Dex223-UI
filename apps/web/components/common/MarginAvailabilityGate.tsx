"use client";

import { useTranslations } from "next-intl";
import { PropsWithChildren } from "react";

import Container from "@/components/atoms/Container";
import EmptyStateIcon from "@/components/atoms/EmptyStateIconNew";
import Button from "@/components/buttons/Button";
import { isMarginDeployed } from "@/config/modules";
import { networks } from "@/config/networks";
import useIsMarginAvailable from "@/hooks/useIsMarginAvailable";
import { Link } from "@/i18n/routing";

const marginNetworkNames = networks
  .filter(({ chainId }) => isMarginDeployed(chainId))
  .map(({ name }) => name)
  .join(", ");

/**
 * Renders margin pages only on chains where the margin module contract is deployed.
 * Everywhere else it shows an unavailable state, so no margin form can build a transaction.
 */
export default function MarginAvailabilityGate({ children }: PropsWithChildren) {
  const t = useTranslations("Navigation");
  const isMarginAvailable = useIsMarginAvailable();

  if (isMarginAvailable) {
    return <>{children}</>;
  }

  return (
    <Container>
      <div
        role="status"
        className="flex flex-col items-center text-center py-10 md:py-20"
        data-testid="margin-unavailable"
      >
        <EmptyStateIcon iconName="margin-positions" size={200} className="mb-4" />
        <h1 className="text-24 md:text-32 font-medium mb-2">{t("margin_unavailable_title")}</h1>
        <p className="text-secondary-text text-16 max-w-[480px] mb-6">
          {marginNetworkNames
            ? t("margin_unavailable_switch", { networks: marginNetworkNames })
            : t("margin_unavailable_description")}
        </p>
        <Link href="/swap" className="w-full sm:w-auto">
          <Button fullWidth>{t("margin_unavailable_go_to_swap")}</Button>
        </Link>
      </div>
    </Container>
  );
}
