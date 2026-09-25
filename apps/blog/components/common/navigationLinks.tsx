import { useLocale, useTranslations } from "next-intl";
import { useCallback } from "react";

import Svg from "@/components/atoms/Svg";
import { MobileLink } from "@/components/common/MobileMenu";
import { useFeedbackDialogStore } from "@/components/dialogs/stores/useFeedbackDialogStore";
import { IconName } from "@/config/types/IconName";
import { usePathname, useRouter } from "@/i18n/routing";

// Mirrors the app's navigation (apps/web/components/common/Navigation.tsx and MobileMenu.tsx).
// Update both apps together so blog.dex223.io and app.dex223.io keep the same menu.

export function useDappHref() {
  const locale = useLocale();
  return useCallback(
    (path: string) => `${process.env.NEXT_PUBLIC_DAPP_URL}/${locale}${path}`,
    [locale],
  );
}

type AppLink = {
  path: string;
  iconName: IconName;
  title: keyof Messages["Navigation"];
  /**
   * Shown disabled with a "Coming soon" badge. Margin trading has no contract on Ethereum
   * mainnet yet, and the app gates it the same way; flip this once it is deployed there.
   */
  comingSoon?: boolean;
};

export const tradeLinks: AppLink[] = [
  { path: "/swap", iconName: "swap", title: "swap" },
  { path: "/margin-swap", iconName: "margin-trading", title: "margin_trading", comingSoon: true },
  { path: "/buy-crypto", iconName: "fiat", title: "buy_crypto" },
];

export const topLinks: AppLink[] = [
  { path: "/pools", iconName: "pools", title: "pools" },
  { path: "/margin-trading", iconName: "borrow", title: "borrow_lend", comingSoon: true },
  { path: "/portfolio", iconName: "portfolio", title: "portfolio" },
  { path: "/token-listing", iconName: "listing", title: "token_listing" },
];

export const resourceLinks = [
  { href: "https://dexaran.github.io/erc20-losses/", titleKey: "useful_losses_calculator" },
  { href: "https://dexaran.github.io/erc223/", titleKey: "useful_front_page" },
  { href: "https://github.com/Dalcor/dex-exchange", titleKey: "useful_page_source_codes" },
] as const;

export const partnerLinks = [
  { href: "https://blockzhub.io/", titleKey: "partners_eos_support" },
] as const;

export const socialLinks: {
  titleKey:
    | "social_telegram_announcements"
    | "social_telegram_discussions"
    | "social_x_account"
    | "social_dex_x_account"
    | "social_discord";
  href: string;
  icon: Extract<IconName, "telegram" | "x" | "discord">;
}[] = [
  { titleKey: "social_telegram_announcements", href: "https://t.me/Dex_223", icon: "telegram" },
  { titleKey: "social_telegram_discussions", href: "https://t.me/Dex223_defi", icon: "telegram" },
  { titleKey: "social_x_account", href: "https://x.com/Dex_223", icon: "x" },
  { titleKey: "social_dex_x_account", href: "https://x.com/Dexaran", icon: "x" },
  { titleKey: "social_discord", href: "https://discord.gg/t5bdeGC5Jk", icon: "discord" },
];

export function MoreSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 pb-1 text-12 uppercase tracking-[0.06em] text-tertiary-text">
      {children}
    </div>
  );
}

export function MoreExternalRow({
  href,
  text,
  iconName,
}: {
  href: string;
  text: string;
  iconName?: IconName;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 py-2.5 px-4 text-secondary-text hocus:bg-quaternary-bg hocus:text-primary-text duration-200 group"
    >
      {iconName ? (
        <Svg
          iconName={iconName}
          className="text-tertiary-text group-hocus:text-secondary-text duration-200"
        />
      ) : null}
      <span className="flex-grow text-14">{text}</span>
      <Svg
        iconName="forward"
        size={16}
        className="text-tertiary-text group-hocus:text-secondary-text duration-200 shrink-0"
      />
    </a>
  );
}

// The app opens Token lists as a dialog that only exists inside the app, so the blog links to
// the app's Token lists guide, whose button opens that dialog.
export function MoreProductLinks({ handleClose }: { handleClose: () => void }) {
  const t = useTranslations("Navigation");
  const dapp = useDappHref();
  const router = useRouter();
  const pathname = usePathname();
  const { setIsOpen: setFeedbackOpen } = useFeedbackDialogStore();

  return (
    <>
      <MobileLink
        href={dapp("/converter")}
        iconName="convert"
        title={t("useful_converter")}
        handleClose={handleClose}
      />
      <MobileLink
        href={dapp("/revenue")}
        iconName="staked"
        title={t("revenue")}
        handleClose={handleClose}
      />
      <MobileLink
        href={dapp("/governance")}
        iconName="listing"
        title={t("governance")}
        handleClose={handleClose}
      />
      <MobileLink
        href={dapp("/create-token")}
        iconName="list-tokens"
        title={t("create_token")}
        handleClose={handleClose}
      />
      <MobileLink
        href={dapp("/guidelines/token-lists")}
        iconName="list"
        title={t("token_lists")}
        handleClose={handleClose}
      />
      <MobileLink
        href={dapp("/statistics")}
        iconName="statistics"
        title={t("token_statistics")}
        handleClose={handleClose}
      />
      <MobileLink
        href={dapp("/guidelines")}
        iconName="guidelines"
        title={t("guidelines")}
        handleClose={handleClose}
      />
      <MobileLink
        isActive={pathname === "/"}
        href="/"
        iconName="blog"
        title={t("blog")}
        handleClose={handleClose}
        handleClick={(e) => {
          e.preventDefault();
          router.push("/");
        }}
      />
      <MobileLink
        href="#"
        iconName="star"
        title={t("feedback")}
        handleClose={handleClose}
        handleClick={(e) => {
          e.preventDefault();
          setFeedbackOpen(true);
        }}
      />
    </>
  );
}
