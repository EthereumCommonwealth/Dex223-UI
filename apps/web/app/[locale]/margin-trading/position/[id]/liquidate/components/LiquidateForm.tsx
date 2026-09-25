import Alert from "@repo/ui/alert";
import Checkbox from "@repo/ui/checkbox";
import Tooltip from "@repo/ui/tooltip";
import React, { useState } from "react";
import { formatEther, formatGwei, formatUnits } from "viem";
import { useAccount } from "wagmi";

import usePositionStatus from "@/app/[locale]/margin-trading/position/[id]/hooks/usePositionStatus";
import ConfirmLiquidatePositionDialog from "@/app/[locale]/margin-trading/position/[id]/liquidate/components/ConfirmLiquidatePositionDialog";
import useLiquidatePosition from "@/app/[locale]/margin-trading/position/[id]/liquidate/hooks/useLiquidatePosition";
import { MarginPosition } from "@/app/[locale]/margin-trading/types";
import { useSwapRecentTransactionsStore } from "@/app/[locale]/swap/stores/useSwapRecentTransactions";
import Button, { ButtonColor, ButtonSize } from "@/components/buttons/Button";
import IconButton, {
  IconButtonSize,
  IconButtonVariant,
  IconSize,
} from "@/components/buttons/IconButton";
import RadioButton from "@/components/buttons/RadioButton";
import { formatFloat } from "@/functions/formatFloat";
import { Currency } from "@/sdk_bi/entities/currency";

function PositionInfoCard({
  label1,
  label2,
  value1,
  value2,
  tooltip1,
  tooltip2,
  currency,
}: {
  label1: string;
  label2: string;
  value1: string;
  value2: string;
  tooltip1: string;
  tooltip2: string;
  currency: Currency;
}) {
  return (
    <div className="bg-quaternary-bg rounded-3 px-5 py-2.5">
      <div className="text-tertiary-text text-14 flex items-center gap-1">
        {label1} <Tooltip iconSize={20} text={tooltip1} /> / {label2}{" "}
        <Tooltip iconSize={20} text={tooltip2} />
      </div>
      <div className="">
        {value1} / {value2} <span className="text-secondary-text">{currency.symbol}</span>
      </div>
    </div>
  );
}

enum TypeOfReceivedAssets {
  LOANED_CURRENCY,
  BORROWER_CURRENCIES,
}

enum ActionWithAssets {
  RETURN_TO_ORDER,
  SEND_TO_ADDRESS,
}

