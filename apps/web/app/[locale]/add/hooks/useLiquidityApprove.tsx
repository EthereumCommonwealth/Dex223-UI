import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { Address } from "viem";
import { usePublicClient } from "wagmi";

import { useStoreAllowance } from "@/hooks/useAllowance";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { useStoreDeposit } from "@/hooks/useDeposit";
// import useDetectMetaMaskMobile from "@/hooks/useMetamaskMobile";
import { NONFUNGIBLE_POSITION_MANAGER_ADDRESS } from "@/sdk_hybrid/addresses";
import { DexChainId } from "@/sdk_hybrid/chains";
import { Currency } from "@/sdk_hybrid/entities/currency";
import { Standard } from "@/sdk_hybrid/standard";
import { useConfirmInWalletAlertStore } from "@/stores/useConfirmInWalletAlertStore";

import { Field, useTokensStandards } from "../stores/useAddLiquidityAmountsStore";
import { useAddLiquidityGasSettings } from "../stores/useAddLiquidityGasSettings";
import {
  AddLiquidityApproveStatus,
  useAddLiquidityStatusStore,
} from "../stores/useAddLiquidityStatusStore";
import { useAddLiquidityTokensStore } from "../stores/useAddLiquidityTokensStore";
import { useLiquidityTierStore } from "../stores/useLiquidityTierStore";
import { usePriceRange } from "./usePrice";
import { useV3DerivedMintInfo } from "./useV3DerivedMintInfo";

export type ApproveTransaction = {
  token: Currency;
  amount: bigint;
  isAllowed: boolean;
  status: AddLiquidityApproveStatus;
  estimatedGas: bigint | null;
  hash?: Address;
};

export enum ApproveTransactionType {
  "ERC20",
  "ERC223",
  "ERC20_AND_ERC223",
}

