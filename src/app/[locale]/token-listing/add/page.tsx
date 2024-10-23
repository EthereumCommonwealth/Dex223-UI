"use client";

import { isZeroAddress } from "@ethereumjs/util";
import clsx from "clsx";
import Image from "next/image";
import { useTranslations } from "next-intl";
import React, { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Address, formatEther, formatGwei, formatUnits, isAddress } from "viem";
import { useAccount, usePublicClient } from "wagmi";

import { useSwapRecentTransactionsStore } from "@/app/[locale]/swap/stores/useSwapRecentTransactions";
import ChooseAutoListingDialog from "@/app/[locale]/token-listing/add/components/ChooseAutoListingDialog";
import ChoosePaymentDialog from "@/app/[locale]/token-listing/add/components/ChoosePaymentDialog";
import ConfirmListingDialog from "@/app/[locale]/token-listing/add/components/ConfirmListingDialog";
import useAutoListing from "@/app/[locale]/token-listing/add/hooks/useAutoListing";
import { useAutoListingSearchParams } from "@/app/[locale]/token-listing/add/hooks/useAutolistingSearchParams";
import { useListTokenEstimatedGas } from "@/app/[locale]/token-listing/add/hooks/useListToken";
import { useListTokenStatus } from "@/app/[locale]/token-listing/add/hooks/useListTokenStatus";
import useTokensToList from "@/app/[locale]/token-listing/add/hooks/useTokensToList";
import { useChooseAutoListingDialogStore } from "@/app/[locale]/token-listing/add/stores/useChooseAutoListingDialogStore";
import { useChoosePaymentDialogStore } from "@/app/[locale]/token-listing/add/stores/useChoosePaymentDialogStore";
import { useConfirmListTokenDialogStore } from "@/app/[locale]/token-listing/add/stores/useConfirmListTokenDialogOpened";
import {
  useListTokensGasLimitStore,
  useListTokensGasModeStore,
  useListTokensGasPriceStore,
} from "@/app/[locale]/token-listing/add/stores/useListTokensGasSettings";
import { useListTokensStore } from "@/app/[locale]/token-listing/add/stores/useListTokensStore";
import { usePaymentTokenStore } from "@/app/[locale]/token-listing/add/stores/usePaymentTokenStore";
import Alert from "@/components/atoms/Alert";
import Container from "@/components/atoms/Container";
import ExternalTextLink from "@/components/atoms/ExternalTextLink";
import Preloader from "@/components/atoms/Preloader";
import SelectButton from "@/components/atoms/SelectButton";
import Svg from "@/components/atoms/Svg";
import { HelperText, InputLabel } from "@/components/atoms/TextField";
import Badge, { BadgeVariant } from "@/components/badges/Badge";
import Button, { ButtonColor, ButtonSize } from "@/components/buttons/Button";
import IconButton, { IconButtonSize } from "@/components/buttons/IconButton";
import RecentTransactions from "@/components/common/RecentTransactions";
import NetworkFeeConfigDialog from "@/components/dialogs/NetworkFeeConfigDialog";
import PickTokenDialog from "@/components/dialogs/PickTokenDialog";
import { useConnectWalletDialogStateStore } from "@/components/dialogs/stores/useConnectWalletStore";
import { ERC20_ABI } from "@/config/abis/erc20";
import { TOKEN_CONVERTER_ABI } from "@/config/abis/tokenConverter";
import { baseFeeMultipliers, SCALING_FACTOR } from "@/config/constants/baseFeeMultipliers";
import { formatFloat } from "@/functions/formatFloat";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import truncateMiddle from "@/functions/truncateMiddle";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { useFees } from "@/hooks/useFees";
import { PoolState, usePool } from "@/hooks/usePools";
import { useRecentTransactionTracking } from "@/hooks/useRecentTransactionTracking";
import { useTokens } from "@/hooks/useTokenLists";
import { useRouter } from "@/navigation";
import { CONVERTER_ADDRESS } from "@/sdk_hybrid/addresses";
import { DexChainId } from "@/sdk_hybrid/chains";
import { FeeAmount } from "@/sdk_hybrid/constants";
import { Currency } from "@/sdk_hybrid/entities/currency";
import { Token } from "@/sdk_hybrid/entities/token";
import { GasFeeModel, GasOption } from "@/stores/factories/createGasPriceStore";

