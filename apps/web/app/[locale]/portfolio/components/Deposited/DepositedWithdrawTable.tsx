"use client";

import clsx from "clsx";
import Image from "next/image";
import { useTranslations } from "next-intl";
import React, { useEffect, useMemo, useState } from "react";
import { Address, formatUnits } from "viem";
import { useAccount } from "wagmi";

import ExternalTextLink from "@/components/atoms/ExternalTextLink";
import Preloader from "@/components/atoms/Preloader";
import Svg from "@/components/atoms/Svg";
import Button, { ButtonColor, ButtonSize, ButtonVariant } from "@/components/buttons/Button";
import { formatNumber } from "@/functions/formatFloat";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import truncateMiddle from "@/functions/truncateMiddle";
import { AllowanceStatus } from "@/hooks/useAllowance";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { Token } from "@/sdk_hybrid/entities/token";
import { Standard } from "@/sdk_hybrid/standard";
import { useRevokeDialogStatusStore } from "@/stores/useRevokeDialogStatusStore";
import { useRevokeStatusStore } from "@/stores/useRevokeStatusStore";

import { WalletDeposite } from "../../stores/useWalletsDeposites";

export type TableData = {
  contractAddress: Address;
  walletAddresses: Address[];
  token: Token;
  deposited: bigint;
  approved: bigint;
}[];

const WithdrawTableItem = ({
  deposite,
  walletAddresses,
  onClick,
  onDetailsClick,
  isRevoke,
  amount,
  isOdd,
}: {
  deposite: WalletDeposite;
  walletAddresses: Address[];
  onClick: () => void;
  onDetailsClick: () => void;
  isRevoke: boolean;
  amount: bigint;
  isOdd: boolean;
}) => {
  const chainId = useCurrentChainId();
  const { address } = useAccount();
  const { status: revokeStatus } = useRevokeStatusStore();
  const t = useTranslations("Portfolio");

  const [status, setStatus] = useState<boolean>(false);

  const isLoading = useMemo(() => {
    console.log(revokeStatus);
    const going = [AllowanceStatus.PENDING, AllowanceStatus.LOADING].includes(revokeStatus);
    if (!going) setStatus(false);
    return going;
  }, [revokeStatus]);

  return (
    <>
      <div
        className={clsx(
          `h-[56px] flex justify-start items-center gap-3 pl-5 rounded-l-3 pr-5`,
          isOdd ? "bg-tertiary-bg" : "",
        )}
      >
        <div className="flex gap-2">
          <Image src="/images/tokens/placeholder.svg" width={24} height={24} alt="" />
          <span>{`${deposite.token.name}`}</span>
        </div>
        <div
          className="px-2 py-1 text-16 text-secondary-text bg-quaternary-bg rounded-2 flex justify-center items-center hocus:bg-green-bg cursor-pointer duration-200"
          onClick={() => {
            onDetailsClick();
          }}
        >
          {truncateMiddle(deposite.token.symbol || "", { charsFromStart: 2, charsFromEnd: 2 })}
        </div>
      </div>

      <div className={clsx(`h-[56px] flex items-center pr-5`, isOdd ? "bg-tertiary-bg" : "")}>
        {`${formatNumber(formatUnits(amount, deposite.token.decimals), 8)} ${truncateMiddle(
          deposite.token.symbol || "",
          {
            charsFromStart: 2,
            charsFromEnd: 2,
          },
        )}`}
      </div>

      <div className={clsx(`h-[56px] flex items-center`, isOdd ? "bg-tertiary-bg" : "")}>
        <ExternalTextLink
          text={truncateMiddle(deposite.contractAddress || "", {
            charsFromStart: 7,
            charsFromEnd: 7,
          })}
          href={getExplorerLink(ExplorerLinkType.ADDRESS, deposite.contractAddress, chainId)}
        />
      </div>
      <div
        className={clsx(
          `h-[56px] flex rounded-r-3 flex-col justify-center pr-5 pl-5`,
          isOdd ? "bg-tertiary-bg" : "",
        )}
      >
        {address === walletAddresses[0] ? (
          <Button
            variant={ButtonVariant.CONTAINED}
            colorScheme={ButtonColor.LIGHT_GREEN}
            size={ButtonSize.MEDIUM}
            isLoading={isLoading}
            onClick={() => {
              if (!isLoading) {
                setStatus(true);
                onClick();
              }
            }}
          >
            {isRevoke ? t("revoke") : t("withdraw")}
            {isLoading && status && (
              <span className="flex items-center gap-2">
                <Preloader size={20} color="black" type="circular" />
              </span>
            )}
          </Button>
        ) : (
          <>
            <span className="text-14 text-secondary-text">{t("token_owner")}</span>
            <ExternalTextLink
              text={truncateMiddle(walletAddresses[0] || "", {
                charsFromStart: 5,
                charsFromEnd: 3,
              })}
              href={getExplorerLink(ExplorerLinkType.ADDRESS, walletAddresses[0], chainId)}
            />
          </>
        )}
      </div>
    </>
  );
};

