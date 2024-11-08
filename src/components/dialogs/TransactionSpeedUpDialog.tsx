import clsx from "clsx";
import { useFormik } from "formik";
import React, { ChangeEvent, FocusEvent, ReactNode, useCallback, useMemo, useState } from "react";
import { formatGwei, parseGwei } from "viem";
import { useAccount, useWalletClient } from "wagmi";

import Alert from "@/components/atoms/Alert";
import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import Svg from "@/components/atoms/Svg";
import TextField from "@/components/atoms/TextField";
import Tooltip from "@/components/atoms/Tooltip";
import Button from "@/components/buttons/Button";
import RecentTransaction from "@/components/common/RecentTransaction";
import { useTransactionSpeedUpDialogStore } from "@/components/dialogs/stores/useTransactionSpeedUpDialogStore";
import { baseFeeMultipliers, SCALING_FACTOR } from "@/config/constants/baseFeeMultipliers";
import { formatFloat } from "@/functions/formatFloat";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { useFees } from "@/hooks/useFees";
import { GasOption } from "@/stores/factories/createGasPriceStore";
import {
  GasFeeModel,
  stringifyObject,
  useRecentTransactionsStore,
} from "@/stores/useRecentTransactionsStore";

function EIP1559Fields({
  maxFeePerGas,
  maxPriorityFeePerGas,
  handleChange,
  handleBlur,
  currentMaxFeePerGas,
  setMaxFeePerGasValue,
  setMaxPriorityFeePerGasValue,
  currentMaxPriorityFeePerGas,
  maxPriorityFeePerGasError,
  maxPriorityFeePerGasWarning,
  maxFeePerGasError,
  maxFeePerGasWarning,
}: {
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  setMaxFeePerGasValue: (value: string) => void;
  setMaxPriorityFeePerGasValue: (value: string) => void;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: FocusEvent<HTMLInputElement>) => void;
  currentMaxFeePerGas: bigint | undefined;
  currentMaxPriorityFeePerGas: bigint | undefined;
  maxPriorityFeePerGasError: boolean;
  maxPriorityFeePerGasWarning: boolean;
  maxFeePerGasError: boolean;
  maxFeePerGasWarning: boolean;
}) {
  return (
    <div className="grid gap-3 grid-cols-2">
      <TextField
        isNumeric
        isError={maxFeePerGasError}
        isWarning={maxFeePerGasWarning}
        placeholder="Max fee"
        label="Max fee"
        name="maxFeePerGas"
        id="maxFeePerGas"
        tooltipText="Max fee tooltip"
        value={maxFeePerGas}
        onChange={(e) => {
          handleChange(e);
        }}
        onBlur={(e) => {
          handleBlur(e);
        }}
        helperText={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (currentMaxFeePerGas) {
                  setMaxFeePerGasValue(formatGwei(currentMaxFeePerGas));
                }

                // setUnsavedMaxFeePerGas( || BigInt(0));
              }}
              className="text-green"
            >
              Min. required
            </button>{" "}
            {currentMaxFeePerGas ? formatFloat(formatGwei(currentMaxFeePerGas)) : "0"} Gwei
          </div>
        }
      />

      <TextField
        isNumeric
        isError={maxPriorityFeePerGasError}
        isWarning={maxPriorityFeePerGasWarning}
        placeholder="Priority fee"
        label="Priority fee"
        name="maxPriorityFeePerGas"
        id="maxPriorityFeePerGas"
        tooltipText="Max priority tooltip"
        value={maxPriorityFeePerGas}
        onChange={(e) => {
          handleChange(e);
        }}
        onBlur={(e) => {
          handleBlur(e);
        }}
        helperText={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (currentMaxPriorityFeePerGas) {
                  setMaxPriorityFeePerGasValue(formatGwei(currentMaxPriorityFeePerGas));
                }
              }}
              className="text-green"
            >
              Min. required
            </button>{" "}
            {currentMaxPriorityFeePerGas
              ? formatFloat(formatGwei(currentMaxPriorityFeePerGas))
              : "0"}{" "}
            Gwei
          </div>
        }
      />
    </div>
  );
}