function OpenConfirmListTokenButton({
  isPoolExists,
  isBothTokensAlreadyInList,
}: {
  isPoolExists: boolean;
  isBothTokensAlreadyInList: boolean;
}) {
  const tWallet = useTranslations("Wallet");
  const t = useTranslations("Swap");
  const { isConnected } = useAccount();

  const { tokenA, tokenB } = useListTokensStore();

  const { setIsOpen: setConfirmListTokenDialogOpened } = useConfirmListTokenDialogStore();

  const { isLoadingList, isLoadingApprove, isPendingApprove, isPendingList } = useListTokenStatus();
  const { setIsOpened: setWalletConnectOpened } = useConnectWalletDialogStateStore();

  if (!isConnected) {
    return (
      <Button onClick={() => setWalletConnectOpened(true)} fullWidth>
        {tWallet("connect_wallet")}
      </Button>
    );
  }

  if (isLoadingList) {
    return (
      <Button fullWidth isLoading>
        <span className="flex items-center gap-2">
          <span>Processing list operation</span>
          <Preloader size={20} color="black" />
        </span>
      </Button>
    );
  }

  if (isLoadingApprove) {
    return (
      <Button fullWidth isLoading>
        <span className="flex items-center gap-2">
          <span>{t("approving_in_progress")}</span>
          <Preloader size={20} color="black" />
        </span>
      </Button>
    );
  }

  if (isPendingApprove || isPendingList) {
    return (
      <Button fullWidth isLoading>
        <span className="flex items-center gap-2">
          <span>{t("waiting_for_confirmation")}</span>
          <Preloader size={20} color="black" />
        </span>
      </Button>
    );
  }

  if (!tokenA || !tokenB) {
    return (
      <Button fullWidth disabled>
        {t("select_tokens")}
      </Button>
    );
  }

  if (!isPoolExists) {
    return (
      <Button fullWidth disabled>
        Pool doesn&apos;t exists
      </Button>
    );
  }

  if (isBothTokensAlreadyInList) {
    return (
      <Button fullWidth disabled>
        Both tokens are already listed
      </Button>
    );
  }

  return (
    <Button onClick={() => setConfirmListTokenDialogOpened(true)} fullWidth>
      List token
    </Button>
  );
}

