"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import React, { useCallback, useState } from "react";

import { RevokeDialog } from "@/app/[locale]/add/components/DepositAmounts/RevokeDialog";
import FeeAmountSettings from "@/app/[locale]/add/components/FeeAmountSettings";
import { useLiquidityApprove } from "@/app/[locale]/add/hooks/useLiquidityApprove";
import {
  Field,
  useLiquidityAmountsStore,
} from "@/app/[locale]/add/stores/useAddLiquidityAmountsStore";
import { useAddLiquidityRecentTransactionsStore } from "@/app/[locale]/add/stores/useAddLiquidityRecentTransactionsStore";
import {
  AddLiquidityApproveStatus,
  AddLiquidityStatus,
  useAddLiquidityStatusStore,
} from "@/app/[locale]/add/stores/useAddLiquidityStatusStore";
import { useAddLiquidityTokensStore } from "@/app/[locale]/add/stores/useAddLiquidityTokensStore";
import { useLiquidityTierStore } from "@/app/[locale]/add/stores/useLiquidityTierStore";
import Container from "@/components/atoms/Container";
import SelectButton from "@/components/atoms/SelectButton";
import IconButton, {
  IconButtonSize,
  IconButtonVariant,
  IconSize,
} from "@/components/buttons/IconButton";
import RecentTransactions from "@/components/common/RecentTransactions";
import SelectedTokensInfo from "@/components/common/SelectedTokensInfo";
import PickTokenDialog from "@/components/dialogs/PickTokenDialog";
import { AllowanceStatus } from "@/hooks/useAllowance";
import { usePoolsSearchParams } from "@/hooks/usePoolsSearchParams";
import { useRecentTransactionTracking } from "@/hooks/useRecentTransactionTracking";
import { Currency } from "@/sdk_bi/entities/currency";
import { useRevokeStatusStore } from "@/stores/useRevokeStatusStore";

import { DepositAmounts } from "./components/DepositAmounts/DepositAmounts";
import ConfirmLiquidityDialog from "./components/LiquidityActionButton/ConfirmLiquidityDialog";
import { LiquidityActionButton } from "./components/LiquidityActionButton/LiquidityActionButton";
import { PriceRange } from "./components/PriceRange/PriceRange";
import { usePriceRange } from "./hooks/usePrice";
import { useV3DerivedMintInfo } from "./hooks/useV3DerivedMintInfo";
import { useLiquidityPriceRangeStore } from "./stores/useLiquidityPriceRangeStore";

