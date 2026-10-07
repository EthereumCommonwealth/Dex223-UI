"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { MouseEvent, useLayoutEffect, useRef, useState } from "react";

import Container from "@/components/atoms/Container";
import LocaleSwitcher from "@/components/atoms/LocaleSwitcher";
import Button, { ButtonColor, ButtonSize } from "@/components/buttons/Button";
import MobileMenu from "@/components/common/MobileMenu";
import Navigation from "@/components/common/Navigation";
import NetworkPicker from "@/components/common/NetworkPicker";
import TokenListsSettings from "@/components/common/TokenListsSettings";
import AccountDialog from "@/components/dialogs/AccountDialog";
import { useMintTestTokensDialogStore } from "@/components/dialogs/stores/useMintTestTokensDialogStore";
import { useRecentTransactionTracking } from "@/hooks/useRecentTransactionTracking";
import { Link, usePathname } from "@/i18n/routing";
import { useDemoWalletDialogStore } from "@/stores/useDemoWalletDialogStore";

/**
 * True when the header's contents are wider than the header, so the widest controls
 * (token lists, network name) can drop to icons. It un-compacts once the header is back
 * to the width the full labels needed, and re-measures from scratch on a language
 * change, because French or Russian labels need far more room than English ones.
 */
function useCompactWhenCrowded(ref: React.RefObject<HTMLDivElement | null>, locale: string) {
  const [compact, setCompact] = useState(false);
  const fullWidth = useRef(0);

  useLayoutEffect(() => {
    setCompact(false);
    fullWidth.current = 0;
  }, [locale]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const check = () => {
      if (!compact) {
        fullWidth.current = el.scrollWidth;
        if (el.scrollWidth > el.clientWidth + 1) setCompact(true);
      } else if (el.clientWidth >= fullWidth.current) {
        setCompact(false);
      }
    };
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [compact, ref]);

  return compact;
}

export default function Header() {
  useRecentTransactionTracking();
  const t = useTranslations("MintTest");

  const { handleOpen } = useMintTestTokensDialogStore();
  const rowRef = useRef<HTMLDivElement>(null);
  const compact = useCompactWhenCrowded(rowRef, useLocale());

  // The demo uses a pretend wallet, so wallet, network and token list controls explain that
  // instead of opening the real flows.
  const pathname = usePathname();
  const isDemo = pathname === "/demo" || pathname.startsWith("/demo/");
  const { setIsOpen: setDemoWalletDialogOpen } = useDemoWalletDialogStore();
  const interceptInDemo = (e: MouseEvent) => {
    if (!isDemo) return;
    e.preventDefault();
    e.stopPropagation();
    setDemoWalletDialogOpen(true);
  };
  return (
    <div>
      <header className="xl:before:hidden before:h-[1px] before:bg-gradient-to-r before:from-secondary-border/20 before:via-50% before:via-secondary-border before:to-secondary-border/20 before:w-full before:absolute relative before:bottom-0 before:left-0">
        <Container gutter={false} className="pl-4 pr-1 md:px-5 max-w-[1920px]">
          <div
            ref={rowRef}
            data-compact={compact || undefined}
            className="group/header flex justify-between items-center"
          >
            <div className="flex items-center gap-5 group-data-[compact]/header:gap-3">
              {/* The padding gives the logo a 44px touch target on phones without moving it. */}
              <Link
                className="relative block p-2 -m-2 xl:p-0 xl:m-0"
                href="/"
                aria-label="Dex223 home"
              >
                <span className="relative block w-7 h-8 xl:w-[35px] xl:h-10">
                  <Image src="/images/logo-short.svg" alt="" fill />
                </span>
              </Link>
              <Navigation />
            </div>
            <div className="flex items-center gap-2 md:gap-3 group-data-[compact]/header:gap-2">
              <LocaleSwitcher />
              <div
                onClickCapture={interceptInDemo}
                className="fixed w-[calc(50%-20px)] bottom-3 left-4 md:static md:w-auto md:bottom-unset z-[88] md:z-[21]"
              >
                <TokenListsSettings compact={compact} />
              </div>
              <div onClickCapture={interceptInDemo} className="contents">
                <NetworkPicker compact={compact} />
              </div>

              <div
                onClickCapture={interceptInDemo}
                className="fixed w-[calc(50%-20px)] bottom-3 right-4 md:static md:w-auto md:bottom-unset z-[88] md:z-[21]"
              >
                <AccountDialog />
              </div>

              <MobileMenu />
            </div>

            <div className="md:hidden grid grid-cols-2 fixed bottom-0 left-0 bg-secondary-bg z-[87] gap-2 w-full h-[64px] before:h-[1px] before:bg-gradient-to-r before:from-secondary-border/20 before:via-50% before:via-secondary-border before:to-secondary-border/20 before:w-full before:absolute before:top-0 before:left-0" />
          </div>
        </Container>
      </header>
      {process.env.NEXT_PUBLIC_ENV === "development" && (
        <div className="pt-2.5 md:pt-2 md:pb-2 pb-4 bg-gradient-to-r from-green-bg to-green-bg/0">
          <Container gutter={false} className="flex h-full items-center px-5 max-w-[1920px]">
            <div className="flex justify-between items-center w-full flex-wrap gap-2">
              <div className="flex items-center gap-2 justify-between md:justify-start flex-grow">
                {t("banner")}
                <Image src="/images/test-tokens.svg" alt="" width={92} height={48} />
              </div>
              <div className="w-full md:w-[170px]">
                <Button
                  fullWidth
                  onClick={handleOpen}
                  colorScheme={ButtonColor.LIGHT_GREEN}
                  size={ButtonSize.MEDIUM}
                >
                  {t("get_free")}
                </Button>
              </div>
            </div>
          </Container>
        </div>
      )}
    </div>
  );
}
