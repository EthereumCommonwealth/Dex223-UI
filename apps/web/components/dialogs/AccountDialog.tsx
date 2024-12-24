import Image from "next/image";
import { useTranslations } from "next-intl";
import React, { useEffect, useMemo, useState } from "react";
import { useMediaQuery } from "react-responsive";
import { useAccount, useDisconnect } from "wagmi";

import DialogHeader from "@/components/atoms/DialogHeader";
import Drawer from "@/components/atoms/Drawer";
import ExternalTextLink from "@/components/atoms/ExternalTextLink";
import Popover from "@/components/atoms/Popover";
import ScrollbarContainer from "@/components/atoms/ScrollbarContainer";
import SelectButton from "@/components/atoms/SelectButton";
import Svg from "@/components/atoms/Svg";
import Button, { ButtonSize } from "@/components/buttons/Button";
import IconButton, { IconButtonVariant } from "@/components/buttons/IconButton";
import TabButton from "@/components/buttons/TabButton";
import RecentTransaction from "@/components/common/RecentTransaction";
import { useConnectWalletDialogStateStore } from "@/components/dialogs/stores/useConnectWalletStore";
import { wallets } from "@/config/wallets";
import { copyToClipboard } from "@/functions/copyToClipboard";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import truncateMiddle from "@/functions/truncateMiddle";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import addToast from "@/other/toast";
import { useRecentTransactionsStore } from "@/stores/useRecentTransactionsStore";

