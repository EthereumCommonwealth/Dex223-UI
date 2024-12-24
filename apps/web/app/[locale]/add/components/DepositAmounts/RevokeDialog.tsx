import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { NumericFormat } from "react-number-format";
import { formatUnits, parseUnits } from "viem";

import { RemoveLiquidityGasSettings } from "@/app/[locale]/remove/[tokenId]/components/RemoveLiquidityGasSettings";
import Alert from "@/components/atoms/Alert";
import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import Preloader from "@/components/atoms/Preloader";
import Svg from "@/components/atoms/Svg";
import Badge from "@/components/badges/Badge";
import Button from "@/components/buttons/Button";
import { clsxMerge } from "@/functions/clsxMerge";
import { AllowanceStatus } from "@/hooks/useAllowance";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import useRevoke, { useRevokeEstimatedGas } from "@/hooks/useRevoke";
import useWithdraw, { useWithdrawEstimatedGas } from "@/hooks/useWithdraw";
import { NONFUNGIBLE_POSITION_MANAGER_ADDRESS } from "@/sdk_hybrid/addresses";
import { DexChainId } from "@/sdk_hybrid/chains";
import { Standard } from "@/sdk_hybrid/standard";
import { useRevokeDialogStatusStore } from "@/stores/useRevokeDialogStatusStore";
import { useRevokeStatusStore } from "@/stores/useRevokeStatusStore";

import {
  useRevokeGasLimitStore,
  useRevokeGasModeStore,
  useRevokeGasPrice,
  useRevokeGasPriceStore,
  useWithdrawGasLimitStore,
} from "../../stores/useRevokeGasSettings";

