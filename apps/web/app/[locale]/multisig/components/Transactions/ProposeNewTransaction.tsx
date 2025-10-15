import TextField, { InputLabel } from "@/components/atoms/TextField";
import GasSettingsBlock from "@/components/common/GasSettingsBlock";
import Button, { ButtonVariant } from "@/components/buttons/Button";
import { Formik } from "formik";
import * as Yup from "yup";
import TextAreaField from "@/components/atoms/TextAreaField";
import { useAccount, usePublicClient } from "wagmi";
import { useConnectWalletDialogStateStore } from "@/components/dialogs/stores/useConnectWalletStore";
import useMultisigContract from "../../hooks/useMultisigContract";
import { parseUnits, encodeFunctionData } from "viem";
import { useCallback, useState, useEffect, useRef, useMemo } from "react";
import { useTransactionSendDialogStore } from "@/stores/useTransactionSendDialogStore";
import { Currency } from "@/sdk_bi/entities/currency";
import SelectButton from "@/components/atoms/SelectButton";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useTokens } from "@/hooks/useTokenLists";
import SelectOption from "@/components/atoms/SelectOption";
import Popover from "@/components/atoms/Popover";
import { MULTISIG_ABI } from "@/config/abis/Multisig";
import type { FormikProps } from "formik";
import MSigTransactionDialog from "@/components/dialogs/MSigTransactionDialog";
import NetworkFeeConfigDialog from "@/components/dialogs/NetworkFeeConfigDialog";
import Preloader from "@repo/ui/preloader";
import { GasFeeBlock } from "../shared";
import { formatEther, formatGwei } from "viem";
import { formatFloat } from "@/functions/formatFloat";
import { GasOption } from "@/stores/factories/createGasPriceStore";
import { GasFeeModel } from "@/stores/useRecentTransactionsStore";
import { useGlobalFees } from "@/shared/hooks/useGlobalFees";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { useMultisigGasModeStore, useMultisigGasLimitStore, useMultisigGasPriceStore } from "../stores/useMultisigGasSettingsStore";


const initialValues = {
    asset: "",
    amount: "",
    sendTo: "",
    data: "",
};

