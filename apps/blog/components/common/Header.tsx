"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import Container from "@/components/atoms/Container";
import LocaleSwitcher from "@/components/atoms/LocaleSwitcher";
import MobileMenu from "@/components/common/MobileMenu";
import Navigation from "@/components/common/Navigation";
import { useDappHref } from "@/components/common/navigationLinks";
import { Link } from "@/i18n/routing";

export default function Header() {
  const t = useTranslations("Navigation");
  const dapp = useDappHref();

  return (
    <div>
      <header className="md:mb-3 xl:before:hidden before:h-[1px] before:bg-gradient-to-r before:from-secondary-border/20 before:via-50% before:via-secondary-border before:to-secondary-border/20 before:w-full before:absolute relative before:bottom-0 before:left-0">
        <Container className="pl-4 pr-1 md:px-5 max-w-[1920px]">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-5">
              <Link className="relative block" href="/" aria-label="Dex223 blog home">
                <span className="relative block w-7 h-8 xl:w-[35px] xl:h-10">
                  <Image src="/images/logo-short.svg" alt="" fill />
                </span>
              </Link>
              <Navigation />
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <LocaleSwitcher />
              <a
                href={dapp("/swap")}
                className="hidden md:flex items-center justify-center gap-2 transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out active:scale-[0.98] bg-green text-black hocus:bg-green-hover shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] hocus:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_10px_30px_-12px_rgba(165,231,197,0.6)] text-14 lg:text-16 font-medium min-h-8 lg:min-h-10 px-6 rounded-2 whitespace-nowrap"
              >
                {t("launch_app")}
              </a>

              <MobileMenu />
            </div>
          </div>
        </Container>
      </header>
    </div>
  );
}
