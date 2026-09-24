import { useCallback, useMemo } from "react";
import { Address, getAbiItem, parseEventLogs, parseUnits } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

import { useCreateMarginPositionConfigStore } from "@/app/[locale]/margin-trading/lending-order/[id]/borrow/stores/useCreateMarginPositionConfigStore";
import {
  CreateMarginPositionStatus,
  useCreateMarginPositionStatusStore,
} from "@/app/[locale]/margin-trading/lending-order/[id]/borrow/stores/useCreateMarginPositionStatusStore";
import { useNewlyCreatedPositionId } from "@/app/[locale]/margin-trading/lending-order/[id]/borrow/stores/useNewlyCreatedPositionId";
import {
  getApproveTextMap,
  getTransferTextMap,
} from "@/app/[locale]/margin-trading/lending-order/[id]/helpers/getStepTexts";
import { LendingOrder } from "@/app/[locale]/margin-trading/types";
import { OperationStepStatus } from "@/components/common/OperationStepRow";
import { ERC223_ABI } from "@/config/abis/erc223";
import { MARGIN_MODULE_ABI } from "@/config/abis/marginModule";
import { isMarginDeployed } from "@/config/modules";
import { IconName } from "@/config/types/IconName";
import { getTransactionWithRetries } from "@/functions/getTransactionWithRetries";
import { useStoreAllowance } from "@/hooks/useAllowance";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { MARGIN_TRADING_ADDRESS } from "@/sdk_bi/addresses";
import { DexChainId } from "@/sdk_bi/chains";
import { Currency } from "@/sdk_bi/entities/currency";
import { getTokenAddressForStandard, Standard } from "@/sdk_bi/standard";
import {
  GasFeeModel,
  RecentTransactionTitleTemplate,
  stringifyObject,
  useRecentTransactionsStore,
} from "@/stores/useRecentTransactionsStore";

type StepTextMap = {
  [key in OperationStepStatus]: string;
};

type OperationStepConfig = {
  iconName: IconName;
  textMap: StepTextMap;
  pending: CreateMarginPositionStatus;
  loading: CreateMarginPositionStatus;
  error: CreateMarginPositionStatus;
};

type ApproveStepConfig = OperationStepConfig & {
  amount: bigint;
  token: Currency;
};

