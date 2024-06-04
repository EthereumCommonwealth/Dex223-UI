"use client";
import { PropsWithChildren } from "react";

import SwapSettingsDialog from "@/app/[locale]/swap/components/SwapSettingsDialog";
import ConfirmInWalletAlert from "@/components/dialogs/ConfirmInWalletAlert";
import ConfirmInWalletDialog from "@/components/dialogs/ConfirmInWalletDialog";
import FeedbackDialog from "@/components/dialogs/FeedbackDialog";
import NoTokenListsEnabledWarning from "@/components/dialogs/NoTokenListsEnabledWarning";
import { useTransactionSettingsDialogStore } from "@/components/dialogs/stores/useTransactionSettingsDialogStore";
import TokenPortfolioDialog from "@/components/dialogs/TokenPortfolioDialog";
import TransactionSpeedUpDialog from "@/components/dialogs/TransactionSpeedUpDialog";

export default function DialogsProvider({ children }: PropsWithChildren) {
  const { isOpen, setIsOpen } = useTransactionSettingsDialogStore();

  return (
    <>
      {children}
      <SwapSettingsDialog isOpen={isOpen} setIsOpen={() => setIsOpen(!isOpen)} />
      <TransactionSpeedUpDialog />
      <ConfirmInWalletDialog />
      <FeedbackDialog />
      <TokenPortfolioDialog />

      <ConfirmInWalletAlert />
      <NoTokenListsEnabledWarning />
    </>
  );
}
