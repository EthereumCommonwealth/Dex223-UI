import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useSwipeable } from "react-swipeable";

import Collapse from "@/components/atoms/Collapse";
import Drawer from "@/components/atoms/Drawer";
import LocaleSwitcher from "@/components/atoms/LocaleSwitcher";
import Svg from "@/components/atoms/Svg";
import Button, { ButtonColor, ButtonSize, ButtonVariant } from "@/components/buttons/Button";
import IconButton, { IconButtonSize } from "@/components/buttons/IconButton";
import { useFeedbackDialogStore } from "@/components/dialogs/stores/useFeedbackDialogStore";
import { IconName } from "@/config/types/IconName";
import { clsxMerge } from "@/functions/clsxMerge";
import { Link, usePathname } from "@/i18n/routing";
export function MobileLink({
  href,
  iconName,
  title,
  handleClose,
  isActive,
  disabled = false,
  className = "",
  handleClick,
}: {
  href: string;
  iconName: IconName;
  title: string;
  handleClose: () => void;
  isActive?: boolean;
  disabled?: boolean;
  className?: string;
  handleClick?: (e: any) => void;
}) {
  return (
    <Link
      onClick={(e) => {
        if (handleClick) {
          handleClick(e);
        }

        handleClose();
      }}
      href={href}
      className={clsxMerge(
        "flex items-center gap-2 py-3 px-4 duration-200",
        isActive ? "text-green pointer-events-none" : "hocus:bg-quaternary-bg text-secondary-text",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      <Svg iconName={iconName} />
      {title}
    </Link>
  );
}

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
    <div className="text-primary-text">
      <div className="text-tertiary-text">{title}</div>
      <div className="flex flex-col">
        {links.map((link) => {
          return <NavigationExternalLink key={link.text} href={link.href} text={link.text} />;
        })}
      </div>
    </div>
  );
}

const mobileLinks: {
  href: string;
  iconName: IconName;
  title: any;
}[] = [
  {
    href: "/swap",
    iconName: "swap",
    title: "swap",
  },
  {
    href: "/margin-trading",
    iconName: "margin-trading",
    title: "margin_trading",
  },
  {
    href: "/pools",
    iconName: "pools",
    title: "pools",
  },
  {
    href: "/borrow",
    iconName: "borrow",
    title: "borrow_lend",
  },
  {
    href: "/portfolio",
    iconName: "portfolio",
    title: "portfolio",
  },
  {
    href: "/token-listing",
    iconName: "listing",
    title: "token_listing",
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
export default function MobileMenu() {
  const t = useTranslations("Navigation");
  const tFeedback = useTranslations("Feedback");

  const [mobileMenuOpened, setMobileMenuOpened] = useState(false);
  const [moreOpened, setMoreOpened] = useState(false);
  const pathname = usePathname();
  const { setIsOpen: setOpenFeedbackDialog } = useFeedbackDialogStore();

  const handlers = useSwipeable({
    onSwipedLeft: (eventData) => {
      setMobileMenuOpened(false);
    },
  });

  return (
    <div className="xl:hidden">
      <Drawer
        handlers={handlers}
        placement="left"
        isOpen={mobileMenuOpened}
        setIsOpen={setMobileMenuOpened}
      >
        <div className="flex flex-col justify-between h-full">
          <div className="py-6 grid gap-1">
            {[
              mobileLinks.map(({ href, iconName, title }) => {
                return (
                  <MobileLink
                    key={href}
                    href={href}
                    iconName={iconName}
                    title={t(title)}
                    handleClose={() => setMobileMenuOpened(false)}
                    isActive={pathname.includes(href)}
                    disabled={!["/swap", "/pools", "/portfolio", "/token-listing"].includes(href)}
                  />
                );
              }),
            ]}
            <div>
              <button
                onClick={() => setMoreOpened(!moreOpened)}
                className={clsx(
                  "flex w-full items-center justify-between py-3 px-4 hocus:text-green duration-200 text-secondary-text",
                  moreOpened && "bg-navigation-active-mobile text-green",
                )}
              >
                <span className="flex gap-2">
                  <Svg iconName="more" />
                  {t("more")}
                </span>
                <Svg
                  className={clsx(moreOpened && "-rotate-180", "duration-200")}
                  iconName="small-expand-arrow"
                />
              </button>
              <Collapse open={moreOpened}>
                <div className="py-2 border-b border-secondary-border">
                  <MobileLink
                    href="#"
                    iconName="list"
                    title="Token lists"
                    handleClose={() => setMobileMenuOpened(false)}
                    className="pr-5"
                    disabled
                  />
                  <MobileLink
                    href="/blog"
                    iconName="blog"
                    title="Blog"
                    handleClose={() => setMobileMenuOpened(false)}
                    className="pr-5"
                  />
                  <MobileLink
                    disabled
                    href="/statistics"
                    iconName="statistics"
                    title="Statistics"
                    handleClose={() => setMobileMenuOpened(false)}
                    className="pr-5"
                  />
                  <MobileLink
                    disabled
                    href="#"
                    iconName="guidelines"
                    title="Guidelines"
                    handleClose={() => setMobileMenuOpened(false)}
                    className="pr-5"
                  />
                </div>
                <div className="flex flex-col py-4 px-4 bg-primary-bg rounded-2 gap-3">
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
                        href: "https://eossupport.io/",
                        text: t("partners_eos_support"),
                      },
                    ]}
                  />
                </div>
                <div className="flex flex-col mt-2 pt-3 px-4 border-t border-secondary-border">
                  <h4 className="text-tertiary-text">Social media</h4>

                  {socialLinks.map((link) => {
                    return (
                      <a
                        key={link.title}
                        target="_blank"
                        href={link.href}
                        className="flex gap-2 items-center text-secondary-text py-1 hocus:text-primary-text duration-200"
                      >
                        <Svg iconName={link.icon} className="text-tertiary-text" /> {link.title}
                      </a>
                    );
                  })}
                </div>
              </Collapse>
            </div>
          </div>
          <div className="flex flex-grow items-end gap-4 px-4 pb-4">
            <LocaleSwitcher isMobile={true} />
            <Button
              size={ButtonSize.MEDIUM}
              fullWidth
              colorScheme={ButtonColor.LIGHT_GREEN}
              endIcon="star"
              onClick={() => {
                setMobileMenuOpened(false);
                setOpenFeedbackDialog(true);
              }}
            >
              {tFeedback("feedback")}
            </Button>
          </div>
        </div>
      </Drawer>
      <IconButton
        buttonSize={IconButtonSize.LARGE}
        iconName="menu"
        onClick={() => setMobileMenuOpened(true)}
      />
    </div>
  );
}
