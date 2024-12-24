"use client";

import clsx from "clsx";
import Image from "next/image";
import { useLocale } from "next-intl";
import { useState } from "react";

import Popover from "@/components/atoms/Popover";
import SelectButton from "@/components/atoms/SelectButton";
import SelectOption from "@/components/atoms/SelectOption";
import { locales, usePathname, useRouter } from "@/i18n/routing";

const localesMap: {
  [key: string]: {
    img: string;
    label: string;
    symbol: string;
  };
} = {
  en: {
    img: "/images/locales/en.svg",
    label: "English",
    symbol: "En",
  },
  es: {
    img: "/images/locales/es.svg",
    label: "Español",
    symbol: "Es",
  },
  zh: {
    img: "/images/locales/zh.svg",
    label: "中国人",
    symbol: "Zh",
  },
};
export default function LocaleSwitcher({ isMobile = false }: { isMobile?: boolean }) {
  const lang = useLocale();
  const pathName = usePathname();
  const router = useRouter();

  const [isOpened, setIsOpened] = useState(false);

  const redirectedPathName = (locale: string) => {
    router.replace(pathName, { locale: locale as any });
  };

  return (
    <div className={clsx(!isMobile && "hidden xl:block", "flex-shrink-0")}>
      <Popover
        isOpened={isOpened}
        setIsOpened={setIsOpened}
        placement={isMobile ? "top-start" : "bottom-start"}
        trigger={
          <SelectButton
            className={clsx("px-3 text-secondary-text", isMobile && "bg-tertiary-bg")}
            isOpen={isOpened}
            onClick={() => setIsOpened(!isOpened)}
          >
            {localesMap[lang]?.symbol || localesMap["en"]?.symbol}
          </SelectButton>
        }
      >
        <div className="py-1 bg-primary-bg rounded-2 shadow-popover shadow-black/70">
          <ul>
            {locales.map((locale) => {
              return (
                <li className="min-w-[200px]" key={locale}>
                  <SelectOption
                    onClick={() => redirectedPathName(locale)}
                    isActive={lang === locale}
                    disabled={locale !== "en"}
                  >
                    <Image
                      src={localesMap[locale]?.img}
                      alt={localesMap[locale]?.label}
                      width={24}
                      height={24}
                    />
                    {localesMap[locale]?.label} ({localesMap[locale]?.symbol})
                  </SelectOption>
                </li>
              );
            })}
          </ul>
        </div>
      </Popover>
    </div>
  );
}