function ErrorsAndWarnings({ errors, warnings }: { errors?: string[]; warnings?: string[] }) {
  return (
    <>
      {(!!errors?.length || !!warnings?.length) && (
        <div className="flex flex-col gap-5 mt-4">
          {errors?.map((err) => <Alert key={err} text={err} type="error" />)}
          {warnings?.map((war) => <Alert key={war} text={war} type="warning" />)}
        </div>
      )}
    </>
  );
}
export enum SpeedUpOption {
  AUTO_INCREASE,
  CHEAP,
  FAST,
  CUSTOM,
}

const speedUpOptionTitle: Record<SpeedUpOption, string> = {
  [SpeedUpOption.AUTO_INCREASE]: "+10% increase",
  [SpeedUpOption.CHEAP]: "Cheaper",
  [SpeedUpOption.FAST]: "Faster",
  [SpeedUpOption.CUSTOM]: "Custom",
};

const speedUpOptionIcon: Record<SpeedUpOption, ReactNode> = {
  [SpeedUpOption.AUTO_INCREASE]: <Svg iconName="auto-increase" />,
  [SpeedUpOption.CHEAP]: <Svg iconName="cheap-gas" />,
  [SpeedUpOption.FAST]: <Svg iconName="fast-gas" />,
  [SpeedUpOption.CUSTOM]: <Svg iconName="custom-gas" />,
};

const speedUpOptions = [
  SpeedUpOption.AUTO_INCREASE,
  SpeedUpOption.CHEAP,
  SpeedUpOption.FAST,
  SpeedUpOption.CUSTOM,
];

type ConvertableSpeedUpOption = Exclude<
  SpeedUpOption,
  SpeedUpOption.AUTO_INCREASE | SpeedUpOption.CUSTOM
>;
type GasOptionWithoutCustom = Exclude<GasOption, GasOption.CUSTOM>;

