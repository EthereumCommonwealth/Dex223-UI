import clsx from "clsx";
import { useTranslations } from "next-intl";
import { ReactNode, useState } from "react";

import Popover from "@/components/atoms/Popover";
import Svg from "@/components/atoms/Svg";
import IconButton from "@/components/buttons/IconButton";
import { Link, usePathname } from "@/i18n/routing";

interface Props {
  href: string;
  title: string;
  active?: boolean;
}
export default function NavigationItem({ href, title, active }: Props) {
  return (
    <Link
      className={clsx(
        "px-3 py-5 duration-200 inline-flex",
        active
          ? "bg-navigation-active text-green shadow-green/60 text-shadow"
          : "hocus:bg-navigation-hover hocus:text-green hocus:shadow-green/60 hocus:text-shadow text-secondary-text",
        !["/swap", "/pools", "/token-listing", "/portfolio"].includes(href) &&
          "opacity-50 pointer-events-none",
      )}
      href={href}
    >
      {title}
    </Link>
  );
}

export function NavigationItemWithSubmenu({
  title,
  submenu,
  active,
}: {
  title: string;
  submenu: (handleClose: () => void, t: any, pathname?: string) => ReactNode;
  active: boolean;
}) {
  const t = useTranslations("Navigation");
  const pathname = usePathname();

  const [isSubmenuOpened, setSubmenuOpened] = useState(false);

  return (
    <Popover
      isOpened={isSubmenuOpened}
      setIsOpened={setSubmenuOpened}
      placement="bottom-start"
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
          {title ? <span>{title}</span> : null}
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
      {submenu(() => setSubmenuOpened(false), t, pathname)}
    </Popover>
  );
}
