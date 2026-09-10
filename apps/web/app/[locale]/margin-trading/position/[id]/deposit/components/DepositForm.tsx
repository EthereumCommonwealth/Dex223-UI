import React, { useCallback, useMemo, useState } from "react";
import { formatEther, formatGwei } from "viem";
import { useAccount } from "wagmi";

import PositionDepositDialog from "@/app/[locale]/margin-trading/position/[id]/deposit/components/PositionDepositDialog";
import { MarginPosition } from "@/app/[locale]/margin-trading/types";
import { useSwapRecentTransactionsStore } from "@/app/[locale]/swap/stores/useSwapRecentTransactions";
import { InputSize } from "@/components/atoms/Input";
import TextField, { InputLabel } from "@/components/atoms/TextField";
import Button, { ButtonColor, ButtonSize } from "@/components/buttons/Button";
import IconButton, { IconButtonSize } from "@/components/buttons/IconButton";
import TokenInput from "@/components/common/TokenInput";
import PickTokenDialog from "@/components/dialogs/PickTokenDialog";
import { formatFloat } from "@/functions/formatFloat";
import useTokenBalances from "@/hooks/useTokenBalances";
import { Currency } from "@/sdk_bi/entities/currency";
import { Standard } from "@/sdk_bi/standard";

export default function DepositForm({ position }: { position: MarginPosition }) {
  const [amountToDeposit, setAmountToDeposit] = useState("");
  const [isOpenedTokenPick, setIsOpenedTokenPick] = useState(false);

  const [isDepositDialogOpened, setIsDepositDialogOpened] = useState(false);
  const [assetToDeposit, setAssetToDeposit] = useState<Currency | undefined>(undefined);
  const [assetToDepositStandard, setAssetToDepositStandard] = useState(Standard.ERC20);

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
          <h3 className="font-bold text-20">Deposit</h3>
          <div className="flex items-center relative left-3">
            <IconButton
              buttonSize={IconButtonSize.LARGE}
              active={showRecentTransactions}
              iconName="recent-transactions"
              onClick={() => setShowRecentTransactions(!showRecentTransactions)}
            />
          </div>
        </div>
        <p className="text-secondary-text mb-4">
          When you make a deposit, your collateral will increase and your leverage will decrease.
          This adjustment helps to enhance your margin position&apos;s stability by reducing the
          risk associated with high leverage
        </p>
        <div className="bg-tertiary-bg rounded-3 px-5 pt-5 pb-4">
          <div className="mb-4">
            <InputLabel
              inputSize={InputSize.LARGE}
              label="Deposit amount"
              tooltipText="Tooltip text"
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

          {/*<TextField*/}
          {/*  label="Leverage"*/}
          {/*  tooltipText="Tooltip text"*/}
          {/*  helperText={`Max leverage: ${position.order.leverage}x`}*/}
          {/*/>*/}
        </div>

        <div className="mt-5 bg-tertiary-bg px-5 py-2 mb-5 flex justify-between items-center rounded-3 flex-col xs:flex-row">
          <div className="text-12 xs:text-14 flex items-center gap-8 justify-between xs:justify-start max-xs:w-full">
            <p className="flex flex-col text-tertiary-text">
              <span>Gas price:</span>
              <span> {formatFloat(formatGwei(BigInt(0)))} GWEI</span>
            </p>

            <p className="flex flex-col text-tertiary-text">
              <span>Gas limit:</span>
              <span>{329000}</span>
            </p>
            <p className="flex flex-col">
              <span className="text-tertiary-text">Network fee:</span>
              <span>{formatFloat(formatEther(BigInt(0) * BigInt(0), "wei"))} ETH</span>
            </p>
          </div>
          <div className="grid grid-cols-[auto_1fr] xs:flex xs:items-center gap-2 w-full xs:w-auto mt-2 xs:mt-0">
            <span className="flex items-center justify-center px-2 text-14 rounded-20 font-500 text-secondary-text border border-secondary-border max-xs:h-8">
              Cheaper
            </span>
            <Button
              colorScheme={ButtonColor.LIGHT_GREEN}
              size={ButtonSize.EXTRA_SMALL}
              onClick={() => null}
              fullWidth={false}
              className="rounded-5"
            >
              Edit
            </Button>
          </div>
        </div>

        {assetToDeposit ? (
          <Button onClick={() => setIsDepositDialogOpened(true)} fullWidth>
            Deposit {assetToDeposit.symbol}
          </Button>
        ) : (
          <Button disabled fullWidth>
            Select token to deposit
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