function AccountDialogContent({ setIsOpenedAccount, activeTab, setActiveTab }: any) {
  const tToast = useTranslations("Toast");
  const tRecentTransactions = useTranslations("RecentTransactions");
  const t = useTranslations("Wallet");

  const { address } = useAccount();
  const { disconnect } = useDisconnect();

  const chainId = useCurrentChainId();

  const { transactions, clearTransactions } = useRecentTransactionsStore();

  const _transactions = useMemo(() => {
    if (address && transactions[address]) {
      return transactions[address];
    }

    return [];
  }, [address, transactions]);
  const { connector } = useAccount();

  return (
    <>
      <DialogHeader onClose={() => setIsOpenedAccount(false)} title={t("my_wallet")} />
      <div className="md:px-10 px-4 md:w-[600px] w-full">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <Image src={wallets.metamask.image} alt="" width={48} height={48} />
            <div></div>

            <div className="flex gap-1">
              {address && (
                <ExternalTextLink
                  text={`${address.slice(0, 6)}...${address.slice(-4)}`}
                  href={getExplorerLink(ExplorerLinkType.ADDRESS, address, chainId)}
                />
              )}
              <IconButton variant={IconButtonVariant.COPY} text={address || ""} />
            </div>
          </div>
          <button
            onClick={() => {
              setIsOpenedAccount(false);
              disconnect({ connector });
            }}
            className="text-secondary-text flex items-center gap-2 hocus:text-green duration-200"
          >
            {t("disconnect")}
            <Svg iconName="logout" />
          </button>
        </div>
        <div className="relative bg-gradient-card-account rounded-2">
          <div className="absolute right-0 top-0 bottom-0 bg-account-card-pattern mix-blend-screen bg-no-repeat bg-right w-full h-full" />
          <div className="relative mb-5 px-5 py-6 grid gap-3 z-10">
            <div>
              <div className="text-16 text-secondary-text">{t("total_balance")}</div>
              <div className="text-32 text-primary-text font-medium">$0.00</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 bg-secondary-bg p-1 gap-1 rounded-3 mb-3">
          {[t("tokens"), t("transactions")].map((title, index) => {
            return (
              <TabButton
                key={title}
                inactiveBackground="bg-primary-bg"
                size={48}
                active={index === activeTab}
                onClick={() => setActiveTab(index)}
              >
                {title}
              </TabButton>
            );
          })}
        </div>

        {activeTab == 0 && (
          <div className="flex flex-col items-center justify-center h-[376px] overflow-auto gap-2 bg-empty-no-tokens bg-no-repeat bg-right-top -mx-4 card-spacing-x md:-mx-10 -mt-3 pt-3 max-md:bg-size-180">
            <span className="text-secondary-text">{t("assets_will_be_displayed_here")}</span>
          </div>
        )}

        {activeTab == 1 && (
          <div>
            {_transactions.length ? (
              <>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-tertiary-text">
                    {tRecentTransactions("total_transactions")} {_transactions.length}
                  </span>
                  <button
                    onClick={clearTransactions}
                    className="border-transparent hocus:border-primary-border text-secondary-text hocus:text-primary-text flex items-center rounded-5 border text-14 py-1.5 pl-6 gap-2 pr-[18px] hocus:bg-white/20 duration-200 bg-quaternary-bg"
                  >
                    {tRecentTransactions("clear_all")}
                    <Svg iconName="delete" />
                  </button>
                </div>
                <ScrollbarContainer className="pb-3 -mr-3 pr-3 md:-mr-8 md:pr-8" height={314}>
                  <div className="flex flex-col gap-2 md:gap-3">
                    {_transactions.map((transaction) => {
                      return <RecentTransaction transaction={transaction} key={transaction.hash} />;
                    })}
                  </div>
                </ScrollbarContainer>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 h-[376px] bg-empty-no-transactions bg-right-top bg-no-repeat -mx-4 card-spacing-x md:-mx-10 -mt-3 pt-3 max-md:bg-size-180">
                <span className="text-secondary-text">
                  {tRecentTransactions("transactions_will_be_displayed_here")}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default function AccountDialog() {
  const { isConnected, address, connector } = useAccount();

  const { setIsOpened: setOpenedWallet } = useConnectWalletDialogStateStore();

  const [activeTab, setActiveTab] = useState(0);

  const _isMobile = useMediaQuery({ query: "(max-width: 767px)" });

  const [isOpenedAccount, setIsOpenedAccount] = useState(false);

  const trigger = useMemo(
    () => (
      <SelectButton
        className="py-1 xl:py-2 text-14 xl:text-16 w-full md:w-auto flex items-center justify-center group"
        isOpen={isOpenedAccount}
        onClick={() => setIsOpenedAccount(!isOpenedAccount)}
      >
        <span className="duration-200 flex gap-2 items-center text-secondary-text group-hover:text-primary-text">
          <Svg
            className="duration-200 text-tertiary-text group-hover:text-primary-text"
            iconName="wallet"
          />
          {truncateMiddle(address || "", { charsFromStart: 5, charsFromEnd: 3 })}
        </span>
      </SelectButton>
    ),
    [address, isOpenedAccount],
  );

  const [isInitialized, setInitialized] = useState(false);

  useEffect(() => {
    setInitialized(true);
  }, []);

  if (!isInitialized) {
    return null;
  }

  return (
    <>
      {isConnected && address ? (
        <>
          {_isMobile ? (
            <>
              {trigger}
              <Drawer placement="bottom" isOpen={isOpenedAccount} setIsOpen={setIsOpenedAccount}>
                <AccountDialogContent
                  setIsOpenedAccount={setIsOpenedAccount}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
              </Drawer>
            </>
          ) : (
            <div>
              <Popover
                isOpened={isOpenedAccount}
                setIsOpened={setIsOpenedAccount}
                placement={"bottom-end"}
                trigger={trigger}
              >
                <div className="bg-primary-bg rounded-5 border border-secondary-border shadow-popover shadow-black/70">
                  <AccountDialogContent
                    setIsOpenedAccount={setIsOpenedAccount}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                  />
                </div>
              </Popover>
            </div>
          )}
        </>
      ) : (
        <div>
          <Button
            size={ButtonSize.MEDIUM}
            tabletSize={ButtonSize.SMALL}
            mobileSize={ButtonSize.SMALL}
            className="rounded-2 md:rounded-2 md:font-normal w-full md:w-auto"
            onClick={() => setOpenedWallet(true)}
          >
            Connect wallet
          </Button>
        </div>
      )}
    </>
  );
}
