/* eslint-disable @next/next/no-img-element */
"use client";

import clsx from "clsx";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { useMediaQuery } from "react-responsive";
import { Address, isAddress } from "viem";
import { useAccount, useDisconnect } from "wagmi";

import Checkbox from "@/components/atoms/Checkbox";
import Container from "@/components/atoms/Container";
import DialogHeader from "@/components/atoms/DialogHeader";
import Drawer from "@/components/atoms/Drawer";
import EmptyStateIcon from "@/components/atoms/EmptyStateIcon";
import Input, { SearchInput } from "@/components/atoms/Input";
import Popover from "@/components/atoms/Popover";
import SelectButton from "@/components/atoms/SelectButton";
import Svg from "@/components/atoms/Svg";
import Button, { ButtonColor, ButtonSize } from "@/components/buttons/Button";
import IconButton, {
  IconButtonSize,
  IconButtonVariant,
  IconSize,
} from "@/components/buttons/IconButton";
import TabButton from "@/components/buttons/TabButton";
import { useConnectWalletDialogStateStore } from "@/components/dialogs/stores/useConnectWalletStore";
import { toDataUrl } from "@/functions/blockies";
import { clsxMerge } from "@/functions/clsxMerge";
import { copyToClipboard } from "@/functions/copyToClipboard";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import truncateMiddle from "@/functions/truncateMiddle";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { usePortfolioSearchParams } from "@/hooks/usePortfolioSearchParams";
import { useRouter } from "@/navigation";
import addToast from "@/other/toast";

import { Balances } from "./components/Balances";
import { Deposited } from "./components/Deposited";
import { LendingOrders } from "./components/LendingOrders";
import { LiquidityPositions } from "./components/LiquidityPositions";
import { MarginPositions } from "./components/MarginPositions";
import { useActiveAddresses, usePortfolioWallets } from "./stores/hooks";
import {
  ActiveTab,
  usePortfolioActiveTabStore,
  usePortfolioStore,
} from "./stores/usePortfolioStore";

const AddWalletInput = ({ onAdd }: { onAdd?: () => void }) => {
  const t = useTranslations("Portfolio");

  const [tokenAddressToImport, setTokenAddressToImport] = useState("");

  const error =
    Boolean(tokenAddressToImport) && !isAddress(tokenAddressToImport)
      ? t("enter_in_correct_format")
      : "";

  const { addWallet } = usePortfolioStore();

  const handleAddWallet = useCallback(() => {
    if (tokenAddressToImport && !error) {
      addWallet(tokenAddressToImport as Address);
      setTokenAddressToImport("");
      addToast("Successfully added!");
      if (onAdd) {
        onAdd();
      }
    }
  }, [addWallet, onAdd, tokenAddressToImport, error]);
  return (
    <>
      <div className={clsx("relative w-full", !error && "mb-5")}>
        <Input
          className={clsxMerge("pr-12")}
          value={tokenAddressToImport}
          onChange={(e) => setTokenAddressToImport(e.target.value)}
          placeholder={t("add_wallet_placeholder")}
        />
        <div
          className={clsx("absolute right-1 flex items-center justify-center h-full w-10 top-0")}
        >
          <IconButton
            variant={IconButtonVariant.ADD}
            buttonSize={IconButtonSize.REGULAR}
            iconSize={IconSize.REGULAR}
            disabled={!!error || !tokenAddressToImport}
            handleAdd={handleAddWallet}
          />
        </div>
      </div>
      {error && <p className="text-12 text-red-light mt-1">{error}</p>}
    </>
  );
};

const WalletSearchInput = ({ onAdd }: { onAdd?: () => void }) => {
  const { searchValue, setSearchValue, errorSearch } = useActiveAddresses();

  const t = useTranslations("Portfolio");

  const error = Boolean(searchValue) && !isAddress(searchValue) ? t("enter_in_correct_format") : "";

  const { addWallet } = usePortfolioStore();

  const handleAddWallet = useCallback(() => {
    if (searchValue && !error) {
      addWallet(searchValue as Address);
      setSearchValue("");
      addToast("Successfully added!");
      if (onAdd) {
        onAdd();
      }
    }
  }, [addWallet, onAdd, searchValue, error, setSearchValue]);

  return (
    <div className="relative">
      <SearchInput
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        placeholder={t("search_placeholder")}
        className={clsx(
          "bg-primary-bg lg:w-[480px] h-[40px] lg:h-[48px]",
          searchValue && "pr-[92px]",
        )}
      />
      {<p className="text-12 text-red-light mt-1 h-4">{errorSearch}</p>}
      {searchValue ? (
        <div className={clsx("absolute right-[48px] top-1 flex items-center justify-center")}>
          <IconButton
            variant={IconButtonVariant.ADD}
            buttonSize={IconButtonSize.REGULAR}
            iconSize={IconSize.REGULAR}
            disabled={!!error}
            handleAdd={handleAddWallet}
            className="h-8 w-8 lg:h-10 lg:w-10"
          />
        </div>
      ) : null}
    </div>
  );
};