export const WithdrawDesktopTable = ({
  tableData,
  setTokenForPortfolio,
  tokenForWithdraw,
  setIsWithdrawDetailsOpened,
}: {
  tableData: TableData;
  setTokenForPortfolio: any;
  tokenForWithdraw: any;
  setIsWithdrawDetailsOpened: any;
}) => {
  const { setIsOpenedRevokeDialog, setDialogParams, standard } = useRevokeDialogStatusStore();
  const { status, setStatus } = useRevokeStatusStore();

  const tableItems = tableData
    .filter((deposite) => tokenForWithdraw.token.address0 === deposite.token.address0)
    .flatMap((deposite, index) => {
      const items: any[] = [];

      if (deposite.deposited) {
        items.push(
          <WithdrawTableItem
            key={`${deposite.walletAddresses[0]}_${deposite.contractAddress}_${deposite.token.address1}`}
            deposite={deposite}
            isRevoke={false}
            isOdd={index % 2 === 1}
            amount={deposite.deposited}
            walletAddresses={deposite.walletAddresses}
            onClick={() => {
              if (![AllowanceStatus.PENDING, AllowanceStatus.LOADING].includes(status)) {
                setStatus(AllowanceStatus.INITIAL);
              }
              setDialogParams(deposite.token, deposite.contractAddress, Standard.ERC223);
              setIsOpenedRevokeDialog(true);
            }}
            onDetailsClick={() => setTokenForPortfolio(deposite.token)}
          />,
        );
      }

      if (deposite.approved) {
        items.push(
          <WithdrawTableItem
            key={`${deposite.walletAddresses[0]}_${deposite.contractAddress}_${deposite.token.address0}`}
            deposite={deposite}
            isRevoke={true}
            isOdd={(index + 1) % 2 === 1}
            amount={deposite.approved}
            walletAddresses={deposite.walletAddresses}
            onClick={() => {
              if (![AllowanceStatus.PENDING, AllowanceStatus.LOADING].includes(status)) {
                setStatus(AllowanceStatus.INITIAL);
              }
              setDialogParams(deposite.token, deposite.contractAddress, Standard.ERC20);
              setIsOpenedRevokeDialog(true);
            }}
            onDetailsClick={() => setTokenForPortfolio(deposite.token)}
          />,
        );
      }

      return items;
    });

  const { status: revokeStatus } = useRevokeStatusStore();

  const t = useTranslations("Portfolio");

  useEffect(() => {
    if (!tableItems.length) {
      setIsWithdrawDetailsOpened(false);
    }
  }, [setIsWithdrawDetailsOpened, tableItems]);

  return (
    <>
      <div className="hidden lg:grid overflow-hidden bg-primary-bg grid-cols-[minmax(30px,1.33fr),_minmax(30px,1.33fr),_minmax(30px,1.33fr),_minmax(20px,1fr)] pb-2 relative min-w-[600px]">
        <div className="rounded-l-3 bg-table-gradient text-tertiary-text pl-5 h-[60px] flex items-center">
          {t("token_title")}
        </div>
        <div className="text-tertiary-text bg-table-gradient h-[60px] flex items-center gap-2">
          {t("amount_title")}
        </div>
        <div className="text-tertiary-text bg-table-gradient pr-5 h-[60px] flex items-center">
          {t("contract_address_title")}
        </div>
        <div className="text-tertiary-text bg-table-gradient px-5 h-[60px] flex items-center rounded-r-3">
          {t("action_title")}
        </div>
        {tableItems}
      </div>
      {[AllowanceStatus.PENDING, AllowanceStatus.LOADING].includes(revokeStatus) && (
        <div className="flex w-full pl-6 min-h-12 bg-tertiary-bg gap-2 flex-row mt-4 mb-4 rounded-3 items-center justify-between px-2">
          <Preloader size={20} color="green" type="circular" />
          <span className="mr-auto items-center text-14 text-primary-text">
            {standard === Standard.ERC20 ? t("revoke_in_progress") : t("withdraw_in_progress")}
          </span>
          <Button
            className="ml-auto mr-3"
            variant={ButtonVariant.CONTAINED}
            size={ButtonSize.EXTRA_SMALL}
            onClick={() => {
              setIsOpenedRevokeDialog(true);
            }}
          >
            {t("details")}
          </Button>
        </div>
      )}
    </>
  );
};

