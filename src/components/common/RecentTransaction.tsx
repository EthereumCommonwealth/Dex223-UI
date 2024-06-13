import clsx from "clsx";
import Image from "next/image";
import { useTranslations } from "next-intl";
import React, { ButtonHTMLAttributes, PropsWithChildren } from "react";

import Preloader from "@/components/atoms/Preloader";
import Svg from "@/components/atoms/Svg";
import Badge from "@/components/badges/Badge";
import { useTransactionSpeedUpDialogStore } from "@/components/dialogs/stores/useTransactionSpeedUpDialogStore";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import {
  IRecentTransaction,
  IRecentTransactionTitle,
  RecentTransactionStatus,
  RecentTransactionTitleTemplate,
} from "@/stores/useRecentTransactionsStore";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  color?: "primary" | "secondary";
}

function RecentTransactionActionButton({
  color = "primary",
  children,
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      {...props}
      className={clsx(
        "h-8 rounded-5 border px-6 disabled:border-secondary-border disabled:text-tertiary-text duration-300 ease-in-out disabled:pointer-events-none",
        color === "primary"
          ? "border-green text-primary-text hover:bg-green-bg hover:border-green-hover"
          : "border-primary-border text-secondary-text hover:border-primary-text hover:text-primary-text hover:bg-red-bg",
      )}
    >
      {children}
    </button>
  );
}

export function RecentTransactionTitle({ title }: { title: IRecentTransactionTitle }) {
  const t = useTranslations("RecentTransactions");

  switch (title.template) {
    case RecentTransactionTitleTemplate.APPROVE:
      return (
        <div className="flex items-center gap-1">
          <Svg iconName="check" />
          <span className="text-16 font-medium block mr-1">
            {t("approve_title", { symbol: title.symbol })}
          </span>
          <Badge color="green" text="ERC-20" />
        </div>
      );
    case RecentTransactionTitleTemplate.DEPOSIT:
      return (
        <div className="flex items-center gap-1">
          <Svg iconName="deposit" />
          <span className="text-16 font-medium block mr-1">
            {t("deposit_title", { symbol: title.symbol })}
          </span>
          <Badge color="green" text="ERC-223" />
        </div>
      );
    case RecentTransactionTitleTemplate.WITHDRAW:
      return (
        <div className="flex items-center gap-1">
          <Svg iconName="withdraw" />
          <span className="text-16 font-medium block mr-1">
            {t("withdraw_title", { symbol: title.symbol })}
          </span>
          <Badge color="green" text="ERC-223" />
        </div>
      );
    case RecentTransactionTitleTemplate.SWAP:
      return (
        <div className="flex items-center gap-1">
          <Svg iconName="swap" />
          <span className="text-16 font-medium">{t("swap_title")}</span>
        </div>
      );
    case RecentTransactionTitleTemplate.COLLECT:
      return (
        <div className="flex items-center gap-1">
          <Svg iconName="collect" />
          <span className="text-16 font-medium">{t("collect_fees_title")}</span>
        </div>
      );
    case RecentTransactionTitleTemplate.REMOVE:
      return (
        <div className="flex items-center gap-1">
          <Svg iconName="minus" />
          <span className="text-16 font-medium">{t("remove_liquidity_title")}</span>
        </div>
      );
    case RecentTransactionTitleTemplate.ADD:
      return (
        <div className="flex items-center gap-1">
          <Svg iconName="add" />
          <span className="text-16 font-medium">{t("add_liquidity_title")}</span>
        </div>
      );
  }
}

export function RecentTransactionSubTitle({ title }: { title: IRecentTransactionTitle }) {
  const t = useTranslations("RecentTransactions");

  switch (title.template) {
    case RecentTransactionTitleTemplate.APPROVE:
    case RecentTransactionTitleTemplate.DEPOSIT:
    case RecentTransactionTitleTemplate.WITHDRAW:
      return (
        <span className="text-14 text-secondary-text">
          {t("single_subtitle", {
            amount: title.amount,
            symbol: title.symbol,
          })}
        </span>
      );
    case RecentTransactionTitleTemplate.SWAP:
    case RecentTransactionTitleTemplate.REMOVE:
    case RecentTransactionTitleTemplate.COLLECT:
    case RecentTransactionTitleTemplate.ADD:
      return (
        <span className="text-14 text-secondary-text">
          {t("double_tokens_subtitle", {
            amount0: title.amount0,
            amount1: title.amount1,
            symbol0: title.symbol0,
            symbol1: title.symbol1,
          })}
        </span>
      );
  }
}

