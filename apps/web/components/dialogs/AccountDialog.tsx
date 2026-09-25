import ExternalTextLink from "@repo/ui/external-text-link";
import Tooltip from "@repo/ui/tooltip";
import Image from "next/image";
import { useTranslations } from "next-intl";
import React, { useEffect, useMemo, useState } from "react";
import { useMediaQuery } from "react-responsive";
import { Address, formatUnits } from "viem";
import { useAccount, useDisconnect } from "wagmi";

import Drawer from "@/components/atoms/Drawer";
import Popover from "@/components/atoms/Popover";
import ScrollbarContainer from "@/components/atoms/ScrollbarContainer";
import SelectButton from "@/components/atoms/SelectButton";
import Svg from "@/components/atoms/Svg";
import Badge, { BadgeVariant } from "@/components/badges/Badge";
import Button, { ButtonSize } from "@/components/buttons/Button";
import IconButton, { IconButtonVariant } from "@/components/buttons/IconButton";
import TabButton from "@/components/buttons/TabButton";
import RecentTransaction from "@/components/common/RecentTransaction";
import { useConnectWalletDialogStateStore } from "@/components/dialogs/stores/useConnectWalletStore";
import { wallets } from "@/config/wallets";
import { formatFloat } from "@/functions/formatFloat";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import truncateMiddle from "@/functions/truncateMiddle";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import useTokenBalances from "@/hooks/useTokenBalances";
import { useTokens } from "@/hooks/useTokenLists";
import { Currency } from "@/sdk_bi/entities/currency";
import { Standard } from "@/sdk_bi/standard";
import { useManageTokensDialogStore } from "@/stores/useManageTokensDialogStore";
import { usePinnedTokensStore } from "@/stores/usePinnedTokensStore";
import { useRecentTransactionsStore } from "@/stores/useRecentTransactionsStore";

