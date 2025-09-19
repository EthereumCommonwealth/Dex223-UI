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

function NavigationExternalLink({ href, text }: { href: string; text: string }) {
  return (
    <a
      target="_blank"
      className={clsx(
        "text-green hocus:text-green-hover duration-200 inline-block py-1",
        href === "#" && "opacity-50 pointer-events-none",
      )}
      href={href}
    >
      {text}
    </a>
  );
}

function NavigationExternalLinksContainer({
  title,
  links,
}: {
  title: string;
  links: { href: string; text: string }[];
}) {
  return (
    <div className="flex flex-col text-16 text-primary-text gap-1">
      <div className="text-tertiary-text">{title}</div>
      <div className="flex flex-col">
        {links.map((link) => {
          return <NavigationExternalLink key={link.text} href={link.href} text={link.text} />;
        })}
      </div>
    </div>
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
      </div>
    ),
    activeFlags: ["/swap", "/margin-swap"],
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
  title: any;
  href: string;
  icon: Extract<IconName, "telegram" | "x" | "discord">;
};

const socialLinks: SocialLink[] = [
  {
    title: "Announcements",
    href: "https://t.me/Dex_223",
    icon: "telegram",
  },
  {
    title: "Discussions",
    href: "https://t.me/Dex223_defi",
    icon: "telegram",
  },
  {
    title: "DEX223",
    href: "https://x.com/Dex_223",
    icon: "x",
  },
  {
    title: "Dexaran",
    href: "https://x.com/Dexaran",
    icon: "x",
  },
  {
    title: "Discord",
    href: "https://discord.gg/t5bdeGC5Jk",
    icon: "discord",
  },
];

function NavigationMoreDropdown() {
  const [isSubmenuOpened, setSubmenuOpened] = useState(false);
  const t = useTranslations("Navigation");

  const pathname = usePathname();

  const { setIsOpen } = useFeedbackDialogStore();

  const active = useMemo(() => {
    return (
      pathname.includes("/blog") ||
      pathname.includes("/statistics") ||
      pathname.includes("/token-lists") ||
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
      placement="bottom"
      customOffset={12}
      trigger={
        <button
          onClick={() => setSubmenuOpened(!isSubmenuOpened)}
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
      <div className="bg-tertiary-bg rounded-2 shadow-popover shadow-black/70">
        <div className="flex">
          <div className="flex flex-col mt-2 mb-2">
            <MobileLink
              href="#"
              iconName="star"
              title="Feedback"
              handleClose={() => setSubmenuOpened(false)}
              className="pr-5"
              handleClick={(e) => {
                e.preventDefault();
                setIsOpen(true);
              }}
            />
            <MobileLink
              href="#"
              iconName="list"
              title="Token lists"
              handleClose={() => setSubmenuOpened(false)}
              className="pr-5"
              disabled
            />
            <MobileLink
              href="/create-token"
              iconName="list-tokens"
              title="Create a new token"
              handleClose={() => setSubmenuOpened(false)}
              className="pr-5"
            />
            <MobileLink
              isExternal
              href="https://blog.dex223.io/"
              iconName="blog"
              title="Blog"
              handleClose={() => setSubmenuOpened(false)}
              className="pr-5"
            />
            <MobileLink
              disabled
              href="/statistics"
              iconName="statistics"
              title="Statistics"
              handleClose={() => setSubmenuOpened(false)}
              className="pr-5"
            />
            <MobileLink
              disabled
              href="#"
              iconName="guidelines"
              title="Guidelines"
              handleClose={() => setSubmenuOpened(false)}
              className="pr-5"
            />
          </div>
          <div className="flex flex-col gap-4 mt-2 pt-3 px-5 pb-3 mb-2 border-l border-r border-secondary-border">
            <NavigationExternalLinksContainer
              title={t("useful_links")}
              links={[
                {
                  href: "https://dexaran.github.io/token-converter/",
                  text: t("useful_converter"),
                },
                {
                  href: "https://dexaran.github.io/erc20-losses/",
                  text: t("useful_losses_calculator"),
                },
                {
                  href: "https://dexaran.github.io/erc223/",
                  text: t("useful_front_page"),
                },
                {
                  href: "https://github.com/Dalcor/dex-exchange",
                  text: t("useful_page_source_codes"),
                },
              ]}
            />

            <NavigationExternalLinksContainer
              title={t("partners")}
              links={[
                {
                  href: "https://blockzhub.io/",
                  text: t("partners_eos_support"),
                },
              ]}
            />
          </div>
          <div className="flex flex-col mt-2 pt-3 px-5">
            <h4 className="text-tertiary-text">Social media</h4>

            {socialLinks.map((link) => {
              return (
                <a
                  key={link.title}
                  target="_blank"
                  href={link.href}
                  className="flex gap-2 items-center text-secondary-text py-1 hocus:text-primary-text duration-200 group"
                >
                  <Svg
                    className="text-tertiary-text group-hocus:text-secondary-text duration-200"
                    iconName={link.icon}
                  />{" "}
                  {link.title}
                </a>
              );
            })}
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
