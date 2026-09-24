import clsx from "clsx";
import { useTranslations } from "next-intl";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { useMediaQuery } from "react-responsive";

import NavigationItem, { NavigationItemWithSubmenu } from "@/components/atoms/NavigationItem";
import Popover from "@/components/atoms/Popover";
import Svg from "@/components/atoms/Svg";
import { MobileLink } from "@/components/common/MobileMenu";
import { useFeedbackDialogStore } from "@/components/dialogs/stores/useFeedbackDialogStore";
import { isMarginModuleEnabled } from "@/config/modules";
import { IconName } from "@/config/types/IconName";
import { usePathname } from "@/i18n/routing";
import { useManageTokensDialogStore } from "@/stores/useManageTokensDialogStore";

function MoreSectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-4 pb-1 text-12 uppercase tracking-[0.06em] text-tertiary-text">
      {children}
    </div>
  );
}

function MoreExternalRow({
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

const menuItems: Array<
  | {
      label: any;
      submenu: (handleClose: () => void, t: any, pathname?: string) => ReactNode;
      activeFlags: string[];
    }
  | { label: any; href: string }
> = [
  {
    label: "trade",
    submenu: (handleClose, t, pathname) => (
      <div className="flex flex-col py-1 bg-primary-bg rounded-2 shadow-popover shadow-black/70">
        <MobileLink
          isActive={pathname === "/swap"}
          href="/swap"
          iconName="swap"
          title={t("swap")}
          handleClose={handleClose}
          className="min-w-[238px]"
        />
        <MobileLink
          disabled={!isMarginModuleEnabled}
          isActive={pathname === "/margin-swap"}
          href="/margin-swap"
          iconName="margin-trading"
          title={t("margin_trading")}
          handleClose={handleClose}
          className={clsx("min-w-[238px]", !isMarginModuleEnabled && "pr-5")}
          comingSoon={!isMarginModuleEnabled}
        />
        <MobileLink
          isActive={pathname === "/buy-crypto"}
          href="/buy-crypto"
          iconName="fiat"
          title={t("buy_crypto")}
          handleClose={handleClose}
          className="min-w-[238px]"
        />
      </div>
    ),
    activeFlags: ["/swap", "/margin-trading", "/buy-crypto"],
  },
  {
    label: "pools",
    href: "/pools",
  },
  {
    label: "borrow_lend",
    href: "/margin-trading",
  },
  {
    label: "portfolio",
    href: "/portfolio",
  },
  {
    label: "token_listing",
    href: "/token-listing",
  },
];

type SocialLink = {
  titleKey:
    | "social_telegram_announcements"
    | "social_telegram_discussions"
    | "social_x_account"
    | "social_dex_x_account"
    | "social_discord";
  href: string;
  icon: Extract<IconName, "telegram" | "x" | "discord">;
};

const socialLinks: SocialLink[] = [
  {
    titleKey: "social_telegram_announcements",
    href: "https://t.me/Dex_223",
    icon: "telegram",
  },
  {
    titleKey: "social_telegram_discussions",
    href: "https://t.me/Dex223_defi",
    icon: "telegram",
  },
  {
    titleKey: "social_x_account",
    href: "https://x.com/Dex_223",
    icon: "x",
  },
  {
    titleKey: "social_dex_x_account",
    href: "https://x.com/Dexaran",
    icon: "x",
  },
  {
    titleKey: "social_discord",
    href: "https://discord.gg/t5bdeGC5Jk",
    icon: "discord",
  },
];

function NavigationMoreDropdown() {
  const [isSubmenuOpened, setSubmenuOpened] = useState(false);
  const t = useTranslations("Navigation");
  const pathname = usePathname();
  const { setIsOpen } = useFeedbackDialogStore();
  const {
    setIsOpen: setManageTokensOpen,
    setActiveTab: setManageTokensActiveTab,
    setContent: setManageTokensContent,
  } = useManageTokensDialogStore();

  const active = useMemo(() => {
    return (
      pathname.includes("/converter") ||
      pathname.includes("/create-token") ||
      pathname.includes("/blog") ||
      pathname.includes("/statistics") ||
      pathname.includes("/guidelines")
    );
  }, [pathname]);

  const isSmallScreen = useMediaQuery({ query: "(max-width: 1280px)" });

  useEffect(() => {
    if (isSmallScreen) {
      setSubmenuOpened(false);
    }
  }, [isSmallScreen]);

  return (
    <Popover
      isOpened={isSubmenuOpened}
      setIsOpened={setSubmenuOpened}
      placement="bottom-end"
      customOffset={12}
      trigger={
        <button
          onClick={() => setSubmenuOpened(!isSubmenuOpened)}
          aria-expanded={isSubmenuOpened}
          aria-label={t("more")}
          className={clsx(
            "px-3 py-5 inline-flex items-center gap-1 duration-200 group",
            isSubmenuOpened || active
              ? "bg-navigation-active text-green shadow-green/60 text-shadow"
              : "hocus:bg-navigation-hover hocus:text-green hocus:shadow-green/60 hocus:text-shadow text-secondary-text",
          )}
        >
          <Svg
            className={clsx(
              "group-hocus:drop-shadow-[0_0_2px_var(--tw-shadow-color)] group-hocus:shadow-green/60",
              isSubmenuOpened ? "rotate-180" : "",
              (active || isSubmenuOpened) &&
                "drop-shadow-[0_0_2px_var(--tw-shadow-color)] shadow-green/60",
            )}
            iconName="small-expand-arrow"
          />
        </button>
      }
    >
      <div className="bg-tertiary-bg rounded-2 shadow-popover shadow-black/70 overflow-hidden min-w-[640px]">
        <div className="grid grid-cols-[1.15fr_1fr_0.95fr]">
          <div className="flex flex-col py-3 border-r border-secondary-border">
            <MoreSectionLabel>{t("more_product")}</MoreSectionLabel>
            <MobileLink
              isActive={pathname === "/converter"}
              href="/converter"
              iconName="convert"
              title={t("useful_converter")}
              handleClose={() => setSubmenuOpened(false)}
            />
            <MobileLink
              isActive={pathname === "/revenue"}
              href="/revenue"
              iconName="staked"
              title={t("revenue")}
              handleClose={() => setSubmenuOpened(false)}
            />
            <MobileLink
              isActive={pathname === "/create-token"}
              href="/create-token"
              iconName="list-tokens"
              title={t("create_token")}
              handleClose={() => setSubmenuOpened(false)}
            />
            <MobileLink
              href="#"
              iconName="list"
              title={t("token_lists")}
              handleClose={() => setSubmenuOpened(false)}
              handleClick={(e) => {
                e.preventDefault();
                setManageTokensContent("default");
                setManageTokensActiveTab(0);
                setManageTokensOpen(true);
              }}
            />
            <MobileLink
              isActive={pathname === "/statistics"}
              href="/statistics"
              iconName="statistics"
              title={t("token_statistics")}
              handleClose={() => setSubmenuOpened(false)}
            />
            <MobileLink
              isActive={pathname === "/guidelines"}
              href="/guidelines"
              iconName="guidelines"
              title={t("guidelines")}
              handleClose={() => setSubmenuOpened(false)}
            />
            <MobileLink
              href="https://blog.dex223.io/"
              iconName="blog"
              title={t("blog")}
              handleClose={() => setSubmenuOpened(false)}
              isExternal
              openInNewTab={false}
            />
            <MobileLink
              href="#"
              iconName="star"
              title={t("feedback")}
              handleClose={() => setSubmenuOpened(false)}
              handleClick={(e) => {
                e.preventDefault();
                setIsOpen(true);
              }}
            />
          </div>

          <div className="flex flex-col py-3 border-r border-secondary-border">
            <MoreSectionLabel>{t("more_resources")}</MoreSectionLabel>
            <MoreExternalRow
              href="https://dexaran.github.io/erc20-losses/"
              text={t("useful_losses_calculator")}
            />
            <MoreExternalRow
              href="https://dexaran.github.io/erc223/"
              text={t("useful_front_page")}
            />
            <MoreExternalRow
              href="https://github.com/Dalcor/dex-exchange"
              text={t("useful_page_source_codes")}
            />
            <div className="mt-3 pt-3 border-t border-secondary-border">
              <MoreSectionLabel>{t("partners")}</MoreSectionLabel>
              <MoreExternalRow href="https://blockzhub.io/" text={t("partners_eos_support")} />
            </div>
          </div>

          <div className="flex flex-col py-3">
            <MoreSectionLabel>{t("social_media")}</MoreSectionLabel>
            {socialLinks.map((link) => (
              <a
                key={link.href}
                target="_blank"
                rel="noopener noreferrer"
                href={link.href}
                className="flex gap-2 items-center text-secondary-text py-2.5 px-4 hocus:bg-quaternary-bg hocus:text-primary-text duration-200 group"
              >
                <Svg
                  className="text-tertiary-text group-hocus:text-secondary-text duration-200"
                  iconName={link.icon}
                />
                <span className="text-14 flex-grow">{t(link.titleKey)}</span>
                <Svg
                  iconName="forward"
                  size={16}
                  className="text-tertiary-text group-hocus:text-secondary-text duration-200 shrink-0"
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    </Popover>
  );
}

export default function Navigation() {
  const t = useTranslations("Navigation");

  const pathname = usePathname();

  return (
    <ul className="hidden xl:flex items-center">
      {menuItems.map((menuItem, index) => {
        if ("submenu" in menuItem) {
          return (
            <li key={menuItem.label + index}>
              <NavigationItemWithSubmenu
                title={menuItem.label ? t(menuItem.label) : ""}
                submenu={menuItem.submenu}
                active={pathname.includes(menuItem.activeFlags[0])}
              />
            </li>
          );
        }

        return (
          <li key={menuItem.label}>
            <NavigationItem
              id={menuItem.label}
              title={t(menuItem.label)}
              href={menuItem.href}
              active={pathname.includes(menuItem.href)}
            />
          </li>
        );
      })}
      <li>
        <NavigationMoreDropdown />
      </li>
    </ul>
  );
}