function PinnedTokenRow({ token }: { token: Currency }) {
  const t = useTranslations("Swap");

  const {
    balance: { erc20Balance, erc223Balance },
  } = useTokenBalances(token);

  const totalBalance = useMemo(() => {
    if (token.isNative) {
      if (erc20Balance?.formatted) {
        return formatFloat(erc20Balance.formatted);
      }
      return formatFloat("0");
    }

    const _erc20Balance = erc20Balance?.value || 0n;
    const _erc223Balance = erc223Balance?.value || 0n;

    return formatFloat(formatUnits(_erc20Balance + _erc223Balance, token.decimals));
  }, [erc20Balance, erc223Balance, token]);

  return (
    <div key={token.symbol} className="px-5 py-2 bg-tertiary-bg rounded-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Image
            width={24}
            height={24}
            src={token.logoURI || "/images/tokens/placeholder.svg"}
            alt=""
          />
          <span>{token.name}</span>
        </div>
        <span className="font-medium">
          {totalBalance} {token.isToken ? token.symbol?.toUpperCase() : token.symbol}
        </span>
      </div>

      {token.isToken ? (
        <>
          <div className="h-px my-2 bg-secondary-border" />
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-14 text-tertiary-text">Balance</span>
                <span className="block min-w-[62px]">
                  <Badge
                    // className="w-fit"
                    size="small"
                    variant={BadgeVariant.STANDARD}
                    standard={Standard.ERC20}
                  />
                </span>
                <Tooltip iconSize={16} text={t("erc20_tooltip")} />
              </div>

              <span className="text-secondary-text text-12">
                {formatFloat(erc20Balance?.formatted || "0")} {token.symbol}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-14 text-tertiary-text">Balance</span>
                <span className="block min-w-[62px]">
                  <Badge
                    // className="w-fit"
                    size="small"
                    variant={BadgeVariant.STANDARD}
                    standard={Standard.ERC223}
                  />
                </span>
                <Tooltip iconSize={16} text={t("erc223_tooltip")} />
              </div>

              <span className="text-secondary-text text-12">
                {formatFloat(erc223Balance?.formatted || "0")} {token.symbol}
              </span>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function AccountDialogContent({ setIsOpenedAccount, activeTab, setActiveTab }: any) {
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

  const tokens = useTokens();
  const { tokens: pinnedTokensAddresses } = usePinnedTokensStore();

  const pinnedTokens = useMemo(() => {
    const lookupMap: Map<"native" | Address, Currency> = new Map(
      tokens.map((token) => [token.isNative ? "native" : token.address0, token]),
    );

    return pinnedTokensAddresses[chainId]?.map((id) => lookupMap.get(id)) || [];
  }, [chainId, pinnedTokensAddresses, tokens]);

  const { setActiveTab: setManageTokensActiveTab, setIsOpen } = useManageTokensDialogStore();

  return (
    <>
      <div className="px-5 md:w-[460px] w-full max-h-[calc(100dvh_-_70px)]">
        <div className="flex justify-between items-center my-3">
          <div className="flex items-center gap-2">
            <Image src={wallets.metamask.image} alt="" width={40} height={40} />
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
        <div role="tablist" className="grid grid-cols-2 bg-secondary-bg p-1 gap-1 rounded-3 mb-3">
          {[t("pinned_tokens"), t("transactions")].map((title, index) => {
            return (
              <TabButton
                key={title}
                inactiveBackground="bg-primary-bg"
                size={40}
                active={index === activeTab}
                onClick={() => setActiveTab(index)}
              >
                {title}
              </TabButton>
            );
          })}
        </div>

        {activeTab == 0 && (
          <>
            {pinnedTokens.length ? (
              <div className="h-[476px] -mt-3 pt-3">
                <button
                  onClick={() => {
                    console.log("clicked");
                    setIsOpen(true);
                    setManageTokensActiveTab(1);
                  }}
                  className="h-10 items-center w-full duration-200 text-secondary-text mb-3 bg-tertiary-bg flex justify-between rounded-2 border-l-4 border-green pl-4 pr-3 hocus:bg-green-bg hocus:text-primary-text group"
                >
                  <span className="flex items-center gap-2 text-secondary-text">
                    <Svg
                      className="text-tertiary-text group-hocus:text-green duration-200 "
                      iconName="pin-fill"
                    />
                    Manage pinned tokens
                  </span>
                  <div className="relative before:opacity-0 before:duration-200 group-hocus:before:opacity-40 before:absolute before:w-4 before:h-4 before:rounded-full before:bg-green-hover-icon before:blur-[8px] before:left-1/2 before:top-1/2 before:-translate-x-1/2 before:-translate-y-1/2">
                    <Svg
                      className="text-tertiary-text group-hocus:text-green-hover-icon duration-200 "
                      iconName="forward"
                    />
                  </div>
                </button>
                <ScrollbarContainer className="pb-3 -mr-3 pr-3 md:-mr-3.5 md:pr-3.5" height={404}>
                  <div className="flex flex-col gap-2 md:gap-3">
                    {pinnedTokens.map((pinnedToken) => {
                      if (!pinnedToken) {
                        return;
                      }

                      return (
                        <PinnedTokenRow
                          key={pinnedToken.symbol + pinnedToken.wrapped.address0}
                          token={pinnedToken}
                        />
                      );
                    })}
                  </div>
                </ScrollbarContainer>
              </div>
            ) : (
              <div className="flex flex-col justify-center h-[476px] overflow-auto gap-2 bg-empty-no-pinned-tokens bg-no-repeat bg-right-top -mx-4 px-4 lg:px-5 -mx-4 lg:-mx-5 -mt-3 pt-3 max-md:bg-size-180">
                <button
                  onClick={() => {
                    console.log("clicked");
                    setIsOpen(true);
                    setManageTokensActiveTab(1);
                  }}
                  className="h-12 items-center w-full duration-200 text-secondary-text mb-3 bg-tertiary-bg flex justify-between rounded-2 border-l-4 border-green pl-4 pr-3 hocus:bg-green-bg hocus:text-primary-text group"
                >
                  <span className="flex items-center gap-2">
                    <Svg
                      className="text-tertiary-text group-hocus:text-green duration-200 "
                      iconName="pin-fill"
                    />
                    Manage pinned tokens
                  </span>
                  <div className="relative before:opacity-0 before:duration-200 group-hocus:before:opacity-40 before:absolute before:w-4 before:h-4 before:rounded-full before:bg-green-hover-icon before:blur-[8px] before:left-1/2 before:top-1/2 before:-translate-x-1/2 before:-translate-y-1/2">
                    <Svg
                      className="text-tertiary-text group-hocus:text-green-hover-icon duration-200 "
                      iconName="next"
                    />
                  </div>
                </button>
                <div className="flex-grow flex items-center justify-center relative -top-[60px] pointer-events-none">
                  <span className="text-secondary-text">{t("assets_will_be_displayed_here")}</span>
                </div>
              </div>
            )}
          </>
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
                <ScrollbarContainer className="pb-3 -mr-3 pr-3 md:-mr-3.5 md:pr-3.5" height={414}>
                  <div className="flex flex-col gap-2 md:gap-3">
                    {_transactions.map((transaction) => {
                      return <RecentTransaction transaction={transaction} key={transaction.hash} />;
                    })}
                  </div>
                </ScrollbarContainer>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 h-[476px] bg-empty-no-transactions bg-right-top bg-no-repeat -mx-4 px-4 lg:px-5 -mx-4 lg:-mx-5 -mt-3 pt-3 max-md:bg-size-180">
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
  const tWallet = useTranslations("Wallet");
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
            className="rounded-2 md:rounded-2 md:font-normal w-full md:w-auto max-md:min-h-10 max-md:px-3 whitespace-nowrap"
            onClick={() => setOpenedWallet(true)}
          >
            {/* Long translations (fr) end in an ellipsis on narrow phones instead of overflowing. */}
            <span className="truncate min-w-0">{tWallet("connect_wallet")}</span>
          </Button>
        </div>
      )}
    </>
  );
}