export default function LiquidateForm({ position }: { position: MarginPosition }) {
  const [isLiquidateDialogOpened, setIsLiquidateDialogOpened] = useState(false);

  const { handleLiquidatePosition } = useLiquidatePosition(position);

  const [checkedPrices, setCheckedPrices] = useState(false);
  const [checkedTerms, setCheckedTerms] = useState(false);

  const { address } = useAccount();
  const { isOpened: showRecentTransactions, setIsOpened: setShowRecentTransactions } =
    useSwapRecentTransactionsStore();

  const { expectedBalance, actualBalance } = usePositionStatus(position);

  return (
    <div className="w-[600px] bg-primary-bg rounded-5 card-spacing-x card-spacing-b">
      <div className="h-[60px] mb-2.5 flex justify-between items-center -mx-3">
        <IconButton
          variant={IconButtonVariant.BACK}
          iconSize={IconSize.REGULAR}
          buttonSize={IconButtonSize.LARGE}
          onClick={() => {
            window.history.back();
          }}
        />
        <h3 className="font-bold text-20">Liquidation</h3>
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
        When an asset is liquidated, the proceeds from its sale are first used to pay off any
        outstanding debts and obligations. Once creditors have been settled, any remaining funds are
        distributed to the shareholders or owners of the asset
      </p>

      <div className="flex flex-col gap-5">
        <div className="bg-tertiary-bg rounded-3 flex flex-col gap-3 pb-5 px-5 pt-3">
          <div className="flex justify-between items-center">
            <h2 className="text-secondary-text font-bold">Position to be liquidated</h2>
            <div className="px-4 py-2 rounded-2 bg-quaternary-bg text-12">
              <span className="text-tertiary-text">ID:</span>
              <span className="text-secondary-text">{position.id}</span>
            </div>
          </div>

          <PositionInfoCard
            value1={
              actualBalance
                ? formatFloat(formatUnits(actualBalance, position.loanAsset.decimals))
                : "Loading..."
            }
            value2={
              expectedBalance
                ? formatFloat(formatUnits(expectedBalance, position.loanAsset.decimals))
                : "Loading..."
            }
            currency={position.loanAsset}
            label1={"Total balance"}
            label2="Expected balance"
            tooltip1={"TOOLTIP_TEXT"}
            tooltip2={"TOOLTIP_TEXT"}
          />
          <PositionInfoCard
            value1={position.order.liquidationRewardAmount.formatted}
            value2={"0"}
            currency={position.loanAsset}
            label1={"Liquidation fee"}
            label2="Liquidation cost"
            tooltip1={"TOOLTIP_TEXT"}
            tooltip2={"TOOLTIP_TEXT"}
          />
        </div>

        {address?.toLowerCase() === position.order.owner.toLowerCase() && (
          <div className="bg-tertiary-bg rounded-3 flex flex-col gap-3 pb-5 px-5 pt-3">
            <h2 className="text-secondary-text font-bold">Type of received assets</h2>

            <div className="grid grid-cols-2 gap-3">
              <RadioButton className="min-h-10 py-2 pr-4" isActive={true}>
                Loaned currency
              </RadioButton>
              <RadioButton disabled className="min-h-10 py-2 pr-4" isActive={false}>
                Borrower currencies
              </RadioButton>
            </div>
          </div>
        )}

        {address?.toLowerCase() === position.order.owner.toLowerCase() && (
          <div className="bg-tertiary-bg rounded-3 flex flex-col gap-3 pb-5 px-5 pt-3">
            <h2 className="text-secondary-text font-bold">Action with assets</h2>

            <div className="grid grid-cols-2 gap-3">
              <RadioButton className="min-h-10 py-2 pr-4" isActive={true}>
                Return to order
              </RadioButton>
              <RadioButton disabled className="min-h-10 py-2 pr-4" isActive={false}>
                Send to address
              </RadioButton>
            </div>
          </div>
        )}

        <Alert
          text="The asset prices at the time of liquidation may not match the current prices"
          withIcon={false}
          type="warning"
        />

        <div className="flex flex-col gap-3">
          <Alert
            text="The margin position will be initially frozen and subsequently liquidated"
            withIcon={false}
            type="info"
          />

          <div className="flex flex-col gap-4 py-2">
            <Checkbox
              checked={checkedPrices}
              handleChange={() => setCheckedPrices(!checkedPrices)}
              id={"agree-liquidation"}
              label="I agree that liquidation prices may differ from current prices"
            />

            <Checkbox
              checked={checkedTerms}
              handleChange={() => setCheckedTerms(!checkedTerms)}
              id={"agree-terms"}
              label={
                <span>
                  I understand and agree to the{" "}
                  <a
                    className="text-green underline"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://www.google.com"
                  >
                    terms and conditions of liquidation
                  </a>
                </span>
              }
            />
          </div>

          <div className="bg-tertiary-bg px-5 py-2 flex justify-between items-center rounded-3 flex-col xs:flex-row">
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
        </div>

        {!position.isLiquidated ? (
          <Button
            fullWidth
            onClick={() => {
              setIsLiquidateDialogOpened(true);
              handleLiquidatePosition();
            }}
            disabled={!checkedTerms || !checkedPrices}
            colorScheme={ButtonColor.RED}
          >
            Liquidate position
          </Button>
        ) : (
          <Button fullWidth disabled>
            Position already liquidated
          </Button>
        )}
      </div>

      <ConfirmLiquidatePositionDialog
        isOpen={isLiquidateDialogOpened}
        setIsOpen={setIsLiquidateDialogOpened}
        position={position}
      />
    </div>
  );
}
