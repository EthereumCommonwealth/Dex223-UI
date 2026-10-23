import { useTranslations } from "next-intl";
import React, { useCallback, useMemo, useState } from "react";

import MarginGasSettings from "@/app/[locale]/margin-trading/components/MarginGasSettings";
import PositionDepositDialog from "@/app/[locale]/margin-trading/position/[id]/deposit/components/PositionDepositDialog";
import { usePositionDepositGasEstimate } from "@/app/[locale]/margin-trading/position/[id]/deposit/hooks/usePositionDeposit";
import { MarginPosition } from "@/app/[locale]/margin-trading/types";
import { useSwapRecentTransactionsStore } from "@/app/[locale]/swap/stores/useSwapRecentTransactions";
import { InputSize } from "@/components/atoms/Input";
import TextField, { InputLabel } from "@/components/atoms/TextField";
import Button from "@/components/buttons/Button";
import IconButton, { IconButtonSize } from "@/components/buttons/IconButton";
import TokenInput from "@/components/common/TokenInput";
import PickTokenDialog from "@/components/dialogs/PickTokenDialog";
import { formatFloat } from "@/functions/formatFloat";
import useTokenBalances from "@/hooks/useTokenBalances";
import { Currency } from "@/sdk_bi/entities/currency";
import { Standard } from "@/sdk_bi/standard";

export default function DepositForm({ position }: { position: MarginPosition }) {
  const t = useTranslations("Margin");
  const [amountToDeposit, setAmountToDeposit] = useState("");
  const [isOpenedTokenPick, setIsOpenedTokenPick] = useState(false);

  const [isDepositDialogOpened, setIsDepositDialogOpened] = useState(false);
  const [assetToDeposit, setAssetToDeposit] = useState<Currency | undefined>(undefined);
  const [assetToDepositStandard, setAssetToDepositStandard] = useState(Standard.ERC20);
  usePositionDepositGasEstimate({
    position,
    amount: amountToDeposit,
    currency: assetToDeposit,
    standard: assetToDepositStandard,
  });

  const handlePick = useCallback((token: Currency) => {
    setAssetToDeposit(token);
    // setTokenAStandard(Standard.ERC20);

    setIsOpenedTokenPick(false);
  }, []);

  const { isOpened: showRecentTransactions, setIsOpened: setShowRecentTransactions } =
    useSwapRecentTransactionsStore();
  const {
    balance: { erc20Balance: tokenA0Balance, erc223Balance: tokenA1Balance },
    refetch: refetchABalance,
  } = useTokenBalances(assetToDeposit);

  const isCurrencyLimitReached = useMemo(() => {
    return position.assets.length === position.order.currencyLimit;
  }, [position.assets.length, position.order.currencyLimit]);

  return (
    <div className="w-[600px] card-spacing-x card-spacing-b bg-primary-bg rounded-5">
      <>
        <div className="flex justify-between items-center mb-2.5 pt-1.5">
          <h3 className="font-bold text-20">{t("deposit")}</h3>
          <div className="flex items-center relative left-3">
            <IconButton
              buttonSize={IconButtonSize.LARGE}
              active={showRecentTransactions}
              iconName="recent-transactions"
              onClick={() => setShowRecentTransactions(!showRecentTransactions)}
            />
          </div>
        </div>
        <p className="text-secondary-text mb-4">{t("deposit_position_hint")}</p>
        <div className="bg-tertiary-bg rounded-3 px-5 pt-5 pb-4">
          <div className="mb-4">
            <InputLabel
              inputSize={InputSize.LARGE}
              label={t("deposit_amount")}
              tooltipText={t("deposit_amount_position_tooltip")}
            />
            <TokenInput
              allowedErc223={position.order.isErc223TradingAllowed}
              value={amountToDeposit}
              onInputChange={(value) => {
                setAmountToDeposit(value);
              }}
              handleClick={() => {
                setIsOpenedTokenPick(true);
              }}
              token={assetToDeposit}
              balance0={
                tokenA0Balance && Boolean(tokenA0Balance.value)
                  ? formatFloat(tokenA0Balance.formatted)
                  : "0"
              }
              balance1={
                tokenA1Balance && Boolean(tokenA1Balance.value)
                  ? formatFloat(tokenA1Balance.formatted)
                  : "0"
              }
              standard={assetToDepositStandard}
              setStandard={(standard) => {
                setAssetToDepositStandard(standard);
              }}
            />
          </div>
        </div>

        <div className="mt-5">
          <MarginGasSettings operation="depositPosition" />
        </div>

        {assetToDeposit ? (
          <Button onClick={() => setIsDepositDialogOpened(true)} fullWidth>
            {t("deposit_symbol", { symbol: assetToDeposit.symbol })}
          </Button>
        ) : (
          <Button disabled fullWidth>
            {t("select_token_to_deposit")}
          </Button>
        )}

        {assetToDeposit && (
          <PositionDepositDialog
            isOpen={isDepositDialogOpened}
            setIsOpen={setIsDepositDialogOpened}
            position={position}
            amountToDeposit={amountToDeposit}
            assetToDeposit={assetToDeposit}
            assetToDepositStandard={assetToDepositStandard}
          />
        )}

        <PickTokenDialog
          handlePick={handlePick}
          isOpen={isOpenedTokenPick}
          setIsOpen={setIsOpenedTokenPick}
          availableTokens={position.order.allowedTradingAssets}
        />
      </>
    </div>
  );
}