export function useCreatePositionApproveSteps(order: LendingOrder): {
  approveSteps: ApproveStepConfig[];
  allSteps: (OperationStepConfig | ApproveStepConfig)[];
} {
  const { values } = useCreateMarginPositionConfigStore();

  const approveSteps: ApproveStepConfig[] = useMemo(() => {
    if (!values.collateralToken) {
      return [];
    }

    if (values.collateralTokenStandard === Standard.ERC223) {
      return [
        {
          iconName: "transfer-to-contract" as IconName,
          pending: CreateMarginPositionStatus.PENDING_TRANSFER,
          loading: CreateMarginPositionStatus.LOADING_TRANSFER,
          error: CreateMarginPositionStatus.ERROR_TRANSFER,
          textMap: getTransferTextMap(values.collateralToken.symbol!),
          amount: parseUnits(
            values.collateralAmount.toString(),
            values.collateralToken?.decimals ?? 18,
          ),
          token: values.collateralToken,
        },
        {
          iconName: "done" as IconName,
          pending: CreateMarginPositionStatus.PENDING_APPROVE_LIQUIDATION_FEE,
          loading: CreateMarginPositionStatus.LOADING_APPROVE_LIQUIDATION_FEE,
          error: CreateMarginPositionStatus.ERROR_APPROVE_LIQUIDATION_FEE,
          textMap: getApproveTextMap(order.liquidationRewardAsset.symbol!),
          amount: order.liquidationRewardAmount.value,
          token: order.liquidationRewardAsset,
        },
      ];
    }
    if (order.liquidationRewardAsset.equals(values.collateralToken)) {
      return [
        {
          iconName: "done" as IconName,
          pending: CreateMarginPositionStatus.PENDING_APPROVE_BORROW,
          loading: CreateMarginPositionStatus.LOADING_APPROVE_BORROW,
          error: CreateMarginPositionStatus.ERROR_APPROVE_BORROW,
          textMap: getApproveTextMap(order.liquidationRewardAsset.symbol!),
          amount:
            order.liquidationRewardAmount.value +
            parseUnits(values.collateralAmount.toString(), values.collateralToken?.decimals ?? 18),
          token: values.collateralToken,
        },
      ];
    }

    return [
      {
        iconName: "done" as IconName,
        pending: CreateMarginPositionStatus.PENDING_APPROVE_BORROW,
        loading: CreateMarginPositionStatus.LOADING_APPROVE_BORROW,
        error: CreateMarginPositionStatus.ERROR_APPROVE_BORROW,
        textMap: getApproveTextMap(values.collateralToken.symbol!),
        amount: parseUnits(
          values.collateralAmount.toString(),
          values.collateralToken?.decimals ?? 18,
        ),
        token: values.collateralToken,
      },
      {
        iconName: "done" as IconName,
        pending: CreateMarginPositionStatus.PENDING_APPROVE_LIQUIDATION_FEE,
        loading: CreateMarginPositionStatus.LOADING_APPROVE_LIQUIDATION_FEE,
        error: CreateMarginPositionStatus.ERROR_APPROVE_LIQUIDATION_FEE,
        textMap: getApproveTextMap(order.liquidationRewardAsset.symbol!),
        amount: order.liquidationRewardAmount.value,
        token: order.liquidationRewardAsset,
      },
    ];
  }, [
    order.liquidationRewardAmount.value,
    order.liquidationRewardAsset,
    values.collateralAmount,
    values.collateralToken,
    values.collateralTokenStandard,
  ]);

  const borrowStep: OperationStepConfig = {
    iconName: "borrow",
    pending: CreateMarginPositionStatus.PENDING_BORROW,
    loading: CreateMarginPositionStatus.LOADING_BORROW,
    error: CreateMarginPositionStatus.ERROR_BORROW,
    textMap: {
      [OperationStepStatus.IDLE]: "Borrow",
      [OperationStepStatus.AWAITING_SIGNATURE]: "Borrow",
      [OperationStepStatus.LOADING]: "Borrowing",
      [OperationStepStatus.STEP_COMPLETED]: "Successfully borrowed",
      [OperationStepStatus.STEP_FAILED]: "Borrow failed",
      [OperationStepStatus.OPERATION_COMPLETED]: "Successfully borrowed",
    },
  };

  return { allSteps: [...approveSteps, borrowStep], approveSteps };
}

