import ExternalTextLink from "@repo/ui/external-text-link";
import Preloader from "@repo/ui/preloader";
import React from "react";

import Dialog from "@/components/atoms/Dialog";
import IconButton, { IconButtonVariant } from "@/components/buttons/IconButton";

import Svg from "../atoms/Svg";

export type TransactionSendStatus = "sending" | "confirming" | "success" | "failed" | "error";

interface MSigTransactionDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  status: TransactionSendStatus;
  transactionId?: string;
  transactionHash?: string;
  explorerUrl?: string;
  canClose?: boolean;
  errorMessage?: string;
}

export default function MSigTransactionDialog({
  isOpen,
  setIsOpen,
  status,
  transactionId,
  transactionHash,
  explorerUrl,
  canClose = true,
  errorMessage,
}: MSigTransactionDialogProps) {
  const handleClose = () => {
    setIsOpen(false);
  };

  const renderContent = () => {
    switch (status) {
      case "sending":
        return (
          <div className="flex flex-col items-center justify-center gap-4 p-6">
            <div className="w-16 h-16 flex items-center justify-center">
              <Preloader size={48} />
            </div>
            <div className="text-center">
              <h3 className="text-18 font-semibold text-primary-text mb-2">Transaction sending</h3>
              <p className="text-14 text-secondary-text">The transaction is in progress</p>
            </div>
          </div>
        );

      case "confirming":
        return (
          <div className="flex flex-col items-center justify-center gap-4 p-6">
            <div className="w-16 h-16 flex items-center justify-center">
              <Preloader size={48} type="linear" />
            </div>
            <div className="flex flex-col items-center justify-center gap-2">
              <h3 className="text-18 font-semibold text-primary-text">Confirming transaction</h3>
              {transactionHash && explorerUrl && (
                <ExternalTextLink
                  text="Transaction link"
                  href={explorerUrl}
                  className="text-green hover:text-green-hover"
                >
                  Transaction link
                </ExternalTextLink>
              )}
            </div>
          </div>
        );

      case "success":
        return (
          <div className="flex flex-col items-center justify-center gap-4 p-6">
            <div className="w-16 h-16 bg-green rounded-full flex items-center justify-center">
              <Svg className="text-white" iconName="check" size={70} />
            </div>
            <div className="flex flex-col items-center justify-center gap-2">
              <h3 className="text-18 font-semibold text-primary-text">Successfully sent</h3>
              {transactionId &&
                !transactionId.startsWith("proposing") &&
                !transactionId.startsWith("approving") &&
                !transactionId.startsWith("declining") &&
                !transactionId.startsWith("executing") && (
                  <span className="text-14 text-secondary-text">
                    Transaction ID: {transactionId}
                  </span>
                )}
              {transactionHash && explorerUrl && (
                <ExternalTextLink
                  text="Transaction link"
                  href={explorerUrl}
                  className="text-green hover:text-green-hover"
                >
                  Transaction link
                </ExternalTextLink>
              )}
            </div>
          </div>
        );

      case "failed":
        return (
          <div className="flex flex-col items-center justify-center gap-4 p-6">
            <div className="w-16 h-16 bg-red rounded-full flex items-center justify-center">
              <Svg className="text-white" iconName="warning" size={70} />
            </div>
            <div className="text-center">
              <h3 className="text-18 font-semibold text-red mb-2">Failed to send</h3>
              {transactionId &&
                !transactionId.startsWith("proposing") &&
                !transactionId.startsWith("approving") &&
                !transactionId.startsWith("declining") &&
                !transactionId.startsWith("executing") && (
                  <p className="text-14 text-secondary-text mb-2">
                    Transaction ID: {transactionId}
                  </p>
                )}
            </div>
          </div>
        );
      case "error":
        return (
          <div className="flex flex-col items-center justify-center gap-4 p-6">
            <div className="w-16 h-16 bg-red rounded-full flex items-center justify-center">
              <Svg className="text-white" iconName="warning" size={70} />
            </div>
            <div className="text-center">
              <h3 className="text-18 font-semibold text-red mb-2">Error</h3>
              {errorMessage && (
                <p className="text-14 text-secondary-text mb-2 break-all">{errorMessage}</p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog isOpen={isOpen} setIsOpen={setIsOpen}>
      <div className="w-[500px] relative">
        {canClose && (
          <IconButton
            variant={IconButtonVariant.CLOSE}
            handleClose={handleClose}
            className="absolute top-4 right-4"
          />
        )}
        {renderContent()}
      </div>
    </Dialog>
  );
}