export default function AddPoolPage() {
  usePoolsSearchParams();
  useRecentTransactionTracking();
  const [isOpenedTokenPick, setIsOpenedTokenPick] = useState(false);
  const { isOpened: showRecentTransactions, setIsOpened: setShowRecentTransactions } =
    useAddLiquidityRecentTransactionsStore();

  const t = useTranslations("Liquidity");

  const { tokenA, tokenB, setTokenA, setTokenB, setBothTokens } = useAddLiquidityTokensStore();
  const { tier } = useLiquidityTierStore();
  const { ticks } = useLiquidityPriceRangeStore();
  const { setTypedValue } = useLiquidityAmountsStore();
  const { updateAllowance } = useLiquidityApprove();
  const [currentlyPicking, setCurrentlyPicking] = useState<"tokenA" | "tokenB">("tokenA");

  const handlePick = useCallback(
    (token: Currency) => {
      if (currentlyPicking === "tokenA") {
        if (tokenB && token.wrapped.equals(tokenB.wrapped)) {
          // User picked same as tokenB → swap
          setBothTokens({ tokenA: tokenB, tokenB: tokenA });
        } else {
          console.log("Picking token&");
          setTokenA(token);
        }
      }

      if (currentlyPicking === "tokenB" && tokenA) {
        if (token.wrapped.equals(tokenA.wrapped)) {
          // User picked same as tokenA → swap
          setBothTokens({ tokenA: tokenB, tokenB: tokenA });
        } else {
          setTokenB(token);
        }
      }

      setTypedValue({ field: Field.CURRENCY_A, typedValue: "" });
      setIsOpenedTokenPick(false);
    },
    [currentlyPicking, setTypedValue, tokenB, tokenA, setTokenA, setTokenB, setBothTokens],
  );

  // PRICE RANGE HOOK START
  const {
    formattedPrice,
    price,
    pricesAtTicks,
    ticksAtLimit,
    leftPrice,
    rightPrice,
    tickSpaceLimits,
  } = usePriceRange();
  // PRICE RANGE HOOK END

  // Deposit Amounts START
  const {
    parsedAmounts,
    currencies,
    noLiquidity,
    outOfRange,
    depositADisabled,
    depositBDisabled,
    position,
  } = useV3DerivedMintInfo({
    tokenA,
    tokenB,
    tier,
    price,
  });

  const { status, approve0Status, approve1Status, deposite0Status, deposite1Status } =
    useAddLiquidityStatusStore();
  const { status: revokeStatus } = useRevokeStatusStore();

  const isAllDisabled =
    [AllowanceStatus.LOADING, AllowanceStatus.PENDING].includes(revokeStatus) ||
    [AddLiquidityStatus.MINT_PENDING, AddLiquidityStatus.MINT_LOADING].includes(status) ||
    [approve0Status, approve1Status, deposite0Status, deposite1Status].includes(
      AddLiquidityApproveStatus.LOADING,
    ) ||
    [approve0Status, approve1Status, deposite0Status, deposite1Status].includes(
      AddLiquidityApproveStatus.PENDING,
    );

  const isFormDisabled = !tokenA || !tokenB || isAllDisabled;
  // User need to provide values to price range & Starting price on pool creating
  const { LOWER: tickLower, UPPER: tickUpper } = ticks;
  const isCreatePoolFormFilled =
    !!price && typeof tickLower === "number" && typeof tickUpper === "number";

  return (
    <Container>
      <div className="md:max-w-[1200px] mx-auto my-4 md:my-[40px]">
        <div className="flex justify-between items-center bg-primary-bg rounded-t-3 lg:rounded-t-5 py-1 lg:py-2.5 px-2 lg:px-6">
          <div className="w-[48px] md:w-[104px]">
            <IconButton
              variant={IconButtonVariant.BACK}
              iconSize={IconSize.REGULAR}
              buttonSize={IconButtonSize.LARGE}
              onClick={() => {
                window.history.back();
              }}
            />
          </div>
          <h2 className="text-18 md:text-20 font-bold">{t("add_liquidity_title")}</h2>
          <div className="w-[48px] md:w-[104px] flex items-center gap-2 justify-end">
            <IconButton
              buttonSize={IconButtonSize.LARGE}
              iconName="recent-transactions"
              active={showRecentTransactions}
              onClick={() => setShowRecentTransactions(!showRecentTransactions)}
            />
          </div>
        </div>
        <div className="rounded-b-5 border-t-0 p-4 pt-0 md:p-10 md:pt-0 bg-primary-bg mb-4 md:mb-5">
          <h3 className="text-16 font-bold mb-1 lg:mb-4">{t("select_pair")}</h3>
          <div className="flex gap-2 md:gap-3 mb-4 md:mb-5">
            <SelectButton
              disabled={isAllDisabled}
              variant="rounded"
              className="bg-tertiary-bg"
              fullWidth
              onClick={() => {
                setCurrentlyPicking("tokenA");
                setIsOpenedTokenPick(true);
              }}
              size="large"
            >
              {tokenA ? (
                <span className="flex gap-2 items-center">
                  <Image
                    className="flex-shrink-0 hidden md:block"
                    src={tokenA?.logoURI || "/images/tokens/placeholder.svg"}
                    alt="Ethereum"
                    width={32}
                    height={32}
                  />
                  <Image
                    className="flex-shrink-0 block md:hidden"
                    src={tokenA?.logoURI || "/images/tokens/placeholder.svg"}
                    alt="Ethereum"
                    width={24}
                    height={24}
                  />
                  <span className="block overflow-ellipsis whitespace-nowrap w-[84px] md:w-[141px] overflow-hidden text-left">
                    {tokenA.symbol}
                  </span>
                </span>
              ) : (
                <span className="text-tertiary-text pl-2">{t("select_token")}</span>
              )}
            </SelectButton>
            <SelectButton
              disabled={isAllDisabled}
              variant="rounded"
              className="bg-tertiary-bg"
              fullWidth
              onClick={() => {
                setCurrentlyPicking("tokenB");
                setIsOpenedTokenPick(true);
              }}
              size="large"
            >
              {tokenB ? (
                <span className="flex gap-2 items-center">
                  <Image
                    className="flex-shrink-0 hidden md:block"
                    src={tokenB?.logoURI || "/images/tokens/placeholder.svg"}
                    alt="Ethereum"
                    width={32}
                    height={32}
                  />
                  <Image
                    className="flex-shrink-0 block md:hidden"
                    src={tokenB?.logoURI || "/images/tokens/placeholder.svg"}
                    alt="Ethereum"
                    width={24}
                    height={24}
                  />
                  <span className="block overflow-ellipsis whitespace-nowrap w-[84px] md:w-[141px] overflow-hidden text-left">
                    {tokenB.symbol}
                  </span>
                </span>
              ) : (
                <span className="text-tertiary-text pl-2">{t("select_token")}</span>
              )}
            </SelectButton>
          </div>
          <FeeAmountSettings isAllDisabled={isAllDisabled} />
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:gap-5 mb-4 lg:mb-5">
            <DepositAmounts
              parsedAmounts={parsedAmounts}
              currencies={currencies}
              depositADisabled={depositADisabled}
              depositBDisabled={depositBDisabled}
              isFormDisabled={isFormDisabled || !isCreatePoolFormFilled}
            />
            <PriceRange
              noLiquidity={noLiquidity}
              formattedPrice={formattedPrice}
              leftPrice={leftPrice}
              price={price}
              pricesAtTicks={pricesAtTicks}
              rightPrice={rightPrice}
              tickSpaceLimits={tickSpaceLimits}
              ticksAtLimit={ticksAtLimit}
              outOfRange={outOfRange}
              isFormDisabled={isFormDisabled}
            />
          </div>
          <LiquidityActionButton />
        </div>
        <div className="flex flex-col gap-5">
          <SelectedTokensInfo tokenA={tokenA} tokenB={tokenB} />
          <RecentTransactions
            showRecentTransactions={showRecentTransactions}
            handleClose={() => setShowRecentTransactions(false)}
            pageSize={5}
            store={useAddLiquidityRecentTransactionsStore}
          />
        </div>
      </div>

      <PickTokenDialog
        handlePick={handlePick}
        isOpen={isOpenedTokenPick}
        setIsOpen={setIsOpenedTokenPick}
      />
      <RevokeDialog />
      <ConfirmLiquidityDialog
        parsedAmounts={parsedAmounts}
        position={position}
        noLiquidity={noLiquidity}
        updateAllowance={updateAllowance}
      />
    </Container>
  );
}