export const RevokeDialog = () => {
  const { status } = useRevokeStatusStore();

  const t = useTranslations("Liquidity");
  const {
    isOpenedRevokeDialog: isOpen,
    setIsOpenedRevokeDialog: setIsOpen,
    token,
    standard,
    contractAddress,
  } = useRevokeDialogStatusStore();

  const [localValue, setLocalValue] = useState(undefined as undefined | string);
  const localValueBigInt = useMemo(() => {
    if (!token || !localValue) return undefined;
    return parseUnits(localValue, token?.decimals);
  }, [localValue, token]);

  const { withdrawHandler, currentDeposit } = useWithdraw({
    token: token,
    contractAddress: contractAddress,
  });
  const { revokeHandler: rHandler, currentAllowance: revokeAllowance } = useRevoke({
    token: token,
    contractAddress: contractAddress,
  });

  const currentAllowance =
    standard === Standard.ERC20 ? revokeAllowance || BigInt(0) : currentDeposit;

  const revokeHandler = standard === Standard.ERC20 ? rHandler : withdrawHandler;

  const [isError, setIsError] = useState(false);
  const updateValue = (value: string) => {
    setLocalValue(value);
    const valueBigInt = token ? parseUnits(value, token.decimals) : undefined;
    setIsError(!(!valueBigInt || valueBigInt <= currentAllowance));
  };

  const { gasPriceOption, gasPriceSettings, setGasPriceOption, setGasPriceSettings } =
    useRevokeGasPriceStore();
  const { estimatedGas, customGasLimit, setEstimatedGas, setCustomGasLimit } =
    useRevokeGasLimitStore();

  const {
    estimatedGas: wEstimatedGas,
    customGasLimit: wCustomGasLimit,
    setEstimatedGas: wSetEstimatedGas,
    setCustomGasLimit: wSetCustomGasLimit,
  } = useWithdrawGasLimitStore();

  const { isAdvanced, setIsAdvanced } = useRevokeGasModeStore();

  const gasPrice: bigint | undefined = useRevokeGasPrice();

  const chainId = useCurrentChainId();
  useRevokeEstimatedGas({
    token: token,
    contractAddress: NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId as DexChainId],
  });
  useWithdrawEstimatedGas({
    token: token,
    contractAddress: NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId as DexChainId],
  });

  const inputDisabled = [
    AllowanceStatus.LOADING,
    AllowanceStatus.PENDING,
    AllowanceStatus.SUCCESS,
  ].includes(status);

  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      {token && (
        <DrawerDialog isOpen={isOpen} setIsOpen={setIsOpen}>
          <DialogHeader
            onClose={() => setIsOpen(false)}
            title={standard === Standard.ERC20 ? t("revoke") : t("withdraw")}
          />
          <div className="w-full md:w-[570px] card-spacing gap-1">
            <div className="flex justify-between items-center">
              <div className="flex gap-2 py-2 items-center text-secondary-text">
                {standard === Standard.ERC20 ? (
                  <span>{`${t("approve")} 0 ${token.symbol}`}</span>
                ) : (
                  <span>{`${t("withdraw")} ${token.symbol}`}</span>
                )}

                <Badge color="green" text={standard} className="text-nowrap mr-auto" />
              </div>
              <div className="flex items-center gap-2 justify-end ml-2 ">
                {status === AllowanceStatus.PENDING && (
                  <>
                    <Preloader type="linear" />
                    <span className="text-secondary-text text-nowrap text-14">
                      {t("status_pending")}
                    </span>
                  </>
                )}
                {status === AllowanceStatus.LOADING && <Preloader size={20} />}
                {(currentAllowance === BigInt(0) || status === AllowanceStatus.SUCCESS) && (
                  <Svg className="text-green" iconName="done" size={20} />
                )}
              </div>
            </div>

            {standard === "ERC-20" ? (
              <div className="mt-2">
                <Alert type="info" text={<span>Info text</span>} />
              </div>
            ) : (
              <>
                <div
                  className={clsxMerge(
                    "flex justify-between bg-secondary-bg px-5 py-3 rounded-3 mt-2 border ",
                    inputDisabled
                      ? "border border-secondary-border bg-primary-bg"
                      : "hocus:shadow hocus:shadow-green/60 border-transparent",
                    isFocused ? "border border-green shadow shadow-green/60" : "",
                    isError
                      ? "border border-red-light peer-hocus:border-red-light peer-hocus:shadow-red/60"
                      : "",
                  )}
                >
                  <NumericFormat
                    allowedDecimalSeparators={[","]}
                    decimalScale={token.decimals}
                    inputMode="decimal"
                    placeholder="0.0"
                    className={clsx(
                      "bg-transparent text-primary-text outline-0 border-0 w-full peer ",
                    )}
                    type="text"
                    disabled={inputDisabled}
                    value={
                      typeof localValue === "undefined"
                        ? formatUnits(currentAllowance || BigInt(0), token.decimals)
                        : localValue
                    }
                    onValueChange={(values) => {
                      updateValue(values.value);
                    }}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    allowNegative={false}
                  />
                  <span className="text-tertiary-text min-w-max">
                    {t("amount", { symbol: token.symbol })}
                  </span>
                </div>
                {isError ? (
                  <span className="text-12 mt-2 text-red-light">
                    {t("must_be_value", {
                      val: `${formatUnits(currentAllowance, token.decimals)} ${token.symbol}`,
                    })}
                  </span>
                ) : null}
              </>
            )}

            <div className="mt-3">
              <RemoveLiquidityGasSettings
                gasPriceOption={gasPriceOption}
                gasPriceSettings={gasPriceSettings}
                setGasPriceOption={setGasPriceOption}
                setGasPriceSettings={setGasPriceSettings}
                estimatedGas={standard === Standard.ERC20 ? estimatedGas : wEstimatedGas}
                customGasLimit={standard === Standard.ERC20 ? customGasLimit : wCustomGasLimit}
                setEstimatedGas={standard === Standard.ERC20 ? setEstimatedGas : wSetEstimatedGas}
                setCustomGasLimit={
                  standard === Standard.ERC20 ? setCustomGasLimit : wSetCustomGasLimit
                }
                isAdvanced={isAdvanced}
                setIsAdvanced={setIsAdvanced}
                gasPrice={gasPrice}
              />
            </div>

            <div className="mb-4 mt-4">
              {isError ? (
                <Button fullWidth disabled>
                  <span className="flex items-center gap-2">Enter correct values</span>
                </Button>
              ) : [AllowanceStatus.INITIAL].includes(status) ? (
                <Button
                  onClick={() => {
                    revokeHandler(localValueBigInt).then();
                  }}
                  fullWidth
                >
                  {standard === Standard.ERC20 ? t("revoke") : t("withdraw")}
                </Button>
              ) : AllowanceStatus.PENDING === status ? (
                <Button fullWidth disabled>
                  <span className="flex items-center gap-2">
                    <Preloader size={20} color="green" type="linear" />
                  </span>
                </Button>
              ) : AllowanceStatus.LOADING === status ? (
                <Button fullWidth isLoading={true}>
                  {standard === Standard.ERC20 ? t("revoke") : t("withdraw")}
                  <span className="flex items-center gap-2">
                    <Preloader size={20} color="black" />
                  </span>
                </Button>
              ) : [AllowanceStatus.SUCCESS].includes(status) ? (
                <Button onClick={() => setIsOpen(false)} fullWidth>
                  {t("close")}
                </Button>
              ) : null}
            </div>
          </div>
        </DrawerDialog>
      )}
    </div>
  );
};