const gasOptionTitle: Record<GasOption, any> = {
  [GasOption.CHEAP]: "cheap",
  [GasOption.FAST]: "fast",
  [GasOption.CUSTOM]: "custom",
};
export default function ListTokenPage() {
  useAutoListingSearchParams();
  const t = useTranslations("Swap");

  const router = useRouter();
  const publicClient = usePublicClient();
  const chainId = useCurrentChainId();
  const { isOpened: showRecentTransactions, setIsOpened: setShowRecentTransactions } =
    useSwapRecentTransactionsStore();

  useRecentTransactionTracking();
  useListTokenEstimatedGas();

  const [isOpenedFee, setIsOpenedFee] = useState(false);

  const { autoListing, paymentToken } = useAutoListing();

  const { tokenA, tokenB, setTokenA, setTokenB } = useListTokensStore();
  const pool = usePool({ currencyA: tokenA, currencyB: tokenB, tier: FeeAmount.MEDIUM });

  const isPoolExists = useMemo(() => pool[0] !== PoolState.NOT_EXISTS, [pool]);

  const [tokenAAddress, setTokenAAddress] = useState("");
  const [tokenBAddress, setTokenBAddress] = useState("");

  const tokens = useTokens();

  const [isPickTokenOpened, setPickTokenOpened] = useState(false);
  const [currentlyPicking, setCurrentlyPicking] = useState<"tokenA" | "tokenB">("tokenA");

  const { isLoadingList, isLoadingApprove, isPendingApprove, isPendingList } = useListTokenStatus();

  const { gasPriceOption, gasPriceSettings, setGasPriceOption, setGasPriceSettings } =
    useListTokensGasPriceStore();
  const { estimatedGas, customGasLimit, setEstimatedGas, setCustomGasLimit } =
    useListTokensGasLimitStore();

  console.log("Estimated:" + estimatedGas);
  const { isAdvanced, setIsAdvanced } = useListTokensGasModeStore();

  const handleChange = useCallback(
    async (
      e: ChangeEvent<HTMLInputElement>,
      setToken: (token: Currency) => void,
      setTokenAddress: (value: string) => void,
    ) => {
      const value = e.target.value;
      setTokenAddress(value);

      if (isAddress(value) && publicClient && chainId) {
        const tokenToFind = tokens.find((t) => t.wrapped.address0 === value);
        if (tokenToFind) {
          setToken(tokenToFind);
          return;
        }

        const decimals = await publicClient.readContract({
          abi: ERC20_ABI,
          functionName: "decimals",
          address: value,
        });

        const symbol = await publicClient.readContract({
          abi: ERC20_ABI,
          functionName: "symbol",
          address: value,
        });
        const name = await publicClient.readContract({
          abi: ERC20_ABI,
          functionName: "name",
          address: value,
        });
        const predictedERC223Address = await publicClient.readContract({
          abi: TOKEN_CONVERTER_ABI,
          functionName: "predictWrapperAddress",
          address: CONVERTER_ADDRESS[chainId],
          args: [value as Address, true],
        });

        const _token = new Token(
          chainId,
          value,
          predictedERC223Address,
          decimals,
          symbol,
          name,
          "/tokens/placeholder.svg",
        );

        setToken(_token);
      }
    },
    [chainId, publicClient, tokens],
  );

  const { setPaymentToken } = usePaymentTokenStore();

  const { setIsOpen: setConfirmListTokenDialogOpened } = useConfirmListTokenDialogStore();

  useEffect(() => {
    if (!paymentToken && autoListing?.tokensToPay[0]) {
      setPaymentToken(autoListing?.tokensToPay[0]);
    }
  }, [autoListing?.tokensToPay, paymentToken, setPaymentToken]);

  const { setIsOpen: setPaymentDialogSelectOpened } = useChoosePaymentDialogStore();
  const { setIsOpen: setAutoListingSelectOpened } = useChooseAutoListingDialogStore();

  const tokensToList = useTokensToList();

  const { baseFee, gasPrice, priorityFee } = useFees();

  const formattedGasPrice = useMemo(() => {
    if (gasPriceOption !== GasOption.CUSTOM) {
      const multiplier = baseFeeMultipliers[chainId][gasPriceOption];
      switch (gasPriceSettings.model) {
        case GasFeeModel.EIP1559:
          if (baseFee) {
            return (baseFee * multiplier) / SCALING_FACTOR;
          }
          break;

        case GasFeeModel.LEGACY:
          if (gasPrice) {
            return (gasPrice * multiplier) / SCALING_FACTOR;
          }
      }
    } else {
      switch (gasPriceSettings.model) {
        case GasFeeModel.EIP1559:
          return gasPriceSettings.maxFeePerGas;
        case GasFeeModel.LEGACY:
          return gasPriceSettings.gasPrice;
      }
    }
  }, [baseFee, chainId, gasPrice, gasPriceOption, gasPriceSettings]);

  return (
    <>
      <Container>
        <div
          className={clsx(
            "grid py-4 lg:py-[40px] grid-cols-1 mx-auto",
            showRecentTransactions
              ? "xl:grid-cols-[580px_600px] xl:max-w-[1200px] gap-4 xl:grid-areas-[left_right] grid-areas-[right,left]"
              : "xl:grid-cols-[600px] xl:max-w-[600px] grid-areas-[right]",
          )}
        >
          {showRecentTransactions && (
            <div className="grid-in-[left] flex justify-center">
              <div className="w-full sm:max-w-[600px] xl:max-w-full">
                <RecentTransactions
                  showRecentTransactions={showRecentTransactions}
                  handleClose={() => setShowRecentTransactions(false)}
                />
              </div>
            </div>
          )}

          <div className="flex justify-center grid-in-[right]">
            <div className="flex flex-col gap-5 w-full sm:max-w-[600px] xl:max-w-full">
              <div className="px-4 md:px-10 pt-2.5 pb-5 bg-primary-bg rounded-5">
                <div className="flex justify-between items-center mb-2.5">
                  <IconButton
                    onClick={() => router.back()}
                    iconName="back"
                    buttonSize={IconButtonSize.LARGE}
                  />
                  <h3 className="font-bold text-20">List tokens</h3>
                  <IconButton
                    buttonSize={IconButtonSize.LARGE}
                    active={showRecentTransactions}
                    iconName="recent-transactions"
                    onClick={() => setShowRecentTransactions(!showRecentTransactions)}
                  />
                </div>
                <p className="text-secondary-text text-14 mb-4">
                  List your token automatically using our smart contract. Click the button below to
                  proceed and leverage our seamless, automated process for adding your token to our
                  platform. This method ensures a quick and efficient listing, utilizing the power
                  of smart contracts to handle the process securely and transparently. Get started
                  now to enjoy hassle-free token listing!
                </p>

                <div className="flex flex-col gap-4 pb-5">
                  <div>
                    <InputLabel label="Token contract address" />
                    <div className="bg-secondary-bg relative flex items-center border border-transparent rounded-2 pr-[3px]">
                      <input
                        className="bg-transparent peer duration-200 focus:outline-0 h-12 pl-5 placeholder:text-tertiary-text text-16 w-full rounded-2 pr-2"
                        value={tokenAAddress}
                        onChange={(e) => {
                          handleChange(e, setTokenA, setTokenAAddress);
                        }}
                        type="text"
                        placeholder="Token contract address"
                      />
                      <button
                        className="flex-shrink-0 p-2 flex items-center border border-transparent gap-1 text-primary-text bg-primary-bg rounded-2 hover:bg-green-bg hover:border-green duration-200 hover:shadow hover:shadow-green/60 focus:bg-green-bg focus:border-green focus:outline-0 focus:shadow focus:shadow-green/60"
                        onClick={() => {
                          setCurrentlyPicking("tokenA");
                          setPickTokenOpened(true);
                        }}
                      >
                        <Image
                          className="mr-1"
                          width={24}
                          height={24}
                          src={tokenA?.logoURI || "/tokens/placeholder.svg"}
                          alt=""
                        />
                        {tokenA?.symbol || "Select token"}
                        <Svg iconName="small-expand-arrow" />
                      </button>
                      <div className="duration-200 rounded-3 pointer-events-none absolute w-full h-full border border-transparent peer-hover:shadow peer-hover:shadow-green/60 peer-focus:shadow peer-focus:shadow-green/60 peer-focus:border-green top-0 left-0" />
                    </div>
                    <HelperText helperText="Enter the contract address of the token you want to list" />
                  </div>

                  <div>
                    <InputLabel label="Paired token contract address" />
                    <div className="bg-secondary-bg relative flex items-center border border-transparent rounded-2 pr-[3px]">
                      <input
                        className="bg-transparent peer duration-200 focus:outline-0 h-12 pl-5 placeholder:text-tertiary-text text-16 w-full rounded-2 pr-2"
                        value={tokenBAddress}
                        onChange={(e) => {
                          handleChange(e, setTokenB, setTokenBAddress);
                        }}
                        type="text"
                        placeholder="Token contract address"
                      />
                      <button
                        className="flex-shrink-0 p-2 flex items-center border border-transparent gap-1 text-primary-text bg-primary-bg rounded-2 hover:bg-green-bg hover:border-green duration-200 hover:shadow hover:shadow-green/60"
                        onClick={() => {
                          setCurrentlyPicking("tokenB");
                          setPickTokenOpened(true);
                        }}
                      >
                        <Image
                          className="mr-1"
                          width={24}
                          height={24}
                          src={tokenB?.logoURI || "/tokens/placeholder.svg"}
                          alt=""
                        />
                        {tokenB?.symbol || "Select token"}
                        <Svg iconName="small-expand-arrow" />
                      </button>
                      <div className="duration-200 rounded-3 pointer-events-none absolute w-full h-full border border-transparent peer-hover:shadow peer-hover:shadow-green/60 peer-focus:shadow peer-focus:shadow-green/60 peer-focus:border-green top-0 left-0" />
                    </div>
                    <HelperText helperText="Enter or select the paired token address" />
                  </div>

                  {!isPoolExists && tokenA && tokenB && (
                    <Alert
                      text={
                        <span>
                          There is no existing pool, so you cannot list the primary token. Please{" "}
                          <a target="_blank" href="/add" className="text-green hover:underline">
                            create a pool
                          </a>{" "}
                          first.
                        </span>
                      }
                      type="warning"
                    />
                  )}

                  <Alert
                    text="You can only list a token that has a pool on our exchange"
                    type="info"
                  />

                  <div>
                    <InputLabel label="You list in auto-listing contract" />
                    <SelectButton
                      fullWidth
                      size="medium"
                      className="bg-secondary-bg justify-between pl-5"
                      onClick={() => setAutoListingSelectOpened(true)}
                    >
                      {autoListing?.name || "Select token list"}
                    </SelectButton>
                    <HelperText
                      helperText={
                        !autoListing ? (
                          "Choose contract address you want to list"
                        ) : (
                          <span className="flex items-center gap-2">
                            Contract address:{" "}
                            <ExternalTextLink
                              color="white"
                              text={truncateMiddle(autoListing.id)}
                              href={getExplorerLink(
                                ExplorerLinkType.ADDRESS,
                                autoListing.id,
                                DexChainId.SEPOLIA,
                              )}
                            />
                          </span>
                        )
                      }
                    />
                  </div>

                  {!!autoListing?.tokensToPay.length && (
                    <>
                      {autoListing?.tokensToPay.length > 1 ? (
                        <div>
                          <InputLabel label="Payment for listing" />
                          <div className="h-12 rounded-2 border w-full border-secondary-border text-primary-text flex justify-between items-center pl-5 pr-1">
                            {paymentToken
                              ? formatUnits(
                                  paymentToken.price,
                                  paymentToken.token.decimals ?? 18,
                                ).slice(0, 7) === "0.00000"
                                ? truncateMiddle(
                                    formatUnits(
                                      paymentToken.price,
                                      paymentToken.token.decimals ?? 18,
                                    ),
                                    {
                                      charsFromStart: 3,
                                      charsFromEnd: 2,
                                    },
                                  )
                                : formatFloat(
                                    formatUnits(
                                      paymentToken.price,
                                      paymentToken.token.decimals != null
                                        ? paymentToken.token.decimals
                                        : 18,
                                    ),
                                  )
                              : 1}

                            <SelectButton
                              onClick={() => setPaymentDialogSelectOpened(true)}
                              className="flex items-center gap-2 bg-tertiary-bg"
                            >
                              <Image src="/tokens/placeholder.svg" width={24} height={24} alt="" />
                              {paymentToken?.token && isZeroAddress(paymentToken.token.address)
                                ? "ETH"
                                : paymentToken?.token.symbol}
                              <Badge
                                variant={BadgeVariant.COLORED}
                                color="green"
                                text={
                                  paymentToken?.token && isZeroAddress(paymentToken.token.address)
                                    ? "Native"
                                    : "ERC-20"
                                }
                              />
                            </SelectButton>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <InputLabel label="Payment for listing" />
                          {paymentToken && (
                            <div className="h-12 rounded-2 border w-full border-secondary-border text-primary-text flex justify-between items-center px-5">
                              {formatUnits(paymentToken.price, paymentToken.token.decimals ?? 18)}
                              <span className="flex items-center gap-2">
                                <Image
                                  src="/tokens/placeholder.svg"
                                  width={24}
                                  height={24}
                                  alt=""
                                />

                                {paymentToken?.token.symbol}
                                <Badge
                                  variant={BadgeVariant.COLORED}
                                  color="green"
                                  text={
                                    paymentToken?.token && isZeroAddress(paymentToken.token.address)
                                      ? "Native"
                                      : "ERC-20"
                                  }
                                />
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="bg-tertiary-bg px-5 py-2 mb-5 flex justify-between items-center rounded-3">
                  <div className="flex items-center gap-8">
                    <p className="flex flex-col text-tertiary-text">
                      <span>Gas price:</span>
                      <span> {formatFloat(formatGwei(formattedGasPrice || BigInt(0)))} GWEI</span>
                    </p>

                    <p className="flex flex-col text-tertiary-text">
                      <span>Gas limit:</span>
                      <span>
                        {customGasLimit ? customGasLimit.toString() : estimatedGas?.toString()}
                      </span>
                    </p>
                    <p className="flex flex-col">
                      <span className="text-tertiary-text">Network fee:</span>
                      <span>
                        {formatFloat(
                          formatEther(
                            (formattedGasPrice || BigInt(0)) *
                              (customGasLimit ? customGasLimit : estimatedGas),
                            "wei",
                          ),
                        )}{" "}
                        ETH
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {gasPriceOption === GasOption.CUSTOM && (
                      <span className="flex items-center justify-center px-2 text-14 rounded-20 font-500 text-secondary-text border border-secondary-border">
                        {t(gasOptionTitle[gasPriceOption])}
                      </span>
                    )}
                    <Button
                      colorScheme={ButtonColor.LIGHT_GREEN}
                      size={ButtonSize.EXTRA_SMALL}
                      onClick={() => setIsOpenedFee(true)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>

                {(isLoadingList || isPendingList || isPendingApprove || isLoadingApprove) && (
                  <div className="flex justify-between px-5 py-3 rounded-2 bg-tertiary-bg mb-5">
                    <div className="flex items-center gap-2 text-14">
                      <Preloader size={20} />

                      {isLoadingList && <span>List token processing</span>}
                      {isPendingList && <span>{t("waiting_for_confirmation")}</span>}
                      {isLoadingApprove && <span>{t("approving_in_progress")}</span>}
                      {isPendingApprove && <span>{t("waiting_for_confirmation")}</span>}
                    </div>

                    <Button
                      onClick={() => {
                        setConfirmListTokenDialogOpened(true);
                      }}
                      size={ButtonSize.EXTRA_SMALL}
                    >
                      Review details
                    </Button>
                  </div>
                )}

                <OpenConfirmListTokenButton
                  isPoolExists={isPoolExists}
                  isBothTokensAlreadyInList={!tokensToList.length}
                />
              </div>
            </div>
          </div>
        </div>

        <ChooseAutoListingDialog />
        <ChoosePaymentDialog />

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

        <PickTokenDialog
          isOpen={isPickTokenOpened}
          setIsOpen={setPickTokenOpened}
          handlePick={(token) => {
            if (currentlyPicking === "tokenA") {
              setTokenA(token);
              setTokenAAddress(token.wrapped.address0);
            }
            if (currentlyPicking === "tokenB") {
              setTokenB(token);
              setTokenBAddress(token.wrapped.address0);
            }

            setPickTokenOpened(false);
          }}
        />

        <ConfirmListingDialog />
      </Container>
    </>
  );
}
