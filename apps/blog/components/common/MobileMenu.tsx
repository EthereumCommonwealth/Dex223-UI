import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useSwipeable } from "react-swipeable";

import Collapse from "@/components/atoms/Collapse";
import ComingSoonBadge from "@/components/atoms/ComingSoonBadge";
import Drawer from "@/components/atoms/Drawer";
import LocaleSwitcher from "@/components/atoms/LocaleSwitcher";
import Svg from "@/components/atoms/Svg";
import Button, { ButtonColor, ButtonSize } from "@/components/buttons/Button";
import IconButton, { IconButtonSize } from "@/components/buttons/IconButton";
import {
  MoreProductLinks,
  partnerLinks,
  resourceLinks,
  socialLinks,
  topLinks,
  tradeLinks,
  useDappHref,
} from "@/components/common/navigationLinks";
import { useFeedbackDialogStore } from "@/components/dialogs/stores/useFeedbackDialogStore";
import { IconName } from "@/config/types/IconName";
import { clsxMerge } from "@/functions/clsxMerge";

export function MobileLink({
  href,
  iconName,
  title,
  handleClose,
  isActive,
  disabled = false,
  badge,
  className = "",
  handleClick,
}: {
  href: string;
  iconName: IconName;
  title: string;
  handleClose: () => void;
  isActive?: boolean;
  disabled?: boolean;
  badge?: string;
  className?: string;
  handleClick?: (e: any) => void;
}) {
  return (
    <a
      onClick={(e) => {
        if (handleClick) {
          handleClick(e);
        }

        handleClose();
      }}
      href={disabled ? undefined : href}
      aria-current={isActive ? "page" : undefined}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      className={clsxMerge(
        "flex items-center gap-2 py-3 px-4 duration-200",
        isActive ? "text-green pointer-events-none" : "hocus:bg-quaternary-bg text-secondary-text",
        disabled && "pointer-events-none",
        className,
      )}
    >
      <Svg iconName={iconName} className={clsx(disabled && "opacity-50")} />
      <span className={clsx(disabled && "opacity-50")}>{title}</span>
      {badge && <ComingSoonBadge text={badge} className="ml-auto" />}
    </a>
  );
}

function NavigationExternalLink({ href, text }: { href: string; text: string }) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className="text-secondary-text hocus:text-primary-text duration-200 inline-flex items-center gap-2 py-1.5"
      href={href}
    >
      <span className="flex-grow">{text}</span>
      <Svg iconName="forward" size={16} className="text-tertiary-text shrink-0" />
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
      <div className="text-12 uppercase tracking-[0.06em] text-tertiary-text mb-1">{title}</div>
      <div className="flex flex-col">
        {links.map((link) => {
          return <NavigationExternalLink key={link.text} href={link.href} text={link.text} />;
        })}
      </div>
    </div>
  );
}

export default function MobileMenu() {
  const t = useTranslations("Navigation");
  const tFeedback = useTranslations("Feedback");
  const dapp = useDappHref();

  const [mobileMenuOpened, setMobileMenuOpened] = useState(false);
  const [moreOpened, setMoreOpened] = useState(false);
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
        <div className="flex flex-col justify-between h-full min-w-[300px]">
          <div className="py-6 grid gap-1">
            {[...tradeLinks, ...topLinks].map(({ path, iconName, title, comingSoon }) => (
              <MobileLink
                key={path}
                href={dapp(path)}
                iconName={iconName}
                title={t(title)}
                disabled={comingSoon}
                badge={comingSoon ? t("coming_soon") : undefined}
                handleClose={() => setMobileMenuOpened(false)}
              />
            ))}
            <div>
              <button
                onClick={() => setMoreOpened(!moreOpened)}
                aria-expanded={moreOpened}
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
                  <div className="px-4 pb-1 text-12 uppercase tracking-[0.06em] text-tertiary-text">
                    {t("more_product")}
                  </div>
                  <MoreProductLinks handleClose={() => setMobileMenuOpened(false)} />
                </div>
                <div className="flex flex-col py-4 px-4 bg-primary-bg gap-4">
                  <NavigationExternalLinksContainer
                    title={t("more_resources")}
                    links={resourceLinks.map((link) => ({
                      href: link.href,
                      text: t(link.titleKey),
                    }))}
                  />
                  <NavigationExternalLinksContainer
                    title={t("partners")}
                    links={partnerLinks.map((link) => ({
                      href: link.href,
                      text: t(link.titleKey),
                    }))}
                  />
                </div>
                <div className="flex flex-col mt-2 pt-3 px-4 border-t border-secondary-border pb-2">
                  <h4 className="text-12 uppercase tracking-[0.06em] text-tertiary-text mb-1">
                    {t("social_media")}
                  </h4>

                  {socialLinks.map((link) => {
                    return (
                      <a
                        key={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        href={link.href}
                        className="flex gap-2 items-center text-secondary-text py-2 hocus:text-primary-text duration-200"
                      >
                        <Svg iconName={link.icon} className="text-tertiary-text" />
                        <span className="flex-grow">{t(link.titleKey)}</span>
                        <Svg iconName="forward" size={16} className="text-tertiary-text shrink-0" />
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
