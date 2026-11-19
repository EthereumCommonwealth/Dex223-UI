"use client";
import { PropsWithChildren } from "react";

import SwapSettingsDialog from "@/app/[locale]/swap/components/SwapSettingsDialog";
import BottomNotifications from "@/components/common/BottomNotifications";
import ConfirmInWalletAlert from "@/components/dialogs/ConfirmInWalletAlert";
import ConfirmInWalletDialog from "@/components/dialogs/ConfirmInWalletDialog";
import ConnectWalletDialog from "@/components/dialogs/ConnectWalletDialog";
import FeedbackDialog from "@/components/dialogs/FeedbackDialog";
import MintTestTokensDialog from "@/components/dialogs/MintTestTokensDialog";
import NoTokenListsEnabledWarning from "@/components/dialogs/NoTokenListsEnabledWarning";
import TokenPortfolioDialog from "@/components/dialogs/TokenPortfolioDialog";
import TransactionSpeedUpDialog from "@/components/dialogs/TransactionSpeedUpDialog";
import UnknownNetworkWarning from "@/components/dialogs/UnknownNetworkWarning";
import ManageTokensDialog from "@/components/manage-tokens/ManageTokensDialog";

export default function DialogsProvider({ children }: PropsWithChildren) {
  return (
    <>
      {children}
      <TransactionSpeedUpDialog />
      <ConfirmInWalletDialog />
      <FeedbackDialog />
      <TokenPortfolioDialog />

      <BottomNotifications>
        <ConfirmInWalletAlert />
        <NoTokenListsEnabledWarning />
        <UnknownNetworkWarning />
      </BottomNotifications>
      <ManageTokensDialog />
      <MintTestTokensDialog />
      <ConnectWalletDialog />
    </>
  );
}
