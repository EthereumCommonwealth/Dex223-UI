import ExternalTextLink from "@repo/ui/external-text-link";
import Preloader from "@repo/ui/preloader";
import clsx from "clsx";
import React from "react";
import { useAccount } from "wagmi";

import Container from "@/components/atoms/Container";
import IconButton, { IconButtonVariant } from "@/components/buttons/IconButton";
import { useConfirmInWalletAlertStore } from "@/stores/useConfirmInWalletAlertStore";

export default function ConfirmInWalletAlert() {
  const { isOpened, description, closeConfirmInWalletAlert } = useConfirmInWalletAlertStore();
  const { connector } = useAccount();

  return (
    <>
      {isOpened && (
        <div className="z-[1000] fixed w-full bg-green-bg border-green border-t shadow-notification bottom-0">
          <Container gutter={false}>
            <div className={clsx("py-4 pl-4 pr-1 md:px-5")}>
              <div className={clsx("flex justify-between md:text-16 text-14 items-center")}>
                <div className="flex gap-3 items-center">
                  <Preloader type="linear" />
                  <span>{description}</span>
                </div>
                <IconButton
                  variant={IconButtonVariant.CLOSE}
                  handleClose={closeConfirmInWalletAlert}
                />
              </div>
              {connector?.id === "metaMaskSDK" && (
                <div className="pl-[44px] text-secondary-text text-14 md:text-16 pr-1 -mt-1">
                  If you’ve confirmed it in MetaMask but it doesn’t appear here,{" "}
                  <a
                    target="_blank"
                    className="text-green underline hocus:text-green-hover duration-200"
                    href="https://support.metamask.io/manage-crypto/transactions/smart-transactions/"
                  >
                    Metamask Smart Transactions
                  </a>{" "}
                  may be enabled.
                </div>
              )}
            </div>
          </Container>
        </div>
      )}
    </>
  );
}
