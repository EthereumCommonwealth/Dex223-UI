"use client";

import Image from "next/image";

import Container from "@/components/atoms/Container";
import LocaleSwitcher from "@/components/atoms/LocaleSwitcher";
import MobileMenu from "@/components/common/MobileMenu";
import Navigation from "@/components/common/Navigation";
import { Link } from "@/i18n/routing";

export default function Header() {
  return (
    <div>
      <header className="md:mb-3 xl:before:hidden before:h-[1px] before:bg-gradient-to-r before:from-secondary-border/20 before:via-50% before:via-secondary-border before:to-secondary-border/20 before:w-full before:absolute relative before:bottom-0 before:left-0">
        <Container className="pl-4 pr-1 md:px-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-5">
              <Link className="relative w-7 h-8 xl:w-[35px] xl:h-10" href="/">
                <Image src="/images/logo-short.svg" alt="" fill />
              </Link>
              <Navigation />
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <LocaleSwitcher />
              <div className="fixed w-[calc(50%-20px)] bottom-4 left-4 md:static md:w-auto md:bottom-unset z-[88] md:z-[21]"></div>

              <div className="fixed w-[calc(50%-20px)] bottom-4 right-4 md:static md:w-auto md:bottom-unset z-[88] md:z-[21]"></div>

              <MobileMenu />
            </div>

            <div className="md:hidden grid grid-cols-2 fixed bottom-0 left-0 bg-secondary-bg z-[87] gap-2 w-full h-[64px] before:h-[1px] before:bg-gradient-to-r before:from-secondary-border/20 before:via-50% before:via-secondary-border before:to-secondary-border/20 before:w-full before:absolute before:top-0 before:left-0" />
          </div>
        </Container>
      </header>
    </div>
  );
}
