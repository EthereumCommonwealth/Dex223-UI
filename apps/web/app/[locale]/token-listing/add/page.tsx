"use client";

import { isZeroAddress } from "@ethereumjs/util";
import clsx from "clsx";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import React, { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useMediaQuery } from "react-responsive";
import { Address, formatEther, formatGwei, formatUnits, isAddress } from "viem";
import { useAccount, usePublicClient } from "wagmi";

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
import { useTokenListingRecentTransactionsStore } from "@/app/[locale]/token-listing/add/stores/useTokenListingRecentTransactionsStore";
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
import { useRouter } from "@/i18n/routing";
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
      <Button
        size={ButtonSize.EXTRA_LARGE}
        tabletSize={ButtonSize.LARGE}
        onClick={() => setWalletConnectOpened(true)}
        fullWidth
      >
        {tWallet("connect_wallet")}
      </Button>
    );
  }

  if (isLoadingList) {
    return (
      <Button size={ButtonSize.EXTRA_LARGE} tabletSize={ButtonSize.LARGE} fullWidth isLoading>
        <span className="flex items-center gap-2">
          <span>Processing list operation</span>
          <Preloader size={20} color="black" />
        </span>
      </Button>
    );
  }

  if (isLoadingApprove) {
    return (
      <Button size={ButtonSize.EXTRA_LARGE} tabletSize={ButtonSize.LARGE} fullWidth isLoading>
        <span className="flex items-center gap-2">
          <span>{t("approving_in_progress")}</span>
          <Preloader size={20} color="black" />
        </span>
      </Button>
    );
  }

  if (isPendingApprove || isPendingList) {
    return (
      <Button size={ButtonSize.EXTRA_LARGE} tabletSize={ButtonSize.LARGE} fullWidth isLoading>
        <span className="flex items-center gap-2">
          <span>{t("waiting_for_confirmation")}</span>
          <Preloader size={20} color="black" />
        </span>
      </Button>
    );
  }

  if (!tokenA || !tokenB) {
    return (
      <Button size={ButtonSize.EXTRA_LARGE} tabletSize={ButtonSize.LARGE} fullWidth disabled>
        {t("select_tokens")}
      </Button>
    );
  }

  if (!isPoolExists) {
    return (
      <Button size={ButtonSize.EXTRA_LARGE} tabletSize={ButtonSize.LARGE} fullWidth disabled>
        Pool doesn&apos;t exists
      </Button>
    );
  }

  if (isBothTokensAlreadyInList) {
    return (
      <Button size={ButtonSize.EXTRA_LARGE} tabletSize={ButtonSize.LARGE} fullWidth disabled>
        Both tokens are already listed
      </Button>
    );
  }

  return (
    <Button
      size={ButtonSize.EXTRA_LARGE}
      tabletSize={ButtonSize.LARGE}
      onClick={() => setConfirmListTokenDialogOpened(true)}
      fullWidth
    >
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

  const params = useSearchParams();
  const router = useRouter();
  const publicClient = usePublicClient();
  const chainId = useCurrentChainId();
  const { isOpened: showRecentTransactions, setIsOpened: setShowRecentTransactions } =
    useTokenListingRecentTransactionsStore();

  console.log(params);

  useRecentTransactionTracking();
  useListTokenEstimatedGas();

  const [isOpenedFee, setIsOpenedFee] = useState(false);

  const { autoListing, paymentToken } = useAutoListing();

  const { tokenA, tokenB, setTokenA, setTokenB } = useListTokensStore();
  const pool = usePool({ currencyA: tokenA, currencyB: tokenB, tier: FeeAmount.MEDIUM });

  const isPoolExists = useMemo(
    () => pool[0] !== PoolState.NOT_EXISTS && pool[0] !== PoolState.INVALID,
    [pool],
  );

  const destination = useMemo(() => {
    const dest = params.get("dest");
    if (dest && decodeURIComponent(dest).startsWith("/token-listing/contracts")) {
      return decodeURIComponent(dest);
    } else {
      return `/token-listing/contracts`;
    }
  }, [params]);

  const [tokenAAddress, setTokenAAddress] = useState("");
  const [tokenBAddress, setTokenBAddress] = useState("");

  const tokens = useTokens();

  const [isPickTokenOpened, setPickTokenOpened] = useState(false);
  const [currentlyPicking, setCurrentlyPicking] = useState<"tokenA" | "tokenB">("tokenA");

  const { isLoadingList, isLoadingApprove, isPendingApprove, isPendingList } = useListTokenStatus();

  const {
    gasPriceOption,
    gasPriceSettings,
    setGasPriceOption,
    setGasPriceSettings,
    updateDefaultState,
  } = useListTokensGasPriceStore();

  useEffect(() => {
    updateDefaultState(chainId);
  }, [chainId, updateDefaultState]);

  const { estimatedGas, customGasLimit, setEstimatedGas, setCustomGasLimit } =
    useListTokensGasLimitStore();

  const { isAdvanced, setIsAdvanced } = useListTokensGasModeStore();

  const handleChange = useCallback(
    async (
      e: ChangeEvent<HTMLInputElement>,
      setToken: (token: Currency | undefined) => void,
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
          "/images/tokens/placeholder.svg",
        );

        setToken(_token);
      } else {
        setToken(undefined);
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

  const firstFieldError = useMemo(() => {
    if (tokenAAddress && !isAddress(tokenAAddress)) {
      return "Token address is invalid";
    }
    return;
  }, [tokenAAddress]);

  const sameTokensSelected = useMemo(() => {
    return Boolean(tokenAAddress && tokenAAddress === tokenBAddress);
  }, [tokenAAddress, tokenBAddress]);

  const secondFieldError = useMemo(() => {
    if (tokenBAddress && !isAddress(tokenBAddress)) {
      return "Token address is invalid";
    }

    if (sameTokensSelected) {
      return "Second token should be different";
    }
  }, [sameTokensSelected, tokenBAddress]);

  const locale = useLocale();

  const isMobile = useMediaQuery({ query: "(max-width: 519px)" });

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
          <div className="grid-in-[left] flex justify-center">
            <div className="w-full sm:max-w-[600px] xl:max-w-full">
              <RecentTransactions
                showRecentTransactions={showRecentTransactions}
                handleClose={() => setShowRecentTransactions(false)}
                store={useTokenListingRecentTransactionsStore}
              />
            </div>
          </div>

          <div className="flex justify-center grid-in-[right]">
            <div className="flex flex-col gap-5 w-full sm:max-w-[600px] xl:max-w-full">
              <div className="pt-2.5 card-spacing bg-primary-bg rounded-5">
                <div className="flex justify-between items-center mb-2.5 -mx-3">
                  <IconButton
                    onClick={() => router.replace(destination)}
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
                    <div className="bg-secondary-bg relative flex items-center rounded-3 pr-[3px]">
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
                        className="flex-shrink-0 p-2 flex items-center border border-transparent gap-1 text-primary-text bg-primary-bg rounded-2 hocus:bg-green-bg hocus:border-green duration-200 hocus:shadow hocus:shadow-green/60"
                        onClick={() => {
                          setCurrentlyPicking("tokenA");
                          setPickTokenOpened(true);
                        }}
                      >
                        {tokenA && (
                          <Image
                            className="mr-1"
                            width={24}
                            height={24}
                            src={tokenA?.logoURI || "/images/tokens/placeholder.svg"}
                            alt=""
                          />
                        )}
                        {tokenA?.symbol || <span className="text-tertiary-text">Select token</span>}
                        <Svg className="text-secondary-text" iconName="small-expand-arrow" />
                      </button>
                      <div
                        className={clsx(
                          "duration-200 rounded-2 pointer-events-none absolute w-full h-full border peer-hocus:shadow top-0 left-0",
                          firstFieldError
                            ? "border-red-light peer-hocus:border-red-light peer-hocus:shadow-red/60"
                            : "border-transparent peer-hocus:border-green peer-hocus:shadow-green/60",
                        )}
                      />
                    </div>
                    <HelperText
                      error={firstFieldError}
                      helperText="Enter the contract address of the token you want to list"
                    />
                  </div>

                  <div>
                    <InputLabel label="Paired token contract address" />
                    <div className="bg-secondary-bg relative flex items-center rounded-3 pr-[3px]">
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
                        className="flex-shrink-0 p-2 flex items-center border border-transparent gap-1 text-primary-text bg-primary-bg rounded-2 hocus:bg-green-bg hocus:border-green duration-200 hocus:shadow hocus:shadow-green/60"
                        onClick={() => {
                          setCurrentlyPicking("tokenB");
                          setPickTokenOpened(true);
                        }}
                      >
                        {tokenB && (
                          <Image
                            className="mr-1"
                            width={24}
                            height={24}
                            src={tokenB?.logoURI || "/images/tokens/placeholder.svg"}
                            alt=""
                          />
                        )}
                        {tokenB?.symbol || <span className="text-tertiary-text">Select token</span>}
                        <Svg className="text-secondary-text" iconName="small-expand-arrow" />
                      </button>
                      <div
                        className={clsx(
                          "duration-200 rounded-2 pointer-events-none absolute w-full h-full border peer-hocus:shadow top-0 left-0",
                          secondFieldError
                            ? "border-red-light peer-hocus:border-red-light peer-hocus:shadow-red/60"
                            : "border-transparent peer-hocus:border-green peer-hocus:shadow-green/60",
                        )}
                      />
                    </div>
                    <HelperText
                      error={secondFieldError}
                      helperText="Enter or select the paired token address"
                    />
                  </div>

                  {!isPoolExists && !sameTokensSelected && tokenA && tokenB && (
                    <Alert
                      text={
                        <span>
                          There is no existing pool, so you cannot list the primary token. Please{" "}
                          <a
                            target="_blank"
                            href={`/${locale}/add?tokenA=${tokenA.wrapped.address0}&tokenB=${tokenB.wrapped.address0}`}
                            className="text-green hocus:underline"
                          >
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
                      className="bg-tertiary-bg justify-between pl-5"
                      onClick={() => setAutoListingSelectOpened(true)}
                    >
                      {autoListing?.name || (
                        <span className="text-tertiary-text">Select token list</span>
                      )}
                    </SelectButton>
                    <HelperText
                      helperText={
                        !autoListing ? (
                          "Choose contract address you want to list"
                        ) : (
                          <span className="flex items-center gap-1">
                            Contract address:{" "}
                            <ExternalTextLink
                              className="text-12"
                              arrowSize={16}
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
                              <Image
                                src="/images/tokens/placeholder.svg"
                                width={24}
                                height={24}
                                alt=""
                              />
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
                                  src="/images/tokens/placeholder.svg"
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

                <div className="bg-tertiary-bg px-5 py-2 mb-5 flex justify-between items-center rounded-3 flex-col xs:flex-row">
                  <div className="text-12 xs:text-14 flex items-center gap-8 justify-between xs:justify-start max-xs:w-full">
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

                  <div className="grid grid-cols-[auto_1fr] xs:flex xs:items-center gap-2 w-full xs:w-auto mt-2 xs:mt-0">
                    <span className="flex items-center justify-center px-2 text-14 rounded-20 font-500 text-secondary-text border border-secondary-border max-xs:h-8">
                      {t(gasOptionTitle[gasPriceOption])}
                    </span>
                    <Button
                      colorScheme={ButtonColor.LIGHT_GREEN}
                      size={isMobile ? ButtonSize.SMALL : ButtonSize.EXTRA_SMALL}
                      onClick={() => setIsOpenedFee(true)}
                      fullWidth={isMobile}
                      className="rounded-5"
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
