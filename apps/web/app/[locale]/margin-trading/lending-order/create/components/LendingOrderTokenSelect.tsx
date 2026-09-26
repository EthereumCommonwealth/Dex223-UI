import { useTranslations } from "next-intl";
import React, { useCallback, useEffect, useState } from "react";
import { parseUnits } from "viem";

import { InputSize } from "@/components/atoms/Input";
import { HelperText, InputLabel } from "@/components/atoms/TextField";
import TokenInput from "@/components/common/TokenInput";
import PickTokenDialog from "@/components/dialogs/PickTokenDialog";
import { formatFloat } from "@/functions/formatFloat";
import useTokenBalances from "@/hooks/useTokenBalances";
import { Currency } from "@/sdk_bi/entities/currency";
import { Standard } from "@/sdk_bi/standard";
import { useGlobalBlockNumber } from "@/shared/hooks/useGlobalBlockNumber";

export default function LendingOrderTokenSelect({
  token,
  setToken,
  amount,
  setAmount,
  standard,
  setStandard,
  errors,
  label,
  setIsEnoughBalance,
  tokens,
  helperText,
  allowedErc223,
  readonly,
}: {
  token: Currency | undefined;
  setToken: (token: Currency) => Promise<void>;
  amount: string;
  setAmount: (amount: string) => void;
  standard: Standard;
  setStandard: (standard: Standard) => Promise<void>;
  errors: string[];
  label?: string;
  setIsEnoughBalance?: (isEnoughBalance: boolean) => void;
  tokens?: Currency[];
  helperText?: string;
  allowedErc223: boolean;
  readonly?: boolean;
}) {
  const t = useTranslations("Margin");
  const resolvedLabel = label ?? t("loan_amount");
  const [isOpenedTokenPick, setIsOpenedTokenPick] = useState(false);

  const handlePick = useCallback(
    async (token: Currency) => {
      await setToken(token);
      await setStandard(Standard.ERC20);

      setIsOpenedTokenPick(false);
    },
    [setStandard, setToken],
  );

  const {
    balance: { erc20Balance: token0Balance, erc223Balance: token1Balance },
    refetch: refetchBalance,
  } = useTokenBalances(token);

  const { blockNumber } = useGlobalBlockNumber();

  useEffect(() => {
    if (!setIsEnoughBalance) {
      return;
    }

    if (!amount || !token) {
      setIsEnoughBalance(true);
      return;
    }

    if (
      standard === Standard.ERC20 &&
      (!token0Balance || token0Balance.value < parseUnits(amount, token.decimals))
    ) {
      setIsEnoughBalance(false);
      return;
    }

    if (
      standard === Standard.ERC223 &&
      (!token1Balance || token1Balance.value < parseUnits(amount, token.decimals))
    ) {
      setIsEnoughBalance(false);
      return;
    }

    setIsEnoughBalance(true);
  }, [amount, setIsEnoughBalance, standard, token, token0Balance, token1Balance]);

  useEffect(() => {
    refetchBalance();
  }, [blockNumber, refetchBalance]);

  return (
    <div className="">
      <InputLabel
        inputSize={InputSize.LARGE}
        label={resolvedLabel}
        tooltipText={t("loan_amount_tooltip")}
      />
      <TokenInput
        readOnly={readonly}
        readOnlyToken={readonly}
        isError={!!errors.length}
        handleClick={() => {
          setIsOpenedTokenPick(true);
        }}
        token={token}
        value={amount}
        onInputChange={(value) => {
          setAmount(value);
        }}
        balance0={
          token0Balance && Boolean(token0Balance.value) ? formatFloat(token0Balance.formatted) : "0"
        }
        balance1={
          token1Balance && Boolean(token1Balance.value) ? formatFloat(token1Balance.formatted) : "0"
        }
        standard={standard}
        setStandard={setStandard}
        allowedErc223={allowedErc223}
      />
      <PickTokenDialog
        handlePick={handlePick}
        isOpen={isOpenedTokenPick}
        setIsOpen={setIsOpenedTokenPick}
        availableTokens={tokens}
      />
      <div className="mb-4">
        <HelperText error={errors[0]} helperText={helperText} />
      </div>
    </div>
  );
}