export type ManageWalletsPopoverContent = "add" | "list" | "manage";

const PopoverTitles: { [key in ManageWalletsPopoverContent]: string } = {
  add: "Add wallet",
  list: "My wallets",
  manage: "Manage wallets",
};

const ManageWalletsContent = ({ setIsOpened }: { setIsOpened: (isOpened: boolean) => void }) => {
  const t = useTranslations("Portfolio");
  const tWallet = useTranslations("Wallet");
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const { setIsOpened: setWalletConnectOpened } = useConnectWalletDialogStateStore();
  const { setAllWalletActive, removeWallet } = usePortfolioStore();
  const { wallets, setIsWalletActive } = usePortfolioWallets();
  const [content, setContent] = useState<ManageWalletsPopoverContent>(
    wallets.length ? "list" : "add",
  );

  const popupBackHandler = useMemo(() => {
    if (content === "list") {
      return undefined;
    } else if (content === "manage") {
      return () => {
        setContent("list");
      };
    } else if (content === "add") {
      if (wallets.length) {
        return () => {
          setContent("list");
        };
      } else {
        return undefined;
      }
    } else {
      return undefined;
    }
  }, [content, wallets.length]);

  return (
    <div className="bg-primary-bg rounded-5 border border-secondary-border lg:min-w-[450px]">
      <DialogHeader
        onClose={() => {
          setIsOpened(false);
        }}
        onBack={popupBackHandler}
        settings={
          content === "list" ? (
            <Button
              colorScheme={ButtonColor.LIGHT_GREEN}
              size={ButtonSize.MEDIUM}
              onClick={() => setContent("add")}
            >
              <div className="flex items-center gap-2 ml-[-8px] mr-[-12px] text-nowrap">
                <span>Add wallet</span>
                <Svg iconName="add" />
              </div>
            </Button>
          ) : null
        }
        title={PopoverTitles[content]}
      />
      <div className="flex flex-col pb-5 border-t border-primary-border">
        {content === "add" ? (
          <div className="flex flex-col pt-5 px-5">
            <AddWalletInput onAdd={() => setContent("list")} />
            {!isConnected && (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-full h-[1px] bg-secondary-border" />
                  <span className="text-secondary-text">or</span>
                  <div className="w-full h-[1px] bg-secondary-border" />
                </div>
                <Button
                  onClick={() => setWalletConnectOpened(true)}
                  fullWidth
                  colorScheme={ButtonColor.LIGHT_GREEN}
                >
                  {tWallet("connect_wallet")}
                </Button>
              </>
            )}
          </div>
        ) : content === "list" ? (
          <>
            <div className="flex justify-between text-green text-18 font-medium px-5">
              <span
                className="py-2 cursor-pointer hover:text-green-hover focus:outline-0 focus:bg-green-hover"
                onClick={() => setAllWalletActive()}
              >
                Select all
              </span>
              <span
                className="py-2 cursor-pointer hover:text-green-hover focus:outline-0 focus:bg-green-hover"
                onClick={() => {
                  setContent("manage");
                }}
              >
                Manage
              </span>
            </div>
            <div className="flex flex-col gap-3 px-5 max-h-[380px] overflow-auto">
              {wallets.map(({ address, isActive }) => (
                <div
                  key={address}
                  className="flex items-center px-5 py-[10px] bg-tertiary-bg rounded-3 gap-3 relative"
                >
                  <Checkbox
                    checked={isActive}
                    handleChange={(event) => {
                      setIsWalletActive(address, event.target.checked);
                    }}
                    id="isActive"
                  />
                  <img
                    key={address}
                    className={clsx(
                      "w-10 h-10 min-h-10 min-w-10 rounded-2 border-2 border-primary-bg",
                    )}
                    src={toDataUrl(address)}
                    alt={address}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {truncateMiddle(address || "", { charsFromStart: 6, charsFromEnd: 6 })}
                    </span>
                    <span className="text-secondary-text text-14">$ —</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex w-full px-5 pt-5 mt-5 border-t border-primary-border">
              <Button fullWidth onClick={() => setIsOpened(false)}>
                Show portfolio
              </Button>
            </div>
          </>
        ) : content === "manage" ? (
          <div className="flex flex-col pt-5 ">
            <div className="flex flex-col px-5">
              <AddWalletInput
              // onAdd={() => setContent("list")}
              />
            </div>
            <div className="flex flex-col gap-3 px-5 max-h-[380px] overflow-auto">
              {wallets.map(({ address, isActive, isConnectedWallet }) => (
                <div
                  key={address}
                  className="flex items-center pl-5 pr-1 justify-between py-[10px] bg-tertiary-bg rounded-3 "
                >
                  <div className="flex items-center gap-3 relative">
                    <img
                      key={address}
                      className={clsx(
                        "w-10 h-10 min-h-10 min-w-10 rounded-2 border-2 border-primary-bg",
                      )}
                      src={toDataUrl(address)}
                      alt={address}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {truncateMiddle(address || "", { charsFromStart: 6, charsFromEnd: 6 })}
                      </span>
                      <span className="text-secondary-text text-14">$ —</span>
                    </div>
                  </div>
                  {isConnectedWallet ? (
                    <IconButton
                      iconName="logout"
                      className="text-secondary-text"
                      variant={IconButtonVariant.DEFAULT}
                      onClick={() => {
                        disconnect();
                      }}
                    />
                  ) : (
                    <IconButton
                      // iconName="add"
                      variant={IconButtonVariant.DELETE}
                      handleDelete={() => {
                        removeWallet(address);
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const ManageWallets = () => {
  const [isOpened, setIsOpened] = useState(false);
  const { wallets } = usePortfolioWallets();
  const _isMobile = useMediaQuery({ query: "(max-width: 767px)" });

  const trigger = useMemo(
    () => (
      <SelectButton
        className="lg:h-[48px] py-2 text-16 w-full md:w-full flex items-center justify-between lg:justify-center lg:order-[-1]"
        isOpen={isOpened}
        onClick={() => setIsOpened(!isOpened)}
      >
        {wallets.length ? (
          <div className="flex items-center">
            {wallets.slice(0, 3).map(({ address }, index) => (
              <img
                key={address}
                className={clsx(
                  "w-6 h-6 min-h-6 min-w-6 rounded-1 border-2 border-primary-bg",
                  index > 0 && "ml-[-8px]",
                )}
                src={toDataUrl(address)}
                alt={address}
              />
            ))}
            <span className="ml-2 whitespace-nowrap">{`${wallets.length} wallets`}</span>
          </div>
        ) : (
          <span className="pl-2">Add wallet</span>
        )}
      </SelectButton>
    ),
    [wallets, isOpened],
  );

  return (
    <>
      {_isMobile ? (
        <>
          {trigger}
          <Drawer placement="bottom" isOpen={isOpened} setIsOpen={setIsOpened}>
            <ManageWalletsContent setIsOpened={setIsOpened} />
          </Drawer>
        </>
      ) : (
        <Popover
          isOpened={isOpened}
          setIsOpened={setIsOpened}
          placement={"bottom-start"}
          trigger={trigger}
        >
          <div className="bg-primary-bg rounded-5 border border-secondary-border shadow-popover shadow-black/70">
            <ManageWalletsContent setIsOpened={setIsOpened} />
          </div>
        </Popover>
      )}
    </>
  );
};

export function Portfolio() {
  usePortfolioSearchParams();

  const chainId = useCurrentChainId();
  const router = useRouter();
  const t = useTranslations("Portfolio");
  const tToast = useTranslations("Toast");

  const { activeTab, setActiveTab } = usePortfolioActiveTabStore();

  const { activeAddresses, searchValue, setSearchValue, errorSearch } = useActiveAddresses();

  return (
    <Container>
      <div className="p-4 lg:p-10 flex flex-col max-w-[100dvw]">
        <div className="flex flex-col lg:flex-row w-full justify-between gap-2 lg:gap-0">
          <h1 className="text-24 lg:text-40 font-medium">{t("title")}</h1>
          <div className="flex flex-col lg:flex-row gap-2 lg:gap-3">
            <WalletSearchInput />
            <ManageWallets />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap rounded-3 pt-4 lg:py-5 bg-primary-bg">
          {activeAddresses.length ? (
            <div className="flex gap-3 lg:gap-0 flex-col lg:flex-row w-full overflow-hidden">
              <div className="flex px-4 lg:px-5">
                {activeAddresses.slice(0, 3).map((ad, index) => (
                  <img
                    key={ad}
                    className={clsx(
                      "w-10 h-10 min-h-10 min-w-10 rounded-2 border-2 border-primary-bg",
                      index > 0 && "ml-[-12px]",
                    )}
                    src={toDataUrl(ad)}
                    alt={ad}
                  />
                ))}
                {activeAddresses.length > 3 && (
                  <div className="w-10 h-10 min-h-10 min-w-10 bg-tertiary-bg rounded-2 border-2 border-primary-bg ml-[-12px] flex justify-center items-center">{`+${activeAddresses.length - 3}`}</div>
                )}
              </div>
              <div className="flex gap-3 w-full overflow-x-auto px-4 lg:pr-5 lg:pl-0 lg:flex-wrap pb-4 lg:pb-0">
                {activeAddresses.map((ad) => (
                  <div
                    key={ad}
                    className="flex items-center gap-1 p-r pl-3 bg-tertiary-bg rounded-2"
                  >
                    <a
                      className="flex gap-2 cursor-pointer hover:text-green-hover focus:outline-0 focus:bg-green-hover"
                      target="_blank"
                      href={getExplorerLink(ExplorerLinkType.ADDRESS, ad, chainId)}
                    >
                      {truncateMiddle(ad || "", { charsFromStart: 5, charsFromEnd: 3 })}
                      <Svg iconName="forward" />
                    </a>
                    <IconButton
                      buttonSize={IconButtonSize.SMALL}
                      iconName="copy"
                      iconSize={IconSize.REGULAR}
                      onClick={async () => {
                        await copyToClipboard(ad);
                        addToast(tToast("successfully_copied"));
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 lg:px-5 pb-4 lg:pb-0">
              <EmptyStateIcon iconName="wallet" size={40} />
              <span className="text-secondary-text">
                Add address or connect wallet to view portfolio
              </span>
            </div>
          )}
        </div>
        <div className="mt-5 w-full flex lg:grid lg:grid-cols-5 bg-primary-bg p-1 gap-1 rounded-3 overflow-x-auto">
          <TabButton
            inactiveBackground="bg-secondary-bg"
            size={48}
            active={activeTab === ActiveTab.balances}
            onClick={() => setActiveTab(ActiveTab.balances)}
          >
            <span className="text-nowrap px-4">Balances</span>
          </TabButton>
          <TabButton
            inactiveBackground="bg-secondary-bg"
            size={48}
            active={activeTab === ActiveTab.margin}
            onClick={() => setActiveTab(ActiveTab.margin)}
          >
            <span className="text-nowrap px-4">Margin positions</span>
          </TabButton>
          <TabButton
            inactiveBackground="bg-secondary-bg"
            size={48}
            active={activeTab === ActiveTab.lending}
            onClick={() => setActiveTab(ActiveTab.lending)}
          >
            <span className="text-nowrap px-4">Lending orders</span>
          </TabButton>
          <TabButton
            inactiveBackground="bg-secondary-bg"
            size={48}
            active={activeTab === ActiveTab.liquidity}
            onClick={() => setActiveTab(ActiveTab.liquidity)}
          >
            <span className="text-nowrap px-4">Liquidity positions</span>
          </TabButton>
          <TabButton
            inactiveBackground="bg-secondary-bg"
            size={48}
            active={activeTab === ActiveTab.deposited}
            onClick={() => setActiveTab(ActiveTab.deposited)}
          >
            <span className="text-nowrap px-4">Deposited to contract</span>
          </TabButton>
        </div>
        {activeTab === ActiveTab.balances ? (
          <Balances />
        ) : activeTab === ActiveTab.margin ? (
          <MarginPositions />
        ) : activeTab === ActiveTab.lending ? (
          <LendingOrders />
        ) : activeTab === ActiveTab.liquidity ? (
          <LiquidityPositions />
        ) : activeTab === ActiveTab.deposited ? (
          <Deposited />
        ) : null}
      </div>
    </Container>
  );
}
