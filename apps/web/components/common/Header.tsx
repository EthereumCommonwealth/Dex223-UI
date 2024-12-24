"use client";

import Image from "next/image";

import Container from "@/components/atoms/Container";
import LocaleSwitcher from "@/components/atoms/LocaleSwitcher";
import Button, { ButtonColor, ButtonSize } from "@/components/buttons/Button";
import MobileMenu from "@/components/common/MobileMenu";
import Navigation from "@/components/common/Navigation";
import NetworkPicker from "@/components/common/NetworkPicker";
import TokenListsSettings from "@/components/common/TokenListsSettings";
import AccountDialog from "@/components/dialogs/AccountDialog";
import { useMintTestTokensDialogStore } from "@/components/dialogs/stores/useMintTestTokensDialogStore";
import { useMixpanelConnectWalletEvents } from "@/functions/mixpanel";
import { Link } from "@/i18n/routing";

export default function Header() {
  useMixpanelConnectWalletEvents();
  const { handleOpen } = useMintTestTokensDialogStore();
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
              <div className="fixed w-[calc(50%-20px)] bottom-4 left-4 md:static md:w-auto md:bottom-unset z-[88] md:z-[21]">
                <TokenListsSettings />
              </div>
              <NetworkPicker />

              <div className="fixed w-[calc(50%-20px)] bottom-4 right-4 md:static md:w-auto md:bottom-unset z-[88] md:z-[21]">
                <AccountDialog />
              </div>

              <MobileMenu />
            </div>

            <div className="md:hidden grid grid-cols-2 fixed bottom-0 left-0 bg-secondary-bg z-[87] gap-2 w-full h-[64px] before:h-[1px] before:bg-gradient-to-r before:from-secondary-border/20 before:via-50% before:via-secondary-border before:to-secondary-border/20 before:w-full before:absolute before:top-0 before:left-0" />
          </div>
        </Container>
      </header>
      <div className="pt-2.5 md:pt-2 md:pb-2 pb-4 bg-gradient-to-r from-green-bg to-green-bg/0">
        <Container className="flex h-full items-center px-5">
          <div className="flex justify-between items-center w-full flex-wrap gap-2">
            <div className="flex items-center gap-2 justify-between md:justify-start flex-grow">
              Get test tokens for free
              <Image src="/images/test-tokens.svg" alt="" width={92} height={48} />
            </div>
            <div className="w-full md:w-[168px]">
              <Button
                fullWidth
                onClick={handleOpen}
                colorScheme={ButtonColor.LIGHT_GREEN}
                size={ButtonSize.MEDIUM}
              >
                Get free tokens
              </Button>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
}
