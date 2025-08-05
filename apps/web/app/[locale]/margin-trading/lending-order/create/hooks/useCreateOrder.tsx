import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo } from "react";
import {
  Address,
  encodeAbiParameters,
  encodeFunctionData,
  getAbiItem,
  Hash,
  keccak256,
  parseEventLogs,
  parseUnits,
} from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

import { TradingTokensInputMode } from "@/app/[locale]/margin-trading/lending-order/create/steps/types";
import { useCreateOrderConfigStore } from "@/app/[locale]/margin-trading/lending-order/create/stores/useCreateOrderConfigStore";
import {
  CreateOrderStatus,
  useCreateOrderStatusStore,
} from "@/app/[locale]/margin-trading/lending-order/create/stores/useCreateOrderStatusStore";
import {
  useCreateOrderGasLimitStore,
  useCreateOrderGasPriceStore,
} from "@/app/[locale]/margin-trading/lending-order/create/stores/useSwapGasSettingsStore";
import { ERC223_ABI } from "@/config/abis/erc223";
import { MARGIN_MODULE_ABI } from "@/config/abis/marginModule";
import { getGasSettings } from "@/functions/gasSettings";
import { getTransactionWithRetries } from "@/functions/getTransactionWithRetries";
import { useStoreAllowance } from "@/hooks/useAllowance";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { useFees } from "@/hooks/useFees";
import addToast from "@/other/toast";
import { MARGIN_TRADING_ADDRESS, ORACLE_ADDRESS } from "@/sdk_bi/addresses";
import { DexChainId } from "@/sdk_bi/chains";
import { getTokenAddressForStandard, Standard } from "@/sdk_bi/standard";
import {
  GasFeeModel,
  RecentTransactionTitleTemplate,
  stringifyObject,
  useRecentTransactionsStore,
} from "@/stores/useRecentTransactionsStore";

export function useCreateOrderParams() {
  const { firstStepValues, secondStepValues, thirdStepValues } = useCreateOrderConfigStore();

  return {
    ...firstStepValues,
    ...secondStepValues,
    ...thirdStepValues,
  };
}

export function sortAddresses(addresses: string[]): string[] {
  return addresses.sort((a, b) => (a.toLowerCase() > b.toLowerCase() ? 1 : -1));
}

export function getWhitelistId(addresses: Address[], isContract: boolean): Hash {
  const encoded = encodeAbiParameters(
    [
      { type: "bool", name: "isContract" },
      { type: "address[]", name: "tokens" },
    ],
    [isContract, addresses],
  );

  return keccak256(encoded);
}

/**
 * Calculate the on‐chain interestRate parameter.
 *
 * The contract expects:
 *   – interestRate = (30-day rate × 100) prorated to position duration
 *   – e.g. 11.5% for 30 days ⇒ 1150, half that for 15 days ⇒ 575
 *
 * @param monthlyPct    30-day interest rate in percent (e.g. 11.5 for 11.5%)
 * @param durationDays  Actual position length in days
 * @returns             Integer interestRate for your contract
 */
export function calculateInterestRate(monthlyPct: number, durationDays: number): bigint {
  // Convert 30-day % to “percent × 100”
  return BigInt(monthlyPct * 100);
  // Prorate by (durationDays / 30)
  // const prorated = (baseRate * durationDays) / 30;
  // // Round down to an integer (solidity uint)
  // return BigInt(Math.floor(prorated));
}