export const useLiquidityApprove = () => {
  // const isMetamaskMobile = useDetectMetaMaskMobile();

  const { gasSettings } = useAddLiquidityGasSettings(); // not used:  , gasModel, customGasLimit
  const {
    approve0Status,
    approve1Status,
    deposite0Status,
    deposite1Status,
    approve0Hash,
    approve1Hash,
    deposite0Hash,
    deposite1Hash,
    setApprove0Status,
    setApprove1Status,
    setDeposite0Status,
    setDeposite1Status,
    setApprove0Hash,
    setApprove1Hash,
    setDeposite0Hash,
    setDeposite1Hash,
  } = useAddLiquidityStatusStore();

  const chainId = useCurrentChainId();
  const { tokenA, tokenB } = useAddLiquidityTokensStore();
  const { price } = usePriceRange();

  const { tier } = useLiquidityTierStore();

  const { tokenAStandard, tokenBStandard } = useTokensStandards();
  const { parsedAmounts } = useV3DerivedMintInfo({
    tokenA,
    tokenB,
    tier,
    price,
  });

  const amountToCheckA = parsedAmounts[Field.CURRENCY_A]
    ? BigInt(parsedAmounts[Field.CURRENCY_A].quotient.toString())
    : BigInt(0);
  const amountToCheckB = parsedAmounts[Field.CURRENCY_B]
    ? BigInt(parsedAmounts[Field.CURRENCY_B].quotient.toString())
    : BigInt(0);

  const {
    isAllowed: isAllowedA,
    writeTokenApprove: approveA,
    currentAllowance: currentAllowanceA,
    estimatedGas: estimatedGasAllowanceA,
    updateAllowance: updateAllowanceA,
  } = useStoreAllowance({
    token: tokenA,
    contractAddress: NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId as DexChainId],
    amountToCheck: amountToCheckA,
  });

  const {
    isAllowed: isAllowedB,
    writeTokenApprove: approveB,
    currentAllowance: currentAllowanceB,
    estimatedGas: estimatedGasAllowanceB,
    updateAllowance: updateAllowanceB,
  } = useStoreAllowance({
    token: tokenB,
    contractAddress: NONFUNGIBLE_POSITION_MANAGER_ADDRESS[chainId as DexChainId],
    amountToCheck: amountToCheckB,
  });

  const {
    isDeposited: isDepositedA,
    writeTokenDeposit: depositA,
    currentDeposit: currentDepositA,
    estimatedGas: estimatedGasDepositA,
    updateDeposite: updateDepositeA,
  } = useStoreDeposit({
    token: tokenA,
    amountToCheck: amountToCheckA,
  });
  const {
    isDeposited: isDepositedB,
    writeTokenDeposit: depositB,
    currentDeposit: currentDepositB,
    estimatedGas: estimatedGasDepositB,
    updateDeposite: updateDepositeB,
  } = useStoreDeposit({
    token: tokenB,
    amountToCheck: amountToCheckB,
  });

  const approveTransactions = useMemo(() => {
    let approveA = undefined as undefined | ApproveTransaction;
    let approveB = undefined as undefined | ApproveTransaction;
    let depositA = undefined as undefined | ApproveTransaction;
    let depositB = undefined as undefined | ApproveTransaction;
    if (tokenA && tokenA.isToken && tokenAStandard && amountToCheckA) {
      if (tokenAStandard === Standard.ERC20) {
        approveA = {
          token: tokenA,
          amount: amountToCheckA,
          isAllowed: isAllowedA,
          status: approve0Status,
          estimatedGas: estimatedGasAllowanceA,
          hash: approve0Hash,
        };
      } else if (tokenAStandard === Standard.ERC223) {
        depositA = {
          token: tokenA,
          amount: amountToCheckA,
          isAllowed: isDepositedA,
          status: deposite0Status,
          estimatedGas: estimatedGasDepositA,
          hash: deposite0Hash,
        };
      }
    }
    if (tokenB && tokenB.isToken && tokenBStandard && amountToCheckB) {
      if (tokenBStandard === Standard.ERC20) {
        approveB = {
          token: tokenB,
          amount: amountToCheckB,
          isAllowed: isAllowedB,
          status: approve1Status,
          estimatedGas: estimatedGasAllowanceB,
          hash: approve1Hash,
        };
      } else if (tokenBStandard === Standard.ERC223) {
        depositB = {
          token: tokenB,
          amount: amountToCheckB,
          isAllowed: isDepositedB,
          status: deposite1Status,
          estimatedGas: estimatedGasDepositB,
          hash: deposite1Hash,
        };
      }
    }

    return {
      approveA,
      approveB,
      depositA,
      depositB,
    };
  }, [
    tokenA,
    tokenB,
    tokenAStandard,
    tokenBStandard,
    amountToCheckA,
    amountToCheckB,
    estimatedGasAllowanceA,
    estimatedGasAllowanceB,
    isAllowedA,
    isAllowedB,
    estimatedGasDepositA,
    estimatedGasDepositB,
    isDepositedA,
    isDepositedB,
    approve0Status,
    approve1Status,
    approve0Hash,
    approve1Hash,
    deposite0Status,
    deposite1Status,
    deposite0Hash,
    deposite1Hash,
  ]);

  const t = useTranslations("Swap");
  const publicClient = usePublicClient();
  const { openConfirmInWalletAlert, closeConfirmInWalletAlert } = useConfirmInWalletAlertStore();

  const handleApprove0 = useCallback(
    async ({
      customAmountA,
      customAmountB,
    }: {
      customAmountA?: bigint;
      customAmountB?: bigint;
    }) => {
      const amountA = customAmountA || amountToCheckA;

      if (!publicClient) {
        return;
      }

      if (approve0Status !== AddLiquidityApproveStatus.SUCCESS) {
        if (
          tokenA?.isToken &&
          tokenAStandard === Standard.ERC20 &&
          (currentAllowanceA || BigInt(0)) < amountA
        ) {
          openConfirmInWalletAlert(t("confirm_action_in_your_wallet_alert"));

          setApprove0Status(AddLiquidityApproveStatus.PENDING);
          const result = await approveA({
            customAmount: customAmountA,
            customGasSettings: gasSettings,
          });
          if (!result?.success) {
            setApprove0Status(AddLiquidityApproveStatus.ERROR);
            closeConfirmInWalletAlert();
          } else {
            setApprove0Hash(result.hash);
            setApprove0Status(AddLiquidityApproveStatus.LOADING);
            closeConfirmInWalletAlert();

            const approveReceipt = await publicClient.waitForTransactionReceipt({
              hash: result.hash,
            });

            if (approveReceipt.status === "reverted") {
              setApprove0Status(AddLiquidityApproveStatus.ERROR);
            } else {
              setApprove0Status(AddLiquidityApproveStatus.SUCCESS);
            }
          }
        } else if (
          tokenA?.isToken &&
          tokenAStandard === Standard.ERC223 &&
          (currentDepositA || BigInt(0)) < amountA
        ) {
          openConfirmInWalletAlert(t("confirm_action_in_your_wallet_alert"));

          setDeposite0Status(AddLiquidityApproveStatus.PENDING);
          const result = await depositA({
            customAmount: customAmountA,
            customGasSettings: gasSettings,
          });
          if (!result?.success) {
            setDeposite0Status(AddLiquidityApproveStatus.ERROR);
            closeConfirmInWalletAlert();
          } else {
            setDeposite0Hash(result.hash);
            setDeposite0Status(AddLiquidityApproveStatus.LOADING);
            closeConfirmInWalletAlert();

            const depositeReceipt = await publicClient.waitForTransactionReceipt({
              hash: result.hash,
            });

            if (depositeReceipt.status === "reverted") {
              setDeposite0Status(AddLiquidityApproveStatus.ERROR);
            } else {
              setDeposite0Status(AddLiquidityApproveStatus.SUCCESS);
            }
          }
        }
      }

      if (customAmountB || amountToCheckB) {
        await handleApprove1({ customAmountB });
      }
    },
    [
      amountToCheckA,
      publicClient,
      approve0Status,
      amountToCheckB,
      tokenA?.isToken,
      tokenAStandard,
      currentAllowanceA,
      currentDepositA,
      openConfirmInWalletAlert,
      t,
      setApprove0Status,
      approveA,
      gasSettings,
      closeConfirmInWalletAlert,
      setApprove0Hash,
      setDeposite0Status,
      depositA,
      setDeposite0Hash,
    ],
  );
  const handleApprove1 = useCallback(
    async ({ customAmountB }: { customAmountB?: bigint }) => {
      const amountB = customAmountB || amountToCheckB;

      if (!publicClient) {
        return;
      }

      if (
        ![AddLiquidityApproveStatus.SUCCESS, AddLiquidityApproveStatus.LOADING].includes(
          approve1Status,
        )
      ) {
        if (
          tokenB?.isToken &&
          tokenBStandard === Standard.ERC20 &&
          (currentAllowanceB || BigInt(0)) < amountB
        ) {
          openConfirmInWalletAlert(t("confirm_action_in_your_wallet_alert"));

          setApprove1Status(AddLiquidityApproveStatus.PENDING);
          const result = await approveB({
            customAmount: customAmountB,
            customGasSettings: gasSettings,
          });

          if (!result?.success) {
            setApprove1Status(AddLiquidityApproveStatus.ERROR);
            closeConfirmInWalletAlert();
            // return;
          } else {
            setApprove1Hash(result.hash);
            setApprove1Status(AddLiquidityApproveStatus.LOADING);
            closeConfirmInWalletAlert();

            const approveReceipt = await publicClient.waitForTransactionReceipt({
              hash: result.hash,
            });

            if (approveReceipt.status === "reverted") {
              setApprove1Status(AddLiquidityApproveStatus.ERROR);
              // return;
            } else {
              setApprove1Status(AddLiquidityApproveStatus.SUCCESS);
            }
          }
        } else if (
          tokenB?.isToken &&
          tokenBStandard === Standard.ERC223 &&
          (currentDepositB || BigInt(0)) < amountB
        ) {
          openConfirmInWalletAlert(t("confirm_action_in_your_wallet_alert"));

          setDeposite1Status(AddLiquidityApproveStatus.PENDING);
          const result = await depositB({
            customAmount: customAmountB,
            customGasSettings: gasSettings,
          });
          if (!result?.success) {
            setDeposite1Status(AddLiquidityApproveStatus.ERROR);
            closeConfirmInWalletAlert();
          } else {
            setDeposite1Hash(result.hash);
            setDeposite1Status(AddLiquidityApproveStatus.LOADING);
            closeConfirmInWalletAlert();

            const depositeReceipt = await publicClient.waitForTransactionReceipt({
              hash: result.hash,
            });

            if (depositeReceipt.status === "reverted") {
              setDeposite1Status(AddLiquidityApproveStatus.ERROR);
            } else {
              setDeposite1Status(AddLiquidityApproveStatus.SUCCESS);
            }
          }
        }
      }
    },
    [
      amountToCheckB,
      publicClient,
      approve1Status,
      tokenB?.isToken,
      tokenBStandard,
      currentAllowanceB,
      currentDepositB,
      openConfirmInWalletAlert,
      t,
      setApprove1Status,
      approveB,
      gasSettings,
      closeConfirmInWalletAlert,
      setApprove1Hash,
      setDeposite1Status,
      depositB,
      setDeposite1Hash,
    ],
  );

  const handleApprove = useCallback(
    async ({
      customAmountA,
      customAmountB,
    }: {
      customAmountA?: bigint;
      customAmountB?: bigint;
    }) => {
      // NOTE perform approves in query on ANY wallet (most wallets can process only ONE request at a time)
      // if (isMetamaskMobile) {
      await handleApprove0({ customAmountA, customAmountB });
      // } else {
      //   await Promise.all([handleApprove0({ customAmountA }), handleApprove1({ customAmountB })]);
      // }
    },
    [handleApprove0],
  );

  const updateAllowance = useCallback(async () => {
    await Promise.all([
      updateAllowanceA(),
      updateAllowanceB(),
      updateDepositeA(),
      updateDepositeB(),
    ]);
  }, [updateAllowanceA, updateAllowanceB, updateDepositeA, updateDepositeB]);

  const approveTransactionsType = useMemo(() => {
    const isERC20Transaction = approveTransactions.approveA || approveTransactions.approveB;
    const isERC223Transaction = approveTransactions.depositA || approveTransactions.depositB;
    if (isERC20Transaction && isERC223Transaction) {
      return ApproveTransactionType.ERC20_AND_ERC223;
    } else if (isERC20Transaction) {
      return ApproveTransactionType.ERC20;
    } else {
      return ApproveTransactionType.ERC223;
    }
  }, [approveTransactions]);

  const { approveTransactionsCount, approveTotalGasLimit } = useMemo(() => {
    const approveTransactionsArray = Object.values(approveTransactions).filter(
      (t) => !!t && !t.isAllowed,
    ) as ApproveTransaction[];

    const transactionsCount = approveTransactionsArray.length;
    const totalGasLimit = approveTransactionsArray.reduce((acc, { estimatedGas }) => {
      return estimatedGas ? acc + estimatedGas : acc;
    }, BigInt(0));

    return { approveTransactionsCount: transactionsCount, approveTotalGasLimit: totalGasLimit };
  }, [approveTransactions]);

  return {
    approveTransactions,
    approveTransactionsCount,
    handleApprove,
    approveTransactionsType,
    approveTotalGasLimit,
    updateAllowance,
    currentDepositA,
    currentDepositB,
  };
};