const WithdrawMobileTableItem = ({
  deposite,
  walletAddresses,
  onClick,
  onDetailsClick,
  isRevoke,
  amount,
}: {
  deposite: WalletDeposite;
  walletAddresses: Address[];
  onClick: () => void;
  onDetailsClick: () => void;
  isRevoke: boolean;
  amount: bigint;
}) => {
  const chainId = useCurrentChainId();
  const { address } = useAccount();
  const t = useTranslations("Portfolio");

  return (
    <>
      <div
        className="flex flex-col bg-tertiary-bg p-4 rounded-3 gap-2"
        key={deposite.token.address0}
      >
        <div className="flex justify-start items-start gap-1">
          <div className="flex gap-2">
            <Image src={"/images/tokens/placeholder.svg"} width={24} height={24} alt="" />
            <span className="text-14 mt-0.5">{`${deposite.token.name}`}</span>
          </div>
          <div
            className="px-2 py-[2px] text-14 text-secondary-text bg-quaternary-bg rounded-1 flex justify-center items-center hocus:bg-green-bg cursor-pointer duration-200"
            onClick={() => {
              onDetailsClick();
            }}
          >
            {deposite.token.symbol}
          </div>
        </div>
        <div className="flex gap-1 items-center">
          <span className="text-12 text-primary-text">{`${formatNumber(formatUnits(amount, deposite.token.decimals), 8)} ${deposite.token.symbol}`}</span>
        </div>
        <div className="flex justify-between items-center rounded-2 bg-quaternary-bg px-4 py-[10px]">
          <span className="text-14 text-secondary-text">{t("contract_address_title")}</span>
          <a
            className="flex gap-2 text-14 text-green cursor-pointer items-center hocus:text-green-hover"
            target="_blank"
            href={getExplorerLink(ExplorerLinkType.ADDRESS, deposite.contractAddress, chainId)}
          >
            {truncateMiddle(deposite.contractAddress || "", { charsFromStart: 6, charsFromEnd: 6 })}
            <Svg iconName="forward" />
          </a>
        </div>
        <div className="flex flex-col justify-center mt-1">
          {address === walletAddresses[0] ? (
            <Button
              variant={ButtonVariant.CONTAINED}
              colorScheme={ButtonColor.LIGHT_GREEN}
              size={ButtonSize.MEDIUM}
              onClick={() => {
                onClick();
              }}
            >
              {isRevoke ? "Revoke" : "Withdraw"}
            </Button>
          ) : (
            <div className="flex justify-between items-center bg-tertiary-bg px-4 py-[10px] rounded-2">
              <span className="text-14 text-secondary-text">{t("token_owner")}</span>
              <ExternalTextLink
                className="text-14 text-green"
                text={truncateMiddle(walletAddresses[0] || "", {
                  charsFromStart: 5,
                  charsFromEnd: 3,
                })}
                href={getExplorerLink(ExplorerLinkType.ADDRESS, walletAddresses[0], chainId)}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export const WithdrawMobileTable = ({
  tableData,
  setTokenForPortfolio,
  tokenForWithdraw,
  setIsWithdrawDetailsOpened,
}: {
  tableData: TableData;
  setTokenForPortfolio: any;
  tokenForWithdraw: any;
  setIsWithdrawDetailsOpened: any;
}) => {
  const { setIsOpenedRevokeDialog, setDialogParams } = useRevokeDialogStatusStore();
  const { status, setStatus } = useRevokeStatusStore();

  const tableItems = tableData
    .filter((deposite) => tokenForWithdraw.token.address0 === deposite.token.address0)
    .flatMap((deposite) => {
      const items: any[] = [];

      if (deposite.deposited) {
        items.push(
          <WithdrawMobileTableItem
            key={`${deposite.walletAddresses[0]}_${deposite.contractAddress}_${deposite.token.address1}`}
            deposite={deposite}
            isRevoke={false}
            amount={deposite.deposited}
            walletAddresses={deposite.walletAddresses}
            onClick={() => {
              if (![AllowanceStatus.PENDING, AllowanceStatus.LOADING].includes(status)) {
                setStatus(AllowanceStatus.INITIAL);
              }
              setDialogParams(deposite.token, deposite.contractAddress, Standard.ERC223);
              setIsOpenedRevokeDialog(true);
            }}
            onDetailsClick={() => setTokenForPortfolio(deposite.token)}
          />,
        );
      }

      if (deposite.approved) {
        items.push(
          <WithdrawMobileTableItem
            key={`${deposite.walletAddresses[0]}_${deposite.contractAddress}_${deposite.token.address0}`}
            deposite={deposite}
            isRevoke={true}
            amount={deposite.approved}
            walletAddresses={deposite.walletAddresses}
            onClick={() => {
              if (![AllowanceStatus.PENDING, AllowanceStatus.LOADING].includes(status)) {
                setStatus(AllowanceStatus.INITIAL);
              }
              setDialogParams(deposite.token, deposite.contractAddress, Standard.ERC20);
              setIsOpenedRevokeDialog(true);
            }}
            onDetailsClick={() => setTokenForPortfolio(deposite.token)}
          />,
        );
      }

      return items;
    });

  useEffect(() => {
    if (!tableItems.length) {
      setIsWithdrawDetailsOpened(false);
    }
  }, [setIsWithdrawDetailsOpened, tableItems]);

  return (
    <>
      <div className="flex lg:hidden flex-col gap-4">{tableItems}</div>
    </>
  );
};