export default function useCreateOrder() {
  const t = useTranslations("Swap");
  const { data: walletClient } = useWalletClient();
  const params = useCreateOrderParams();
  const publicClient = usePublicClient();
  const chainId = useCurrentChainId();

  const {
    setStatus,
    setApproveHash,
    setDepositHash,
    setCreateOrderHash,
    setTransferHash,
    setErrorType,
  } = useCreateOrderStatusStore();

  const {
    isAllowed: isAllowedA,
    writeTokenApprove: approveA,
    updateAllowance,
  } = useStoreAllowance({
    token: params.loanToken,
    contractAddress: MARGIN_TRADING_ADDRESS[chainId],
    amountToCheck: parseUnits(params.loanAmount, params.loanToken?.decimals ?? 18),
  });

  const { address } = useAccount();
  const { customGasLimit } = useCreateOrderGasLimitStore();
  const { gasPriceOption, gasPriceSettings } = useCreateOrderGasPriceStore();
  const { baseFee, priorityFee, gasPrice } = useFees();
  const {
    tradingTokens,
    loanToken,
    loanTokenStandard,
    collateralTokens,
    loanAmount,
    includeERC223Collateral,
    liquidationFeeToken,
    liquidationFeeForLiquidator,
    liquidationFeeForLender,
    liquidationMode,
    minimumBorrowingAmount,
    orderCurrencyLimit,
    period,
    interestRatePerMonth,
    leverage,
    priceSource,
  } = useCreateOrderParams();

  const gasSettings = useMemo(() => {
    return getGasSettings({
      baseFee,
      chainId,
      gasPrice,
      priorityFee,
      gasPriceOption,
      gasPriceSettings,
    });
  }, [baseFee, chainId, gasPrice, priorityFee, gasPriceOption, gasPriceSettings]);

  useEffect(() => {
    setStatus(CreateOrderStatus.INITIAL);
  }, [setStatus]);

  const { addRecentTransaction } = useRecentTransactionsStore();

  const handleCreateOrder = useCallback(
    async (amountToApprove: string) => {
      setStatus(CreateOrderStatus.PENDING_CONFIRM_ORDER);

      if (
        !params.loanToken ||
        !publicClient ||
        !walletClient ||
        !loanToken ||
        !liquidationFeeToken ||
        (tradingTokens.inputMode === TradingTokensInputMode.AUTOLISTING &&
          !tradingTokens.tradingTokensAutoListing) ||
        !address
      ) {
        return;
      }

      const sortedAddresses =
        tradingTokens.inputMode === TradingTokensInputMode.AUTOLISTING
          ? [tradingTokens.tradingTokensAutoListing!.id] // add ! here because we have check upper
          : (sortAddresses(
              tradingTokens.allowedTokens.flatMap((token) =>
                tradingTokens.includeERC223Trading
                  ? [token.wrapped.address0, token.wrapped.address1]
                  : [token.wrapped.address0],
              ),
            ) as Address[]);

      const whitelistId = getWhitelistId(
        sortedAddresses,
        tradingTokens.inputMode === TradingTokensInputMode.AUTOLISTING,
      );

      const encodedAddTokenListParams = encodeFunctionData({
        abi: MARGIN_MODULE_ABI,
        functionName: "addTokenlist",
        args: [sortedAddresses, tradingTokens.inputMode === TradingTokensInputMode.AUTOLISTING],
      });

      const encodedCreateOrderParams = encodeFunctionData({
        abi: MARGIN_MODULE_ABI,
        functionName: "createOrder",
        args: [
          {
            whitelistId: whitelistId,
            interestRate: calculateInterestRate(
              Number(interestRatePerMonth),
              Number(period.positionDuration),
            ),
            duration: BigInt(Number(period.positionDuration) * 24 * 60 * 60), // positionDuration in seconds
            minLoan: parseUnits(minimumBorrowingAmount.toString(), loanToken.decimals),
            liquidationRewardAmount: parseUnits(
              liquidationFeeForLiquidator,
              liquidationFeeToken.decimals,
            ),
            liquidationRewardAsset: liquidationFeeToken.wrapped.address0,
            asset: getTokenAddressForStandard(loanToken, loanTokenStandard),
            deadline: Math.floor(new Date(period.lendingOrderDeadline).getTime() / 1000),
            currencyLimit: Number(orderCurrencyLimit),
            leverage,
            oracle: ORACLE_ADDRESS[chainId],
            collateral: collateralTokens.flatMap((token) => {
              if (includeERC223Collateral) {
                return [token.wrapped.address0, token.wrapped.address1];
              }
              return [token.wrapped.address0];
            }),
          },
        ],
      });

      const multicallParams = {
        abi: MARGIN_MODULE_ABI,
        address: MARGIN_TRADING_ADDRESS[chainId],
        functionName: "multicall",
        args: [[encodedAddTokenListParams, encodedCreateOrderParams]],
      } as const;

      const addTokenListAndCreateOrderHash = await walletClient.writeContract({
        ...multicallParams,
        account: undefined,
      });

      setStatus(CreateOrderStatus.LOADING_CONFIRM_ORDER);
      setCreateOrderHash(addTokenListAndCreateOrderHash);

      const transaction = await getTransactionWithRetries({
        hash: addTokenListAndCreateOrderHash,
        publicClient,
      });

      const nonce = transaction.nonce;

      addRecentTransaction(
        {
          hash: addTokenListAndCreateOrderHash,
          nonce,
          chainId,
          gas: {
            model: GasFeeModel.EIP1559,
            gas: "0",
            maxFeePerGas: undefined,
            maxPriorityFeePerGas: undefined,
          },
          params: {
            ...stringifyObject(multicallParams),
            abi: [getAbiItem({ name: "orderDepositWETH9", abi: MARGIN_MODULE_ABI })],
          },
          title: {
            symbol: params.loanToken.symbol!,
            template: RecentTransactionTitleTemplate.CREATE_LENDING_ORDER,
            logoURI: params.loanToken?.logoURI || "/images/tokens/placeholder.svg",
          },
        },
        address,
      );

      try {
        const createOrderReceipt = await publicClient.waitForTransactionReceipt({
          hash: addTokenListAndCreateOrderHash,
        });

        const parsedEventLog = parseEventLogs({
          abi: MARGIN_MODULE_ABI,
          logs: createOrderReceipt.logs,
        });

        const createOrderLog = parsedEventLog.find((log) => log.eventName === "OrderCreated");

        console.log(createOrderLog);
        if (!createOrderLog) {
          console.log("CREATE ORDER LOG NOT FOUND!");
          return;
        }

        if (params.loanToken.isNative) {
          setStatus(CreateOrderStatus.PENDING_DEPOSIT);

          const nativeParams = {
            abi: MARGIN_MODULE_ABI,
            address: MARGIN_TRADING_ADDRESS[chainId],
            functionName: "orderDepositWETH9" as const,
            args: [
              createOrderLog.args.orderId,
              params.loanTokenStandard === Standard.ERC20
                ? params.loanToken.wrapped.address0
                : params.loanToken.wrapped.address1,
            ] as const,
            value: parseUnits(loanAmount, params.loanToken.decimals ?? 18),
          };

          const depositOrderHash = await walletClient.writeContract({
            ...nativeParams,
            account: undefined,
          });
          setStatus(CreateOrderStatus.LOADING_DEPOSIT);
          setDepositHash(depositOrderHash);

          const transaction = await getTransactionWithRetries({
            hash: depositOrderHash,
            publicClient,
          });

          const nonce = transaction.nonce;

          addRecentTransaction(
            {
              hash: depositOrderHash,
              nonce,
              chainId,
              gas: {
                model: GasFeeModel.EIP1559,
                gas: "0",
                maxFeePerGas: undefined,
                maxPriorityFeePerGas: undefined,
              },
              params: {
                ...stringifyObject(nativeParams),
                abi: [getAbiItem({ name: "orderDepositWETH9", abi: MARGIN_MODULE_ABI })],
              },
              title: {
                symbol: params.loanToken.symbol!,
                template: RecentTransactionTitleTemplate.DEPOSIT,
                amount: params.loanAmount,
                logoURI: params.loanToken?.logoURI || "/images/tokens/placeholder.svg",
              },
            },
            address,
          );
          const receipt = await publicClient.waitForTransactionReceipt({ hash: depositOrderHash });

          if (receipt.status === "success") {
            setStatus(CreateOrderStatus.SUCCESS);
          } else {
            setStatus(CreateOrderStatus.ERROR_DEPOSIT);
          }
        } else {
          console.log(params.loanTokenStandard + "STANDARD!!!");
          if (params.loanTokenStandard === Standard.ERC20) {
            setStatus(CreateOrderStatus.PENDING_APPROVE);
            const approveResult = await approveA({
              customAmount: parseUnits(amountToApprove, params.loanToken.decimals ?? 18),
              // customGasSettings: gasSettings,
            });

            if (!approveResult?.success) {
              setStatus(CreateOrderStatus.ERROR_APPROVE);
              return;
            }

            setStatus(CreateOrderStatus.LOADING_APPROVE);

            const approveReceipt = await publicClient.waitForTransactionReceipt({
              hash: approveResult.hash,
            });

            if (approveReceipt.status !== "success") {
              setStatus(CreateOrderStatus.ERROR_APPROVE);
              return;
            }
          } else {
            setStatus(CreateOrderStatus.PENDING_TRANSFER);
            const _params = {
              account: address as Address,
              abi: ERC223_ABI,
              functionName: "transfer" as const,
              address: params.loanToken.wrapped.address1 as Address,
              args: [
                MARGIN_TRADING_ADDRESS[chainId as DexChainId],
                parseUnits(amountToApprove, params.loanToken.decimals ?? 18),
              ] as const,
            };

            const _firstDepositHash = await walletClient.writeContract({
              ..._params,
              account: undefined,
            });
            setStatus(CreateOrderStatus.LOADING_TRANSFER);
            setTransferHash(_firstDepositHash);

            const transaction = await getTransactionWithRetries({
              hash: _firstDepositHash,
              publicClient,
            });

            const nonce = transaction.nonce;

            addRecentTransaction(
              {
                hash: _firstDepositHash,
                nonce,
                chainId,
                gas: {
                  model: GasFeeModel.EIP1559,
                  gas: "0",
                  maxFeePerGas: undefined,
                  maxPriorityFeePerGas: undefined,
                },
                params: {
                  ...stringifyObject(_params),
                  abi: [getAbiItem({ name: "transfer", abi: ERC223_ABI })],
                },
                title: {
                  symbol: params.loanToken.symbol!,
                  template: RecentTransactionTitleTemplate.TRANSFER,
                  amount: params.loanAmount,
                  logoURI: params.loanToken?.logoURI || "/images/tokens/placeholder.svg",
                },
              },
              address,
            );

            const receipt = await publicClient.waitForTransactionReceipt({
              hash: _firstDepositHash,
            });

            if (receipt.status !== "success") {
              setStatus(CreateOrderStatus.ERROR_TRANSFER);
              return;
            }
          }

          setStatus(CreateOrderStatus.PENDING_DEPOSIT);

          const depositOrderHash = await walletClient.writeContract({
            abi: MARGIN_MODULE_ABI,
            address: MARGIN_TRADING_ADDRESS[chainId],
            functionName: "orderDepositToken",
            args: [
              createOrderLog.args.orderId,
              parseUnits(loanAmount, params.loanToken.decimals ?? 18),
            ],
            account: undefined,
          });
          setStatus(CreateOrderStatus.LOADING_DEPOSIT);
          setDepositHash(depositOrderHash);

          const transaction = await getTransactionWithRetries({
            hash: depositOrderHash,
            publicClient,
          });

          const nonce = transaction.nonce;

          addRecentTransaction(
            {
              hash: depositOrderHash,
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
                abi: [getAbiItem({ name: "orderDepositToken", abi: MARGIN_MODULE_ABI })],
              },
              title: {
                symbol: params.loanToken.symbol!,
                template: RecentTransactionTitleTemplate.DEPOSIT,
                amount: params.loanAmount,
                logoURI: params.loanToken?.logoURI || "/images/tokens/placeholder.svg",
              },
            },
            address,
          );

          const receipt = await publicClient.waitForTransactionReceipt({
            hash: depositOrderHash,
          });

          if (receipt.status === "success") {
            setStatus(CreateOrderStatus.SUCCESS);
          } else {
            setStatus(CreateOrderStatus.ERROR_DEPOSIT);
          }
          console.log(receipt);
        }

        // console.log("Receipt", receipt);
      } catch (e) {
        console.log(e);
        addToast("Unexpected error", "error");
        setStatus(CreateOrderStatus.INITIAL);
      }
    },
    [
      address,
      approveA,
      chainId,
      collateralTokens,
      includeERC223Collateral,
      interestRatePerMonth,
      leverage,
      liquidationFeeForLiquidator,
      liquidationFeeToken,
      loanAmount,
      loanToken,
      loanTokenStandard,
      minimumBorrowingAmount,
      orderCurrencyLimit,
      params.loanToken,
      params.loanTokenStandard,
      period.lendingOrderDeadline,
      period.positionDuration,
      publicClient,
      setCreateOrderHash,
      setStatus,
      setTransferHash,
      tradingTokens.allowedTokens,
      tradingTokens.includeERC223Trading,
      tradingTokens.inputMode,
      tradingTokens.tradingTokensAutoListing,
      walletClient,
    ],
  );

  return { handleCreateOrder };
}
