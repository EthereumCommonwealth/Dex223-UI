import { useTranslations } from "next-intl";
import { useState } from "react";
import { formatEther, formatGwei, formatUnits } from "viem";
import { useAccount } from "wagmi";

import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import Badge from "@/components/badges/Badge";
import Button, { ButtonSize, ButtonVariant } from "@/components/buttons/Button";
import { formatFloat } from "@/functions/formatFloat";
import { TokenStandard } from "@/sdk_hybrid/entities/token";
import { EstimatedGasId, useEstimatedGasStoreById } from "@/stores/useEstimatedGasStore";

import { ApproveTransaction, useLiquidityApprove } from "../hooks/useLiquidityApprove";

export const FeeDetailsButton = ({ isDisabled }: { isDisabled: boolean }) => {
  const t = useTranslations("Liquidity");
  const [isOpen, setIsOpen] = useState(false);
  const { chain } = useAccount();

  const estimatedMintGas = useEstimatedGasStoreById(EstimatedGasId.mint);

  const { gasPrice, approveTransactions, approveTotalGasLimit, approveTransactionsCount } =
    useLiquidityApprove();

  const transactionItems = [
    {
      transaction: approveTransactions.approveA,
      standard: "ERC-20" as TokenStandard,
    },
    {
      transaction: approveTransactions.depositA,
      standard: "ERC-223" as TokenStandard,
    },
    {
      transaction: approveTransactions.approveB,
      standard: "ERC-20" as TokenStandard,
    },
    {
      transaction: approveTransactions.depositB,
      standard: "ERC-223" as TokenStandard,
    },
  ].filter(({ transaction }) => !!transaction && !transaction.isAllowed);

  const totalGasLimit = approveTotalGasLimit + estimatedMintGas;

  return (
    <div className="w-full md:w-auto">
      <Button
        onClick={() => !isDisabled && setIsOpen(true)}
        size={ButtonSize.EXTRA_SMALL}
        variant={ButtonVariant.OUTLINED}
        disabled={isDisabled}
        mobileSize={ButtonSize.SMALL}
        fullWidth
      >
        {t("details")}
      </Button>

      <DrawerDialog isOpen={isOpen} setIsOpen={setIsOpen}>
        <DialogHeader onClose={() => setIsOpen(false)} title="Fee details" />
        <div className="w-full md:w-[570px] px-4 md:px-10 pb-4 md:pb-10">
          {(transactionItems as { transaction: ApproveTransaction; standard: TokenStandard }[]).map(
            ({ transaction, standard }, index) => (
              <div key={`${transaction.token.address0}_${standard}`} className="flex gap-2">
                <div className="flex flex-col items-center">
                  <div className="flex justify-center items-center rounded-full min-h-10 min-w-10 w-10 h-10 bg-green-bg">
                    {index + 1}
                  </div>
                  <div className="w-[2px] bg-green-bg h-full my-2 rounded-3"></div>
                </div>
                <div className="w-full">
                  <div className="flex gap-2 py-2 items-center">
                    <span>
                      {standard === "ERC-20"
                        ? t("fee_details_aprove_for", { symbol: transaction.token.symbol })
                        : t("fee_details_deposit_for", { symbol: transaction.token.symbol })}
                    </span>
                    <Badge color="green" text={standard} />
                  </div>
                  <div className="flex justify-between bg-secondary-bg px-5 py-3 rounded-3 text-secondary-text mt-2">
                    <span>
                      {formatUnits(transaction.amount || BigInt(0), transaction.token.decimals)}
                    </span>
                    <span>{t("fee_details_amount", { symbol: transaction.token.symbol })}</span>
                  </div>
                  <div className="flex justify-between bg-tertiary-bg px-5 py-3 rounded-3 mb-5 mt-2">
                    <div className="flex flex-col">
                      <span className="text-14 text-secondary-text">{t("gas_price")}</span>
                      <span>{gasPrice ? formatFloat(formatGwei(gasPrice)) : ""} GWEI</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-14 text-secondary-text">{t("gas_limit")}</span>
                      <span>{transaction.estimatedGas?.toString()}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-14 text-secondary-text">{t("fee")}</span>
                      <span>{`${gasPrice && transaction.estimatedGas ? formatFloat(formatEther(gasPrice * transaction.estimatedGas)) : ""} ${chain?.nativeCurrency.symbol}`}</span>
                    </div>
                  </div>
                </div>
              </div>
            ),
          )}

          <div key="10" className="flex gap-2">
            <div className="flex flex-col items-center">
              <div className="flex justify-center items-center rounded-full min-h-10 min-w-10 w-10 h-10 bg-green-bg">
                {approveTransactionsCount + 1}
              </div>
            </div>
            <div className="w-full">
              <div className="flex gap-2 py-2 items-center">
                <span>{t("fee_details_add_liquidity")}</span>
              </div>
              <div className="flex justify-between bg-tertiary-bg px-5 py-3 rounded-3 mb-5 mt-2">
                <div className="flex flex-col">
                  <span className="text-14 text-secondary-text">{t("gas_price")}</span>
                  <span>{gasPrice ? formatFloat(formatGwei(gasPrice)) : ""} GWEI</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-14 text-secondary-text">{t("gas_limit")}</span>
                  <span>{estimatedMintGas.toString()}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-14 text-secondary-text">{t("fee")}</span>
                  <span>{`${gasPrice ? formatFloat(formatEther(gasPrice * estimatedMintGas)) : ""} ${chain?.nativeCurrency.symbol}`}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-1 justify-center items-center border-t pt-4 border-secondary-border">
            <span className="text-secondary-text">{t("total_fee")}</span>
            <span className="font-bold">{`${gasPrice && totalGasLimit ? formatFloat(formatEther(gasPrice * totalGasLimit)) : ""} ${chain?.nativeCurrency.symbol}`}</span>
          </div>
        </div>
      </DrawerDialog>
    </div>
  );
};
