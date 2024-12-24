import { useTranslations } from "next-intl";
import React, { useEffect, useMemo } from "react";
import { useAccount, useBalance } from "wagmi";

import Preloader from "@/components/atoms/Preloader";
import Button, { ButtonSize, ButtonVariant } from "@/components/buttons/Button";
import { useConnectWalletDialogStateStore } from "@/components/dialogs/stores/useConnectWalletStore";
import { AllowanceStatus } from "@/hooks/useAllowance";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import useRevoke from "@/hooks/useRevoke";
import useScopedBlockNumber from "@/hooks/useScopedBlockNumber";
import useWithdraw from "@/hooks/useWithdraw";
import { NONFUNGIBLE_POSITION_MANAGER_ADDRESS } from "@/sdk_hybrid/addresses";
import { DexChainId } from "@/sdk_hybrid/chains";
import { Standard } from "@/sdk_hybrid/standard";
import { useRevokeDialogStatusStore } from "@/stores/useRevokeDialogStatusStore";
import { useRevokeStatusStore } from "@/stores/useRevokeStatusStore";

import { useLiquidityApprove } from "../../hooks/useLiquidityApprove";
import { usePriceRange } from "../../hooks/usePrice";
import { useV3DerivedMintInfo } from "../../hooks/useV3DerivedMintInfo";
import {
  Field,
  useLiquidityAmountsStore,
  useTokensStandards,
} from "../../stores/useAddLiquidityAmountsStore";
import {
  AddLiquidityApproveStatus,
  AddLiquidityStatus,
  useAddLiquidityStatusStore,
} from "../../stores/useAddLiquidityStatusStore";
import { useAddLiquidityTokensStore } from "../../stores/useAddLiquidityTokensStore";
import { useConfirmLiquidityDialogStore } from "../../stores/useConfirmLiquidityDialogOpened";
import { useLiquidityTierStore } from "../../stores/useLiquidityTierStore";
import { APPROVE_BUTTON_TEXT } from "./ConfirmLiquidityDialog";

const LiquidityStatusNotifier = ({
  text,
  buttonText,
  onClick,
}: {
  text: string;
  buttonText: string;
  onClick: () => void;
}) => {
  return (
    <div className="flex w-full pl-6 min-h-12 bg-tertiary-bg gap-2 flex-row mb-4 rounded-3 items-center justify-between px-2">
      <Preloader size={20} color="green" type="circular" />
      <span className="mr-auto items-center text-14 text-primary-text">{text}</span>
      <Button
        className="ml-auto mr-3"
        variant={ButtonVariant.CONTAINED}
        size={ButtonSize.EXTRA_SMALL}
        onClick={onClick}
      >
        {buttonText}
      </Button>
    </div>
  );
};