const schema = Yup.object({
    asset: Yup.string().required("Asset is required"),
    amount: Yup.string()
        .required("Amount is required")
        .test("is-positive", "Amount must be positive", (value) => {
            if (!value) return false;
            const num = parseFloat(value);
            return !isNaN(num) && num > 0;
        }),
    sendTo: Yup.string()
        .required("Send to is required")
        .matches(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
    data: Yup.string(),
});

export default function ProposeNewTransaction() {
    const { isConnected } = useAccount();
    const publicClient = usePublicClient();
    const { setIsOpened: setWalletConnectOpened } = useConnectWalletDialogStateStore();
    const [isOpenedAssetSelect, setIsOpenedAssetSelect] = useState(false);
    const { proposeTransaction, generateTransactionData, getConfig, sendingTransaction, fetchEstimatedDeadline, estimatedDeadline, estimatedDeadlineLoading } = useMultisigContract();
    const [loading, setLoading] = useState(false);
    const tokens = useTokens();
    const [selectedToken, setSelectedToken] = useState<Currency | null>(null);
    const [proposeData, setProposeData] = useState<string>("");
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [isOpenedFee, setIsOpenedFee] = useState(false);
    const formikRef = useRef<FormikProps<typeof initialValues> | null>(null);
    const t = useTranslations("Swap");

    const {
        isOpen: isTransactionDialogOpen,
        status: transactionStatus,
        transactionId: dialogTransactionId,
        transactionHash,
        explorerUrl,
        closeDialog,
        canClose,
    } = useTransactionSendDialogStore();

    const {
        gasPriceOption,
        gasPriceSettings,
        setGasPriceOption,
        setGasPriceSettings,
        updateDefaultState,
    } = useMultisigGasPriceStore();
    const { estimatedGas, customGasLimit, setEstimatedGas, setCustomGasLimit } =
        useMultisigGasLimitStore();
    const { isAdvanced, setIsAdvanced } = useMultisigGasModeStore();
    const { baseFee, priorityFee, gasPrice } = useGlobalFees();
    const chainId = useCurrentChainId();

    useEffect(() => {
        updateDefaultState(chainId);
      }, [chainId, updateDefaultState]);

      const computedGasSpending = useMemo(() => {
        if (gasPriceSettings.model === GasFeeModel.LEGACY && gasPriceSettings.gasPrice) {
          return formatFloat(formatGwei(gasPriceSettings.gasPrice));
        }
    
        if (gasPriceSettings.model === GasFeeModel.LEGACY && gasPrice) {
          return formatFloat(formatGwei(gasPrice));
        }
    
        if (
          gasPriceSettings.model === GasFeeModel.EIP1559 &&
          gasPriceSettings.maxFeePerGas &&
          gasPriceSettings.maxPriorityFeePerGas &&
          baseFee &&
          gasPriceOption === GasOption.CUSTOM
        ) {
          const lowerFeePerGas =
            gasPriceSettings.maxFeePerGas > baseFee ? baseFee : gasPriceSettings.maxFeePerGas;
    
          return formatFloat(formatGwei(lowerFeePerGas + gasPriceSettings.maxPriorityFeePerGas));
        }
    
        if (
          gasPriceSettings.model === GasFeeModel.EIP1559 &&
          baseFee &&
          priorityFee &&
          gasPriceOption !== GasOption.CUSTOM
        ) {
          return formatFloat(formatGwei(baseFee + priorityFee));
        }
    
        return undefined;
      }, [baseFee, gasPrice, gasPriceOption, gasPriceSettings, priorityFee]);
    
      const computedGasSpendingETH = useMemo(() => {
        if (gasPriceSettings.model === GasFeeModel.LEGACY && gasPriceSettings.gasPrice) {
          return formatFloat(formatEther(gasPriceSettings.gasPrice * estimatedGas));
        }
    
        if (
          gasPriceSettings.model === GasFeeModel.EIP1559 &&
          gasPriceSettings.maxFeePerGas &&
          gasPriceSettings.maxPriorityFeePerGas &&
          baseFee &&
          gasPriceOption === GasOption.CUSTOM
        ) {
          const lowerFeePerGas =
            gasPriceSettings.maxFeePerGas > baseFee ? baseFee : gasPriceSettings.maxFeePerGas;
    
          return formatFloat(
            formatEther((lowerFeePerGas + gasPriceSettings.maxPriorityFeePerGas) * estimatedGas),
          );
        }
    
        if (
          gasPriceSettings.model === GasFeeModel.EIP1559 &&
          baseFee &&
          priorityFee &&
          gasPriceOption !== GasOption.CUSTOM
        ) {
          return formatFloat(formatEther((baseFee + priorityFee) * estimatedGas));
        }
    
        return undefined;
      }, [baseFee, estimatedGas, gasPriceOption, gasPriceSettings, priorityFee]);

    const getTokenBySymbol = useCallback((symbol: string) => {
        return tokens.find(token => token.symbol === symbol) || null;
    }, [tokens]);

    const generateTransactionDataForForm = (values: typeof initialValues): string => {
        const token = getTokenBySymbol(values.asset);
        if (!token || !values.amount || !values.sendTo) return "";

        try {
            const amount = parseUnits(values.amount, token.decimals);

            if (token.isNative) {
                return "0x";
            } else {
                return encodeFunctionData({
                    abi: MULTISIG_ABI,
                    functionName: "transfer",
                    args: [values.sendTo as `0x${string}`, amount],
                });
            }
        } catch (error) {
            return "";
        }
    };

    const generateProposeData = useCallback((values: typeof initialValues): string => {
        const token = getTokenBySymbol(values.asset);
        if (!token || !values.amount || !values.sendTo) return "";

        try {
            const amount = parseUnits(values.amount, token.decimals);
            const to = values.sendTo as `0x${string}`;
            const data = values.data || generateTransactionDataForForm(values);

            return generateTransactionData("proposeTx", [to, amount, data as `0x${string}`]);
        } catch (error) {
            return "";
        }
    }, [getTokenBySymbol, generateTransactionDataForForm, generateTransactionData]);

    const handleSubmit = async (values: typeof initialValues) => {
        if (!schema.isValidSync(values)) {
            return;
        }
        setHasSubmitted(true);

        if (!isConnected) {
            setWalletConnectOpened(true);
            return;
        }
        setLoading(true);

        try {
            const token = getTokenBySymbol(values.asset);
            if (!token) {
                return;
            }

            const amount = parseUnits(values.amount, token.decimals);
            const to = values.sendTo as `0x${string}`;
            const data = (values.data || generateTransactionDataForForm(values)) as `0x${string}`;
            await proposeTransaction(to, amount, data);
        } catch (error) {
            console.error("Error proposing transaction:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEstimatedDeadline();
    }, [fetchEstimatedDeadline]);

    useEffect(() => {
        if ((transactionStatus === "confirming" || transactionStatus === "success" || transactionStatus === "failed") && isTransactionDialogOpen) {
            setSelectedToken(null);
            setProposeData("");
            setHasSubmitted(false);
            formikRef.current?.resetForm();
            fetchEstimatedDeadline();
        }
    }, [transactionStatus, isTransactionDialogOpen, fetchEstimatedDeadline]);


    return (
        <div className="flex flex-col gap-6">
            <Formik
                initialValues={initialValues}
                onSubmit={handleSubmit}
                validationSchema={schema}
            >
                {(props) => {
                    useEffect(() => {
                        const newProposeData = generateProposeData(props.values);
                        if (newProposeData !== proposeData) {
                            setProposeData(newProposeData);
                        }
                    }, [props.values]);

                    return (
                        <>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    props.handleSubmit();
                                }}
                            >
                                <div className="flex flex-col gap-4">
                                    <div>
                                        <InputLabel className="font-bold flex items-center gap-1 text-secondary-text text-16 mb-1" label="Select Asset" tooltipText="Select the asset to transfer" />
                                        <Popover
                                            isOpened={isOpenedAssetSelect}
                                            setIsOpened={setIsOpenedAssetSelect}
                                            placement="bottom-start"
                                            trigger={
                                                <SelectButton
                                                    className="pl-2 pr-1 py-1 xl:py-2 gap-0 md:gap-2 xl:px-3 text-secondary-text w-full h-12 border"
                                                    isOpen={isOpenedAssetSelect}
                                                    onClick={() => setIsOpenedAssetSelect(!isOpenedAssetSelect)}
                                                    withArrow={true}
                                                    fullWidth={true}
                                                >
                                                    {selectedToken ? (
                                                        <span className="flex items-center gap-2 xl:min-w-[110px]">
                                                            {selectedToken.logoURI && (
                                                                <Image
                                                                    src={selectedToken.logoURI}
                                                                    alt={selectedToken.symbol || "Token"}
                                                                    width={24}
                                                                    height={24}
                                                                />
                                                            )}
                                                            <span className="hidden xl:inline">{selectedToken.symbol}</span>
                                                        </span>
                                                    ) : (
                                                        "Select asset"
                                                    )}
                                                </SelectButton>
                                            }
                                        >
                                            <div className="py-1 text-16 bg-primary-bg rounded-2 min-w-[560px] shadow-popover shadow-black/70 overflow-y-auto max-h-[300px]">
                                                <div>
                                                    {tokens.map((token: Currency) => {
                                                        const tokenKey = token.isToken ? token.address0 : token.symbol || 'native';
                                                        const selectedKey = selectedToken ? (selectedToken.isToken ? selectedToken.address0 : selectedToken.symbol || 'native') : null;
                                                        return (
                                                            <SelectOption
                                                                key={tokenKey}
                                                                onClick={() => {
                                                                    setSelectedToken(token);
                                                                    props.setFieldValue("asset", token.symbol || "");
                                                                    setIsOpenedAssetSelect(false);
                                                                }}
                                                                isActive={selectedKey === tokenKey}
                                                            >
                                                                {token.logoURI && (
                                                                    <Image
                                                                        src={token.logoURI}
                                                                        alt={token.symbol || "Token"}
                                                                        width={24}
                                                                        height={24}
                                                                    />
                                                                )}
                                                                {token.symbol} {token.name && `(${token.name})`}
                                                            </SelectOption>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </Popover>
                                        {hasSubmitted && props.errors.asset && (
                                            <div className="text-red-light text-12 mt-1">{props.errors.asset}</div>
                                        )}
                                    </div>

                                    <TextField
                                        label="Amount"
                                        tooltipText="Enter the amount to transfer"
                                        placeholder="Enter amount"
                                        value={props.values.amount}
                                        error={hasSubmitted && props.errors.amount ? props.errors.amount : ""}
                                        onChange={(e) => props.setFieldValue("amount", e.target.value)}
                                    />

                                    <TextField
                                        label="Send to"
                                        tooltipText="Enter the recipient wallet address"
                                        placeholder="Enter wallet address"
                                        value={props.values.sendTo}
                                        error={hasSubmitted && props.errors.sendTo ? props.errors.sendTo : ""}
                                        onChange={(e) => props.setFieldValue("sendTo", e.target.value)}
                                    />
                                    <div className="relative">
                                        {estimatedDeadlineLoading ? <Preloader className="absolute right-2 top-0" size={24} type="linear" /> : null}
                                        <TextField
                                            label="Deadline"
                                            tooltipText="Set transaction deadline"
                                            placeholder="DD.MM.YYYY HH:MM:ss aa"
                                            value={estimatedDeadline}
                                            readOnly={true}
                                        />

                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <h3 className="text-18 font-bold text-primary-text">Data</h3>
                                        <div className="bg-tertiary-bg px-5 py-4 h-[150px] flex justify-between items-center rounded-3 flex-col xs:flex-row overflow-y-auto">
                                            <div className="flex flex-col text-tertiary-text break-all whitespace-pre-wrap h-full">
                                                {generateProposeData(props.values) || "Data will be displayed here"}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <GasFeeBlock
                            computedGasSpending={computedGasSpending}
                            computedGasSpendingETH={computedGasSpendingETH}
                            gasPriceOption={gasPriceOption}
                            onEditClick={() => setIsOpenedFee(true)}
                        />

                                {!isConnected ? (
                                    <Button
                                        type="button"
                                        variant={ButtonVariant.CONTAINED}
                                        fullWidth
                                        onClick={() => setWalletConnectOpened(true)}
                                    >
                                        Connect wallet
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        variant={ButtonVariant.CONTAINED}
                                        fullWidth
                                        disabled={loading || (hasSubmitted && Object.keys(props.errors).length > 0)}
                                        onClick={async () => {
                                            setHasSubmitted(true);
                                            const errors = await props.validateForm();
                                        
                                            if (Object.keys(errors).length > 0) {
                                              return;
                                            }
                                        
                                            props.handleSubmit();
                                          }}
                                    >
                                        {loading || sendingTransaction ? "Proposing..." : "Propose Transaction"}
                                    </Button>
                                )}
                            </form>
                        </>
                    );
                }}
            </Formik>

            <MSigTransactionDialog
                isOpen={isTransactionDialogOpen}
                setIsOpen={closeDialog}
                status={transactionStatus}
                transactionId={dialogTransactionId}
                transactionHash={transactionHash}
                explorerUrl={explorerUrl}
                canClose={canClose}
            />

            <NetworkFeeConfigDialog
                isAdvanced={isAdvanced}
                setIsAdvanced={setIsAdvanced}
                estimatedGas={estimatedGas}
                setEstimatedGas={setEstimatedGas}
                gasPriceSettings={gasPriceSettings}
                gasPriceOption={gasPriceOption}
                customGasLimit={customGasLimit}
                setCustomGasLimit={setCustomGasLimit}
                setGasPriceOption={setGasPriceOption}
                setGasPriceSettings={setGasPriceSettings}
                isOpen={isOpenedFee}
                setIsOpen={setIsOpenedFee}
            />
        </div>
    );
}