export default function useCreateMarginPosition(order: LendingOrder) {
  const {
    setStatus,
    setBorrowHash,
    setApproveBorrowHash,
    setApproveLiquidationFeeHash,
    setTransferHash,
  } = useCreateMarginPositionStatusStore();

  const { addRecentTransaction } = useRecentTransactionsStore();
  const { values } = useCreateMarginPositionConfigStore();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const chainId = useCurrentChainId();
  const { address } = useAccount();
  const { setPositionId } = useNewlyCreatedPositionId();

  const isEqualFeeAndCollateralAssets = useMemo(() => {
    return (
      values.collateralToken?.equals(order.liquidationRewardAsset) &&
      values.collateralTokenStandard === Standard.ERC20
    );
  }, [order.liquidationRewardAsset, values.collateralToken, values.collateralTokenStandard]);
  // const { approveSteps } = useCreatePositionApproveSteps(order);

  const { isAllowed: isAllowedA, writeTokenApprove: approveA } = useStoreAllowance({
    token: values.collateralToken,
    contractAddress: MARGIN_TRADING_ADDRESS[chainId],
    amountToCheck: isEqualFeeAndCollateralAssets // we check here if we will only need one approval for collateral and liquidation
      ? order.liquidationRewardAmount.value +
        parseUnits(values.collateralAmount.toString(), values.collateralToken?.decimals ?? 18)
      : parseUnits(values.collateralAmount.toString(), values.collateralToken?.decimals ?? 18),
  });

  const { isAllowed: isAllowedB, writeTokenApprove: approveB } = useStoreAllowance({
    token: isEqualFeeAndCollateralAssets ? undefined : order.liquidationRewardAsset, // set token to undefined so hook won't run when tokens are equal. Approval will be handled by upper hook
    contractAddress: MARGIN_TRADING_ADDRESS[chainId],
    amountToCheck: order.liquidationRewardAmount.value,
  });

  const handleCreateMarginPosition = useCallback(
    async (orderId: string, amountToApprove: string, feeAmountToApprove: string) => {
      // Never build a transaction against the zero address on chains without a margin deployment.
      if (!isMarginDeployed(chainId)) {
        return;
      }

      if (
        !values.collateralAmount ||
        !values.collateralToken ||
        !walletClient ||
        !publicClient ||
        !address
      ) {
        return;
      }

      if (
        !values.collateralToken?.isNative &&
        !isAllowedA &&
        values.collateralTokenStandard === Standard.ERC20
      ) {
        setStatus(CreateMarginPositionStatus.PENDING_APPROVE_BORROW);

        const approveResult = await approveA({
          customAmount: parseUnits(amountToApprove, values.collateralToken?.decimals ?? 18),
          // customGasSettings: gasSettings,
        });

        if (!approveResult?.success) {
          setStatus(CreateMarginPositionStatus.ERROR_APPROVE_BORROW);
          return;
        }
        setApproveBorrowHash(approveResult.hash);

        setStatus(CreateMarginPositionStatus.LOADING_APPROVE_BORROW);

        const approveReceipt = await publicClient.waitForTransactionReceipt({
          hash: approveResult.hash,
        });

        if (approveReceipt.status !== "success") {
          setStatus(CreateMarginPositionStatus.ERROR_APPROVE_BORROW);
          return;
        }
      }

      if (
        !values.collateralToken?.isNative &&
        !isAllowedA &&
        values.collateralTokenStandard === Standard.ERC223
      ) {
        setStatus(CreateMarginPositionStatus.PENDING_TRANSFER);
        const _params = {
          account: address as Address,
          abi: ERC223_ABI,
          functionName: "transfer" as const,
          address: values.collateralToken.wrapped.address1 as Address,
          args: [
            MARGIN_TRADING_ADDRESS[chainId as DexChainId],
            parseUnits(values.collateralAmount, values.collateralToken.decimals ?? 18),
          ] as const,
        };

        const _firstDepositHash = await walletClient.writeContract({
          ..._params,
          account: undefined,
        });
        setStatus(CreateMarginPositionStatus.LOADING_TRANSFER);
        setTransferHash(_firstDepositHash);

        const transaction = await getTransactionWithRetries({
          hash: _firstDepositHash,
          publicClient,
        });

        const nonce = transaction.nonce;

        // addRecentTransaction(
        //   {
        //     hash: _firstDepositHash,
        //     nonce,
        //     chainId,
        //     gas: {
        //       model: GasFeeModel.EIP1559,
        //       gas: "0",
        //       maxFeePerGas: undefined,
        //       maxPriorityFeePerGas: undefined,
        //     },
        //     params: {
        //       ...stringifyObject(_params),
        //       abi: [getAbiItem({ name: "transfer", abi: ERC223_ABI })],
        //     },
        //     title: {
        //       symbol: values.collateralToken?.symbol!,
        //       template: RecentTransactionTitleTemplate.TRANSFER,
        //       amount: a,
        //       logoURI: currency?.logoURI || "/images/tokens/placeholder.svg",
        //     },
        //   },
        //   address,
        // );

        const receipt = await publicClient.waitForTransactionReceipt({ hash: _firstDepositHash });

        if (receipt.status !== "success") {
          setStatus(CreateMarginPositionStatus.ERROR_TRANSFER);
          return;
        }
      }

      if (
        (!order.liquidationRewardAsset?.isNative &&
          !isAllowedB &&
          !values.collateralToken?.equals(order.liquidationRewardAsset)) ||
        values.collateralTokenStandard === Standard.ERC223
      ) {
        setStatus(CreateMarginPositionStatus.PENDING_APPROVE_LIQUIDATION_FEE);

        const approveResult = await approveB({
          customAmount: parseUnits(feeAmountToApprove, order.liquidationRewardAsset.decimals),
          // customGasSettings: gasSettings,
        });

        if (!approveResult?.success) {
          setStatus(CreateMarginPositionStatus.ERROR_APPROVE_LIQUIDATION_FEE);
          return;
        }

        setStatus(CreateMarginPositionStatus.LOADING_APPROVE_LIQUIDATION_FEE);

        const approveReceipt = await publicClient.waitForTransactionReceipt({
          hash: approveResult.hash,
        });

        setApproveLiquidationFeeHash(approveResult.hash);

        if (approveReceipt.status !== "success") {
          setStatus(CreateMarginPositionStatus.ERROR_APPROVE_LIQUIDATION_FEE);
          return;
        }
      }

      setStatus(CreateMarginPositionStatus.PENDING_BORROW);

      const params = {
        abi: MARGIN_MODULE_ABI,
        address: MARGIN_TRADING_ADDRESS[chainId],
        functionName: "takeLoan" as const,
        args: [
          BigInt(orderId),
          parseUnits(values.borrowAmount.toString(), order.baseAsset.decimals),
          BigInt(
            order.collateralAddresses.findIndex(
              (address) =>
                getTokenAddressForStandard(
                  values.collateralToken!,
                  values.collateralTokenStandard,
                ).toLowerCase() === address.toLowerCase(),
            ),
          ),
          parseUnits(values.collateralAmount.toString(), values.collateralToken?.decimals ?? 18),
        ] as const,
      };
      const takeLoanHash = await walletClient.writeContract({
        ...params,
        account: undefined,
      });

      setBorrowHash(takeLoanHash);

      const transaction = await getTransactionWithRetries({
        hash: takeLoanHash,
        publicClient,
      });

      const nonce = transaction.nonce;

      addRecentTransaction(
        {
          hash: takeLoanHash,
          nonce,
          chainId,
          gas: {
            model: GasFeeModel.EIP1559,
            gas: "0",
            maxFeePerGas: undefined,
            maxPriorityFeePerGas: undefined,
          },
          params: {
            ...stringifyObject(params),
            abi: [getAbiItem({ name: "takeLoan", abi: MARGIN_MODULE_ABI })],
          },
          title: {
            symbolBorrowed: order.baseAsset.symbol!,
            symbolFee: order.liquidationRewardAsset.symbol!,
            symbolCollateral: values.collateralToken!.symbol!,
            amountBorrowed: values.borrowAmount,
            amountFee: order.liquidationRewardAmount.formatted,
            amountCollateral: values.collateralAmount,
            template: RecentTransactionTitleTemplate.CREATE_MARGIN_POSITION,
            logoURI: order.baseAsset?.logoURI || "/images/tokens/placeholder.svg",
          },
        },
        address,
      );

      setStatus(CreateMarginPositionStatus.LOADING_BORROW);
      const takeLoanReceipt = await publicClient.waitForTransactionReceipt({ hash: takeLoanHash });

      const parsedEventLog = parseEventLogs({
        abi: MARGIN_MODULE_ABI,
        logs: takeLoanReceipt.logs,
      });

      const createPositionLog = parsedEventLog.find((log) => log.eventName === "PositionOpened");

      if (createPositionLog) {
        setPositionId(Number(createPositionLog.args.positionId));
      }

      if (takeLoanReceipt.status === "success") {
        setStatus(CreateMarginPositionStatus.SUCCESS);
      } else {
        setStatus(CreateMarginPositionStatus.ERROR_BORROW);
      }
    },
    [
      values,
      walletClient,
      publicClient,
      address,
      isAllowedA,
      order.liquidationRewardAsset,
      order.baseAsset.decimals,
      order.baseAsset.symbol,
      order.baseAsset?.logoURI,
      order.collateralAddresses,
      order.liquidationRewardAmount.formatted,
      isAllowedB,
      setStatus,
      chainId,
      setBorrowHash,
      addRecentTransaction,
      approveA,
      setApproveBorrowHash,
      setTransferHash,
      approveB,
      setApproveLiquidationFeeHash,
      setPositionId,
    ],
  );

  return { handleCreateMarginPosition };
}