export const LiquidityActionButton = ({ increase = false }: { increase?: boolean }) => {
  const t = useTranslations("Liquidity");
  const tWallet = useTranslations("Wallet");
  const { setIsOpen } = useConfirmLiquidityDialogStore();

  const {
    setStatus,
    setApprove0Status,
    setApprove0Hash,
    setDeposite0Hash,
    setDeposite1Hash,
    setApprove1Status,
    setApprove1Hash,
    setDeposite0Status,
    setDeposite1Status,
    status,
    approve0Status,
    approve1Status,
    deposite0Status,
    deposite1Status,
  } = useAddLiquidityStatusStore();
  const { tokenA, tokenB } = useAddLiquidityTokensStore();
  const { tier } = useLiquidityTierStore();
  const { price } = usePriceRange();
  const { tokenAStandard, tokenBStandard } = useTokensStandards();
  const { address, isConnected } = useAccount();
  const { status: revokeStatus } = useRevokeStatusStore();

  const { approveTransactionsCount, approveTransactionsType } = useLiquidityApprove();
  const { setIsOpened: setWalletConnectOpened } = useConnectWalletDialogStateStore();
  const { setIsOpenedRevokeDialog, standard } = useRevokeDialogStatusStore();

  const { typedValue } = useLiquidityAmountsStore();

  const { parsedAmounts, noLiquidity } = useV3DerivedMintInfo({
    tokenA,
    tokenB,
    tier,
    price,
  });

  const { data: blockNumber } = useScopedBlockNumber({ watch: true });
  const chainId = useCurrentChainId();

  const { currentAllowance: currentAllowanceA } = useRevoke({
    token: tokenA,
    contractAddress: NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId as DexChainId],
  });

  const { currentDeposit: currentDepositA } = useWithdraw({
    token: tokenA,
    contractAddress: NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId as DexChainId],
  });

  const { currentAllowance: currentAllowanceB } = useRevoke({
    token: tokenB,
    contractAddress: NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId as DexChainId],
  });

  const { currentDeposit: currentDepositB } = useWithdraw({
    token: tokenB,
    contractAddress: NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId as DexChainId],
  });

  const { data: tokenA0Balance, refetch: refetchBalanceA0 } = useBalance({
    address: tokenA ? address : undefined,
    token: tokenA && !tokenA.isNative ? tokenA.address0 : undefined,
    query: {
      enabled: Boolean(tokenA),
    },
  });
  const { data: tokenA1Balance, refetch: refetchBalanceA1 } = useBalance({
    address: tokenA ? address : undefined,
    token: tokenA && !tokenA.isNative ? tokenA.address1 : undefined,
    query: {
      enabled: Boolean(tokenA),
    },
  });

  const { data: tokenB0Balance, refetch: refetchBalanceB0 } = useBalance({
    address: tokenB ? address : undefined,
    token: tokenB && !tokenB.isNative ? tokenB.address0 : undefined,
    query: {
      enabled: Boolean(tokenB),
    },
  });
  const { data: tokenB1Balance, refetch: refetchBalanceB1 } = useBalance({
    address: tokenB ? address : undefined,
    token: tokenB && !tokenB.isNative ? tokenB.address1 : undefined,
    query: {
      enabled: Boolean(tokenB),
    },
  });

  useEffect(() => {
    refetchBalanceA0();
    refetchBalanceA1();
    refetchBalanceB0();
    refetchBalanceB1();
  }, [blockNumber, refetchBalanceA0, refetchBalanceB0, refetchBalanceA1, refetchBalanceB1]);

  const amountToCheckA = parsedAmounts[Field.CURRENCY_A]
    ? BigInt(parsedAmounts[Field.CURRENCY_A].quotient.toString())
    : BigInt(0);
  const amountToCheckB = parsedAmounts[Field.CURRENCY_B]
    ? BigInt(parsedAmounts[Field.CURRENCY_B].quotient.toString())
    : BigInt(0);

  const isSufficientBalanceA = useMemo(() => {
    return tokenAStandard === Standard.ERC20
      ? tokenA0Balance
        ? tokenA0Balance?.value + BigInt(currentAllowanceA || 0) >= amountToCheckA
        : false
      : tokenA1Balance
        ? tokenA1Balance?.value + BigInt(currentDepositA || 0) >= amountToCheckA
        : false;
  }, [
    amountToCheckA,
    currentAllowanceA,
    currentDepositA,
    tokenA0Balance,
    tokenA1Balance,
    tokenAStandard,
  ]);

  const isSufficientAllowanceA = useMemo(() => {
    return tokenAStandard === Standard.ERC20
      ? BigInt(currentAllowanceA || 0) >= amountToCheckA
      : BigInt(currentDepositA || 0) >= amountToCheckA;
  }, [amountToCheckA, currentAllowanceA, currentDepositA, tokenAStandard]);

  const isSufficientAllowanceB = useMemo(() => {
    return tokenBStandard === Standard.ERC20
      ? BigInt(currentAllowanceB || 0) >= amountToCheckB
      : BigInt(currentDepositB || 0) >= amountToCheckB;
  }, [amountToCheckB, currentAllowanceB, currentDepositB, tokenBStandard]);

  const isSufficientBalanceB = useMemo(() => {
    return tokenBStandard === Standard.ERC20
      ? tokenB0Balance
        ? tokenB0Balance?.value + BigInt(currentAllowanceB || 0) >= amountToCheckB
        : false
      : tokenB1Balance
        ? tokenB1Balance?.value + BigInt(currentDepositB || 0) >= amountToCheckB
        : false;
  }, [
    amountToCheckB,
    currentAllowanceB,
    currentDepositB,
    tokenB0Balance,
    tokenB1Balance,
    tokenBStandard,
  ]);

  const isSufficientBalance = useMemo(() => {
    return isSufficientBalanceA && isSufficientBalanceB;
  }, [isSufficientBalanceA, isSufficientBalanceB]);

  if (!isConnected) {
    return (
      <Button onClick={() => setWalletConnectOpened(true)} fullWidth>
        {tWallet("connect_wallet")}
      </Button>
    );
  }

  if ([AllowanceStatus.PENDING, AllowanceStatus.LOADING].includes(revokeStatus)) {
    return (
      <>
        <LiquidityStatusNotifier
          text={standard === Standard.ERC20 ? t("revoke_in_progress") : t("withdraw_in_progress")}
          buttonText={t("details")}
          onClick={() => {
            setIsOpenedRevokeDialog(true);
          }}
        />
        <Button variant={ButtonVariant.CONTAINED} fullWidth disabled className="bg-tertiary-bg">
          {t("revoke_withdraw_title")}
          <span className="flex items-center gap-2">
            <Preloader size={20} color="black" type="circular" />
          </span>
        </Button>
      </>
    );
  }

  if (!tokenA || !tokenB) {
    return (
      <Button variant={ButtonVariant.CONTAINED} fullWidth disabled className="bg-tertiary-bg">
        {t("select_pair")}
      </Button>
    );
  }

  if (!typedValue || typedValue === "0") {
    return (
      <Button variant={ButtonVariant.CONTAINED} fullWidth disabled className="bg-tertiary-bg">
        {t("button_enter_amount")}
      </Button>
    );
  }

  if (!isSufficientBalance) {
    return (
      <Button variant={ButtonVariant.CONTAINED} fullWidth disabled className="bg-tertiary-bg">
        {t("button_insufficient_balance")}
      </Button>
    );
  }

  if (approveTransactionsCount || !isSufficientAllowanceA || !isSufficientAllowanceB) {
    if (
      [AddLiquidityApproveStatus.LOADING, AddLiquidityApproveStatus.PENDING].includes(
        approve0Status,
      ) ||
      [AddLiquidityApproveStatus.LOADING, AddLiquidityApproveStatus.PENDING].includes(
        approve1Status,
      ) ||
      [AddLiquidityApproveStatus.LOADING, AddLiquidityApproveStatus.PENDING].includes(
        deposite0Status,
      ) ||
      [AddLiquidityApproveStatus.LOADING, AddLiquidityApproveStatus.PENDING].includes(
        deposite1Status,
      )
    ) {
      return (
        <>
          <LiquidityStatusNotifier
            text={t("approve_liquidity_progress")}
            buttonText={t("details")}
            onClick={() => {
              setIsOpen(true);
            }}
          />
          <Button variant={ButtonVariant.CONTAINED} fullWidth isLoading={true}>
            {t(APPROVE_BUTTON_TEXT[approveTransactionsType] as any)}
            <span className="flex items-center gap-2">
              <Preloader size={20} color="black" type="circular" />
            </span>
          </Button>
        </>
      );
    }

    return (
      <Button
        variant={ButtonVariant.CONTAINED}
        fullWidth
        onClick={() => {
          setStatus(AddLiquidityStatus.INITIAL);
          setApprove0Status(0);
          setApprove0Hash(undefined);
          setApprove1Status(0);
          setDeposite0Status(0);
          setDeposite1Status(0);
          setApprove1Hash(undefined);
          setDeposite0Hash(undefined);
          setDeposite1Hash(undefined);
          setIsOpen(true);
        }}
      >
        {t(APPROVE_BUTTON_TEXT[approveTransactionsType] as any)}
      </Button>
    );
  }

  if ([AddLiquidityStatus.MINT_LOADING, AddLiquidityStatus.MINT_PENDING].includes(status)) {
    return (
      <>
        <LiquidityStatusNotifier
          text={increase ? t("increase_liquidity_progress") : t("mint_liquidity_progress")}
          buttonText={t("details")}
          onClick={() => {
            setIsOpen(true);
          }}
        />
        <Button variant={ButtonVariant.CONTAINED} fullWidth isLoading={true}>
          {increase
            ? t("add_liquidity_title")
            : noLiquidity
              ? t("create_pool_mint")
              : t("mint_liquidity")}
          <span className="flex items-center gap-2">
            <Preloader size={20} color="black" type="circular" />
          </span>
        </Button>
      </>
    );
  }

  return (
    <Button
      variant={ButtonVariant.CONTAINED}
      fullWidth
      onClick={() => {
        setStatus(AddLiquidityStatus.MINT);
        setIsOpen(true);
      }}
    >
      {increase
        ? t("add_liquidity_title")
        : noLiquidity
          ? t("create_pool_mint")
          : t("mint_liquidity")}
    </Button>
  );
};