export function RecentTransactionLogo({ title }: { title: IRecentTransactionTitle }) {
  switch (title.template) {
    case RecentTransactionTitleTemplate.APPROVE:
    case RecentTransactionTitleTemplate.DEPOSIT:
    case RecentTransactionTitleTemplate.WITHDRAW:
      return (
        <div className="flex items-center justify-center w-12 h-12">
          <Image width={36} height={36} src={title.logoURI} alt="" />
        </div>
      );
    case RecentTransactionTitleTemplate.SWAP:
    case RecentTransactionTitleTemplate.REMOVE:
    case RecentTransactionTitleTemplate.COLLECT:
    case RecentTransactionTitleTemplate.ADD:
      return (
        <div className="flex items-center relative w-12 h-12">
          <Image
            className="absolute left-0 top-0"
            width={32}
            height={32}
            src={title.logoURI0}
            alt=""
          />
          <div className="w-[34px] h-[34px] flex absolute right-0 bottom-0 bg-tertiary-bg rounded-full items-center justify-center">
            <Image width={32} height={32} src={title.logoURI1} alt="" />
          </div>
        </div>
      );
  }
}

export function RecentTransactionStatusIcon({ status }: { status: RecentTransactionStatus }) {
  switch (status) {
    case RecentTransactionStatus.PENDING:
      return <Preloader />;
    case RecentTransactionStatus.SUCCESS:
      return <Svg className="text-green" iconName="done" />;
    case RecentTransactionStatus.ERROR:
      return <Svg className="text-red" iconName="error" />;
  }
}

export default function RecentTransaction({
  transaction,
  showSpeedUp = true,
  isLowestNonce = false,
}: {
  transaction: IRecentTransaction;
  isLowestNonce?: boolean;
  showSpeedUp?: boolean;
}) {
  const t = useTranslations("RecentTransactions");
  const { handleSpeedUp } = useTransactionSpeedUpDialogStore();

  return (
    <div
      key={transaction.hash}
      className="flex justify-between w-full bg-tertiary-bg rounded-3 p-5 items-center @container flex-wrap"
    >
      <div className="flex gap-2 items-center">
        <RecentTransactionLogo title={transaction.title} />
        <div className="grid">
          <RecentTransactionTitle title={transaction.title} />
          <RecentTransactionSubTitle title={transaction.title} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-3 @[620px]:flex">
          {transaction.status === RecentTransactionStatus.PENDING &&
            showSpeedUp &&
            isLowestNonce && (
              <>
                <RecentTransactionActionButton disabled color="secondary">
                  {t("cancel")}
                </RecentTransactionActionButton>
                <RecentTransactionActionButton disabled onClick={() => handleSpeedUp(transaction)}>
                  {t("speed_up")}
                </RecentTransactionActionButton>
              </>
            )}
          {transaction.status === RecentTransactionStatus.PENDING &&
            showSpeedUp &&
            !isLowestNonce && (
              <>
                <RecentTransactionActionButton disabled color="secondary">
                  {t("queue")}
                </RecentTransactionActionButton>
              </>
            )}
        </div>

        <a
          className="w-10 h-10 flex items-center justify-center"
          target="_blank"
          href={getExplorerLink(
            ExplorerLinkType.TRANSACTION,
            transaction.hash,
            transaction.chainId,
          )}
        >
          <Svg iconName="forward" />
        </a>
        <span className="flex-shrink-0">
          <RecentTransactionStatusIcon status={transaction.status} />
        </span>
      </div>
      {transaction.status === RecentTransactionStatus.PENDING && showSpeedUp && isLowestNonce && (
        <div className="@[620px]:hidden w-full grid grid-cols-2 gap-3 mt-3">
          <RecentTransactionActionButton disabled color="secondary">
            {t("cancel")}
          </RecentTransactionActionButton>
          <RecentTransactionActionButton disabled onClick={() => handleSpeedUp(transaction)}>
            {t("speed_up")}
          </RecentTransactionActionButton>
        </div>
      )}
      {transaction.status === RecentTransactionStatus.PENDING && showSpeedUp && !isLowestNonce && (
        <div className="@[620px]:hidden w-full mt-3 grid grid-cols-1">
          <RecentTransactionActionButton disabled color="secondary">
            {t("queue")}
          </RecentTransactionActionButton>
        </div>
      )}
    </div>
  );
}
