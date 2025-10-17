import Checkbox from "@repo/ui/checkbox";
import { Formik } from "formik";
import React, { useMemo, useState } from "react";

import ConfirmCreateTokenDialog from "@/app/[locale]/create-token/components/ConfirmCreateTokenDialog";
import { useCreateTokenDialogStore } from "@/app/[locale]/create-token/hooks/useCreateTokenDialogStore";
import { OrderActionMode, OrderActionStep } from "@/app/[locale]/margin-trading/types";
import TextField from "@/components/atoms/TextField";
import Button from "@/components/buttons/Button";
import GasSettingsBlock from "@/components/common/GasSettingsBlock";

const initialCreateTokenSettings = {
  name: "",
  symbol: "",
  totalSupply: "",
  imageURL: "",
  allowMintForOwner: false,
  createERC20: false,
};

import { useTranslations } from "next-intl";
import { useAccount } from "wagmi";
import * as Yup from "yup";

import { useCreateTokenEstimatedGas } from "@/app/[locale]/create-token/hooks/useCreateToken";
import {
  useCreateTokenGasLimitStore,
  useCreateTokenGasModeStore,
  useCreateTokenGasPriceStore,
} from "@/app/[locale]/create-token/stores/useCreateTokenGasSettingsStore";
import ConnectWalletDialog from "@/components/dialogs/ConnectWalletDialog";
import NetworkFeeConfigDialog from "@/components/dialogs/NetworkFeeConfigDialog";
import { useConnectWalletDialogStateStore } from "@/components/dialogs/stores/useConnectWalletStore";
import { baseFeeMultipliers, SCALING_FACTOR } from "@/config/constants/baseFeeMultipliers";
import { getFormattedGasPrice } from "@/functions/gasSettings";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { useGlobalFees } from "@/shared/hooks/useGlobalFees";
import { GasFeeModel, GasOption } from "@/stores/factories/createGasPriceStore";

const isValidHttpsUrl = (value?: string) => {
  try {
    if (!value) return true; // handled by required on other fields
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
};

const isValidIpfsUrl = (value?: string) => {
  if (!value) return true;
  return /^ipfs:\/\/.+/i.test(value);
};

const createTokenSchema = Yup.object({
  name: Yup.string().trim().required("Please provide token name"),
  symbol: Yup.string().trim().required("Please provide symbol"),
  totalSupply: Yup.string().trim().required("Please provide total supply"),
  imageURL: Yup.string()
    .trim()
    .notRequired()
    .test(
      "ipfs-or-https",
      "Enter a link in the format https:// or ipfs://",
      (val) => !val || isValidIpfsUrl(val) || isValidHttpsUrl(val),
    ),
});

export default function CreateTokenForm() {
  const chainId = useCurrentChainId();
  const { isOpen, setIsOpen } = useCreateTokenDialogStore();
  const [createTokenSettings, setCreateTokenSettings] = useState(initialCreateTokenSettings);
  const { isConnected } = useAccount();

  const tWallet = useTranslations("Wallet");
  const { setIsOpened: setWalletConnectOpened } = useConnectWalletDialogStateStore();

  const {
    gasPriceOption,
    gasPriceSettings,
    setGasPriceOption,
    setGasPriceSettings,
    updateDefaultState,
  } = useCreateTokenGasPriceStore();
  const { estimatedGas, customGasLimit, setEstimatedGas, setCustomGasLimit } =
    useCreateTokenGasLimitStore();
  const { isAdvanced, setIsAdvanced } = useCreateTokenGasModeStore();

  const [isOpenedFee, setIsOpenedFee] = useState(false);
  const { baseFee, gasPrice, priorityFee } = useGlobalFees();

  const formattedGasPrice = useMemo(() => {
    return getFormattedGasPrice({
      baseFee,
      chainId,
      gasPrice,
      gasPriceOption,
      gasPriceSettings,
    });
  }, [baseFee, chainId, gasPrice, gasPriceOption, gasPriceSettings]);

  useCreateTokenEstimatedGas(createTokenSettings);

  return (
    <>
      <Formik
        initialValues={createTokenSettings}
        onSubmit={(values) => {
          setIsOpen(true);
          setCreateTokenSettings(values);
        }}
        validationSchema={createTokenSchema}
      >
        {(props) => (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              props.handleSubmit();
            }}
          >
            <div className="flex flex-col gap-1 mb-3">
              <TextField
                label="Token name"
                tooltipText="tooltip_text"
                placeholder="Name your token"
                value={props.values.name}
                error={props.touched.name && props.errors.name}
                onChange={(e) => props.setFieldValue("name", e.target.value)}
              />
              <TextField
                label="Symbol"
                tooltipText="tooltip_text"
                placeholder="Add token symbol (e.g. USDT)"
                value={props.values.symbol}
                error={props.touched.symbol && props.errors.symbol}
                onChange={(e) => props.setFieldValue("symbol", e.target.value)}
              />
              <TextField
                label="Total supply"
                isNumeric
                tooltipText="tooltip_text"
                placeholder="Enter total supply"
                value={props.values.totalSupply}
                error={props.touched.totalSupply && props.errors.totalSupply}
                onChange={(e) => props.setFieldValue("totalSupply", e.target.value)}
              />
              <TextField
                label="Image  URL (optional)"
                tooltipText="tooltip_text"
                placeholder="https:// "
                value={props.values.imageURL}
                error={props.touched.imageURL && props.errors.imageURL}
                onChange={(e) => props.setFieldValue("imageURL", e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-4 mb-5">
              <Checkbox
                checked={props.values.allowMintForOwner}
                label="Allow owner (you) to issue new tokens"
                handleChange={() =>
                  props.setFieldValue("allowMintForOwner", !props.values.allowMintForOwner)
                }
                id="allow-issue-new-tokens"
              />
              <Checkbox
                label="Make ERC-20 version"
                checked={props.values.createERC20}
                handleChange={() => props.setFieldValue("createERC20", !props.values.createERC20)}
                id="make-erc20-version"
              />
            </div>

            <GasSettingsBlock
              customGasLimit={customGasLimit}
              estimatedGas={estimatedGas}
              formattedGasPrice={formattedGasPrice}
              handleClick={() => setIsOpenedFee(true)}
            />

            {isConnected ? (
              <Button
                disabled={
                  Object.keys(props.touched).length > 0 && Object.keys(props.errors).length > 0
                }
                fullWidth
              >
                Create token
              </Button>
            ) : (
              <Button type="button" onClick={() => setWalletConnectOpened(true)} fullWidth>
                {tWallet("connect_wallet")}
              </Button>
            )}
          </form>
        )}
      </Formik>
      <ConfirmCreateTokenDialog createTokenSettings={createTokenSettings} />
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
    </>
  );
}