const gasPriceOptionMap: Record<ConvertableSpeedUpOption, GasOptionWithoutCustom> = {
  [SpeedUpOption.CHEAP]: GasOption.CHEAP,
  [SpeedUpOption.FAST]: GasOption.FAST,
};
export default function TransactionSpeedUpDialog() {
  const { transaction, isOpen, handleClose } = useTransactionSpeedUpDialogStore();
  const chainId = useCurrentChainId();
  const [speedUpOption, setSpeedUpOption] = useState<SpeedUpOption>(SpeedUpOption.AUTO_INCREASE);
  const {
    transactions,
    updateTransactionStatus,
    updateTransactionGasSettings,
    updateTransactionHash,
  } = useRecentTransactionsStore();
  console.log(transaction);
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const { priorityFee, baseFee, gasPrice } = useFees();

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      maxFeePerGas:
        transaction?.gas.model === GasFeeModel.EIP1559 && transaction.gas.maxFeePerGas
          ? formatGwei((BigInt(transaction.gas.maxFeePerGas) * BigInt(110)) / SCALING_FACTOR)
          : "",
      maxPriorityFeePerGas:
        transaction?.gas.model === GasFeeModel.EIP1559 && transaction.gas.maxPriorityFeePerGas
          ? formatGwei(
              (BigInt(transaction.gas.maxPriorityFeePerGas) * BigInt(110)) / SCALING_FACTOR,
            )
          : "",
      gasPrice:
        transaction?.gas.model === GasFeeModel.LEGACY && transaction.gas.gasPrice
          ? formatGwei((BigInt(transaction.gas.gasPrice) * BigInt(110)) / SCALING_FACTOR)
          : "",
      speedUpOption,
    },
    onSubmit: (values, formikHelpers) => {},
  });

  const { handleChange, handleBlur, touched, values, setFieldValue, handleSubmit, handleReset } =
    formik;

  const handleSpeedUp = useCallback(async () => {
    if (!transaction?.params || !walletClient || !address) {
      return;
    }

    let gasPriceFormatted = {};

    console.log(speedUpOption);
    console.log(values);

    if (
      values.speedUpOption !== SpeedUpOption.CUSTOM &&
      values.speedUpOption !== SpeedUpOption.AUTO_INCREASE
    ) {
      const _option = gasPriceOptionMap[values.speedUpOption];

      const multiplier = baseFeeMultipliers[chainId][_option];
      switch (transaction.gas.model) {
        case GasFeeModel.EIP1559:
          if (priorityFee && baseFee) {
            gasPriceFormatted = {
              maxPriorityFeePerGas: (priorityFee * multiplier) / SCALING_FACTOR,
              maxFeePerGas: (baseFee * multiplier) / SCALING_FACTOR,
            };
          }
          break;

        case GasFeeModel.LEGACY:
          if (gasPrice) {
            gasPriceFormatted = {
              gasPrice: (gasPrice * multiplier) / SCALING_FACTOR,
            };
          }
          break;
      }
    } else {
      if (values.speedUpOption === SpeedUpOption.AUTO_INCREASE) {
        switch (transaction.gas.model) {
          case GasFeeModel.EIP1559:
            if (transaction.gas.maxPriorityFeePerGas && transaction.gas.maxFeePerGas) {
              gasPriceFormatted = {
                maxPriorityFeePerGas:
                  (BigInt(transaction.gas.maxPriorityFeePerGas) * BigInt(110)) / SCALING_FACTOR,
                maxFeePerGas: (BigInt(transaction.gas.maxFeePerGas) * BigInt(110)) / SCALING_FACTOR,
              };
            }
            break;

          case GasFeeModel.LEGACY:
            if (transaction.gas.gasPrice) {
              gasPriceFormatted = {
                gasPrice: (BigInt(transaction.gas.gasPrice) * BigInt(110)) / SCALING_FACTOR,
              };
            }
            break;
        }
      }

      if (values.speedUpOption === SpeedUpOption.CUSTOM) {
        switch (transaction.gas.model) {
          case GasFeeModel.EIP1559:
            if (values.maxPriorityFeePerGas && values.maxFeePerGas) {
              gasPriceFormatted = {
                maxPriorityFeePerGas: parseGwei(values.maxPriorityFeePerGas),
                maxFeePerGas: parseGwei(values.maxFeePerGas),
              };
            }
            break;

          case GasFeeModel.LEGACY:
            if (transaction.gas.gasPrice) {
              gasPriceFormatted = {
                gasPrice: parseGwei(values.gasPrice),
              };
            }
            break;
        }
      }
    }

    console.log(transaction);
    console.log(gasPriceFormatted);

    console.log({
      nonce: transaction.nonce,
      ...gasPriceFormatted,
      ...transaction.params,
    });

    try {
      const hash = await walletClient.writeContract({
        nonce: transaction.nonce,
        ...gasPriceFormatted,
        ...transaction.params,
      });
      updateTransactionHash(transaction.id, hash, address);
      updateTransactionGasSettings(
        transaction.id,
        { model: transaction.gas.model, ...stringifyObject(gasPriceFormatted) },
        address,
      );
    } catch (e) {
      console.log(e);
    }
  }, [
    values,
    address,
    baseFee,
    chainId,
    gasPrice,
    priorityFee,
    speedUpOption,
    transaction,
    updateTransactionGasSettings,
    updateTransactionHash,
    values.gasPrice,
    values.maxFeePerGas,
    values.maxPriorityFeePerGas,
    walletClient,
  ]);

  const maxFeePerGasError = useMemo(() => {
    return transaction?.gas.model === GasFeeModel.EIP1559 &&
      transaction.gas.maxFeePerGas &&
      parseGwei(values.maxFeePerGas) <
        (BigInt(transaction.gas.maxFeePerGas) * BigInt(110)) / SCALING_FACTOR
      ? "You have to set at least +10% value to apply transaction speed up."
      : undefined;
  }, [transaction, values.maxFeePerGas]);

  const legacyGasPriceError = useMemo(() => {
    return gasPrice && parseGwei(values.gasPrice) < gasPrice
      ? "Gas price is too low for current network condition"
      : undefined;
  }, [gasPrice, values.gasPrice]);

  const legacyGasPriceWarning = useMemo(() => {
    return gasPrice && parseGwei(values.gasPrice) > gasPrice * BigInt(3)
      ? "Gas price is unnecessarily high for current network condition"
      : undefined;
  }, [gasPrice, values.gasPrice]);

  const maxFeePerGasWarning = useMemo(() => {
    return baseFee && parseGwei(values.maxFeePerGas) > baseFee * BigInt(3)
      ? "Max fee per gas is unnecessarily high for current network condition"
      : undefined;
  }, [baseFee, values.maxFeePerGas]);

  const maxPriorityFeePerGasError = useMemo(() => {
    return transaction?.gas.model === GasFeeModel.EIP1559 &&
      transaction.gas.maxPriorityFeePerGas &&
      parseGwei(values.maxPriorityFeePerGas) <
        (BigInt(transaction.gas.maxPriorityFeePerGas) * BigInt(110)) / SCALING_FACTOR
      ? "You have to set at least +10% value to apply transaction speed up."
      : undefined;
  }, [transaction, values.maxPriorityFeePerGas]);

  const maxPriorityFeePerGasWarning = useMemo(() => {
    return priorityFee && parseGwei(values.maxPriorityFeePerGas) > priorityFee * BigInt(3)
      ? "Max priority fee per gas is unnecessarily high for current network condition"
      : undefined;
  }, [priorityFee, values.maxPriorityFeePerGas]);

  const gasPriceErrors = useMemo(() => {
    const _errors: string[] = [];

    [maxPriorityFeePerGasError, maxFeePerGasError].forEach((v) => {
      if (v) {
        _errors.push(v);
      }
    });

    return _errors;
  }, [maxFeePerGasError, maxPriorityFeePerGasError]);

  const legacyGasPriceErrors = useMemo(() => {
    const _errors: string[] = [];

    [legacyGasPriceError].forEach((v) => {
      if (v) {
        _errors.push(v);
      }
    });

    return _errors;
  }, [legacyGasPriceError]);

  const gasPriceWarnings = useMemo(() => {
    const _warnings: string[] = [];

    [maxPriorityFeePerGasWarning, maxFeePerGasWarning].forEach((v) => {
      if (v) {
        _warnings.push(v);
      }
    });

    return _warnings;
  }, [maxFeePerGasWarning, maxPriorityFeePerGasWarning]);

  const legacyGasPriceWarnings = useMemo(() => {
    const _warnings: string[] = [];

    [legacyGasPriceWarning].forEach((v) => {
      if (v) {
        _warnings.push(v);
      }
    });

    return _warnings;
  }, [legacyGasPriceWarning]);

  const autoIncreaseGwei = useMemo(() => {
    if (transaction?.gas.model === GasFeeModel.EIP1559 && transaction.gas.maxFeePerGas) {
      return formatFloat(
        formatGwei((BigInt(transaction.gas.maxFeePerGas) * BigInt(110)) / SCALING_FACTOR),
      );
    }

    if (transaction?.gas.model === GasFeeModel.LEGACY && transaction.gas.gasPrice) {
      return formatFloat(
        formatGwei((BigInt(transaction.gas.gasPrice) * BigInt(110)) / SCALING_FACTOR),
      );
    }

    return "0";
  }, [transaction?.gas]);

  if (!transaction) {
    return null;
  }

  return (
    <DrawerDialog isOpen={isOpen} setIsOpen={handleClose}>
      <div className="w-full md:w-[600px]">
        <DialogHeader onClose={handleClose} title="Speed up" />
        <div className="px-4 pb-4 md:px-10 md:pb-10">
          <RecentTransaction view={"transparent"} transaction={transaction} showSpeedUp={false} />
          <form onSubmit={handleSpeedUp}>
            <div className="flex flex-col gap-2 mt-5">
              {speedUpOptions.map((_speedUpOption) => {
                return (
                  <div
                    onClick={() => setFieldValue("speedUpOption", _speedUpOption)}
                    key={_speedUpOption}
                    className={clsx(
                      "w-full rounded-3 bg-tertiary-bg group cursor-pointer",
                      values.speedUpOption === _speedUpOption && "cursor-auto",
                    )}
                  >
                    <div
                      className={clsx(
                        "flex justify-between px-5 items-center min-h-12 duration-200",
                        SpeedUpOption.CUSTOM === _speedUpOption &&
                          "border-primary-bg rounded-t-3 border-b",
                        SpeedUpOption.CUSTOM !== _speedUpOption && "border-primary-bg rounded-3 ",
                        values.speedUpOption !== _speedUpOption && "group-hocus:bg-green-bg",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={clsx(
                            "w-4 h-4 duration-200 before:duration-200 border bg-secondary-bg rounded-full before:w-2.5 before:h-2.5 before:absolute before:top-1/2 before:rounded-full before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 relative",
                            values.speedUpOption === _speedUpOption
                              ? "border-green before:bg-green"
                              : "border-secondary-border group-hocus:border-green",
                          )}
                        />
                        {speedUpOptionTitle[_speedUpOption]}
                        {speedUpOptionIcon[_speedUpOption]}
                        <span className="text-secondary-text">
                          <Tooltip iconSize={20} text="Tooltip text" />
                        </span>
                        <span className="text-secondary-text">~0.00$</span>
                      </div>
                      <span
                        className={clsx(
                          values.speedUpOption === _speedUpOption
                            ? "text-primary-text"
                            : "text-tertiary-text group-hocus:text-primary-text",
                          "duration-200",
                        )}
                      >
                        {_speedUpOption !== SpeedUpOption.CUSTOM &&
                          _speedUpOption !== SpeedUpOption.AUTO_INCREASE &&
                          baseFee &&
                          `${formatFloat(
                            formatGwei(
                              (baseFee *
                                baseFeeMultipliers[chainId][gasPriceOptionMap[_speedUpOption]]) /
                                SCALING_FACTOR,
                            ),
                          )} GWEI`}
                        {_speedUpOption === SpeedUpOption.CUSTOM &&
                          `${transaction.gas.model === GasFeeModel.LEGACY ? formatFloat(values.gasPrice) : formatFloat(values.maxFeePerGas)} GWEI`}
                        {_speedUpOption === SpeedUpOption.AUTO_INCREASE &&
                          `${autoIncreaseGwei} GWEI`}
                      </span>
                    </div>

                    {_speedUpOption === SpeedUpOption.CUSTOM && (
                      <div
                        className={clsx(
                          "pt-1",
                          values.speedUpOption !== SpeedUpOption.CUSTOM &&
                            "opacity-30 pointer-events-none",
                        )}
                      >
                        {transaction.gas.model === GasFeeModel.EIP1559 && (
                          <div className={clsx("px-5 pb-4")}>
                            <EIP1559Fields
                              maxPriorityFeePerGas={values.maxPriorityFeePerGas}
                              maxFeePerGas={values.maxFeePerGas}
                              setMaxFeePerGasValue={(value) => setFieldValue("maxFeePerGas", value)}
                              setMaxPriorityFeePerGasValue={(value) =>
                                setFieldValue("maxPriorityFeePerGas", value)
                              }
                              currentMaxFeePerGas={
                                (BigInt(transaction?.gas.maxFeePerGas || 0) * BigInt(110)) /
                                SCALING_FACTOR
                              }
                              currentMaxPriorityFeePerGas={
                                (BigInt(transaction?.gas.maxPriorityFeePerGas || 0) * BigInt(110)) /
                                SCALING_FACTOR
                              }
                              handleChange={handleChange}
                              handleBlur={handleBlur}
                              maxFeePerGasError={!!maxFeePerGasError}
                              maxPriorityFeePerGasError={!!maxPriorityFeePerGasError}
                              maxFeePerGasWarning={!!maxFeePerGasWarning}
                              maxPriorityFeePerGasWarning={!!maxPriorityFeePerGasWarning}
                            />
                            <ErrorsAndWarnings
                              errors={gasPriceErrors}
                              warnings={gasPriceWarnings}
                            />
                          </div>
                        )}

                        {transaction.gas.model === GasFeeModel.LEGACY && (
                          <div className={clsx("px-5 pb-4")}>
                            <TextField
                              isNumeric
                              placeholder="Gas price"
                              label="Gas price"
                              name="gasPrice"
                              id="gasPrice"
                              tooltipText="Gas price tooltip"
                              value={values.gasPrice}
                              onChange={(e) => {
                                handleChange(e);
                              }}
                              onBlur={(e) => {
                                handleBlur(e);
                              }}
                              helperText={
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (transaction?.gas.model === GasFeeModel.LEGACY) {
                                        setFieldValue(
                                          "gasPrice",
                                          formatGwei(BigInt(transaction?.gas.gasPrice || 0)),
                                        );
                                      }
                                    }}
                                    className="text-green"
                                  >
                                    Min. required:
                                  </button>{" "}
                                  {gasPrice
                                    ? formatFloat(
                                        formatGwei(BigInt(transaction?.gas.gasPrice || 0)),
                                      )
                                    : "0"}{" "}
                                  Gwei
                                </div>
                              }
                            />
                            <ErrorsAndWarnings
                              errors={legacyGasPriceErrors}
                              warnings={legacyGasPriceWarnings}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </form>
          <div>{transaction?.nonce}</div>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => handleClose()}>Cancel</Button>
            <Button onClick={handleSpeedUp} fullWidth>
              Speed up
            </Button>
          </div>
        </div>
      </div>
    </DrawerDialog>
  );
}
