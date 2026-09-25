import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useMediaQuery } from "react-responsive";

import NavigationItem, { NavigationItemWithSubmenu } from "@/components/atoms/NavigationItem";
import Popover from "@/components/atoms/Popover";
import Svg from "@/components/atoms/Svg";
import { MobileLink } from "@/components/common/MobileMenu";
import {
  MoreExternalRow,
  MoreProductLinks,
  MoreSectionLabel,
  partnerLinks,
  resourceLinks,
  socialLinks,
  topLinks,
  tradeLinks,
  useDappHref,
} from "@/components/common/navigationLinks";

function NavigationMoreDropdown() {
  const [isSubmenuOpened, setSubmenuOpened] = useState(false);
  const t = useTranslations("Navigation");

  // Blog lives under More, so on the blog the More trigger is always the active section.
  const active = true;

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
            <MoreProductLinks handleClose={() => setSubmenuOpened(false)} />
          </div>

          <div className="flex flex-col py-3 border-r border-secondary-border">
            <MoreSectionLabel>{t("more_resources")}</MoreSectionLabel>
            {resourceLinks.map((link) => (
              <MoreExternalRow key={link.href} href={link.href} text={t(link.titleKey)} />
            ))}
            <div className="mt-3 pt-3 border-t border-secondary-border">
              <MoreSectionLabel>{t("partners")}</MoreSectionLabel>
              {partnerLinks.map((link) => (
                <MoreExternalRow key={link.href} href={link.href} text={t(link.titleKey)} />
              ))}
            </div>
          </div>

          <div className="flex flex-col py-3">
            <MoreSectionLabel>{t("social_media")}</MoreSectionLabel>
            {socialLinks.map((link) => (
              <MoreExternalRow
                key={link.href}
                href={link.href}
                text={t(link.titleKey)}
                iconName={link.icon}
              />
            ))}
          </div>
        </div>
      </div>
    </Popover>
  );
}

export default function Navigation() {
  const t = useTranslations("Navigation");
  const dapp = useDappHref();

  return (
    <ul className="hidden xl:flex items-center">
      <li>
        <NavigationItemWithSubmenu
          title={t("trade")}
          submenu={(handleClose) => (
            <div className="flex flex-col py-1 bg-primary-bg rounded-2 shadow-popover shadow-black/70">
              {tradeLinks.map(({ path, iconName, title, comingSoon }) => (
                <MobileLink
                  key={path}
                  href={dapp(path)}
                  iconName={iconName}
                  title={t(title)}
                  disabled={comingSoon}
                  badge={comingSoon ? t("coming_soon") : undefined}
                  handleClose={handleClose}
                  className="min-w-[238px]"
                />
              ))}
            </div>
          )}
          active={false}
        />
      </li>
      {topLinks.map(({ path, title, comingSoon }) => (
        <li key={path}>
          <NavigationItem
            title={t(title)}
            href={dapp(path)}
            comingSoonLabel={comingSoon ? t("coming_soon") : undefined}
          />
        </li>
      ))}
      <li>
        <NavigationMoreDropdown />
      </li>
    </ul>
  );
}
