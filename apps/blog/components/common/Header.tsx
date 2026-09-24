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
              {/* Padding grows the tap area to 44px without moving the logo. */}
              <Link className="-m-2 p-2 flex" href="/" aria-label="Dex223 Blog">
                <span className="relative block w-7 h-8 xl:w-[35px] xl:h-10">
                  <Image src="/images/logo-short.svg" alt="" fill />
                </span>
              </Link>
              <Navigation />
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <LocaleSwitcher />

              <MobileMenu />
            </div>
          </div>
        </Container>
      </header>
    </div>
  );
}
