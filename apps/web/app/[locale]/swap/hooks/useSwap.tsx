import JSBI from "jsbi";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo } from "react";
import {
  Address,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  formatUnits,
  getAbiItem,
  parseUnits,
} from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

import { useTrade } from "@/app/[locale]/swap/hooks/useTrade";
import { useSwapAmountsStore } from "@/app/[locale]/swap/stores/useSwapAmountsStore";
import {
  useSwapGasLimitStore,
  useSwapGasPriceStore,
} from "@/app/[locale]/swap/stores/useSwapGasSettingsStore";
import { useSwapSettingsStore } from "@/app/[locale]/swap/stores/useSwapSettingsStore";
import {
  SwapError,
  SwapStatus,
  useSwapStatusStore,
} from "@/app/[locale]/swap/stores/useSwapStatusStore";
import { useSwapTokensStore } from "@/app/[locale]/swap/stores/useSwapTokensStore";
import { ERC20_ABI } from "@/config/abis/erc20";
import { ERC223_ABI } from "@/config/abis/erc223";
import { POOL_ABI } from "@/config/abis/pool";
import { ROUTER_ABI } from "@/config/abis/router";
import { getGasSettings } from "@/functions/gasSettings";
import { getTransactionWithRetries } from "@/functions/getTransactionWithRetries";
import { IIFE } from "@/functions/iife";
import { useStoreAllowance } from "@/hooks/useAllowance";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import useDeepEffect from "@/hooks/useDeepEffect";
import { useFees } from "@/hooks/useFees";
import useTransactionDeadline from "@/hooks/useTransactionDeadline";
import addToast from "@/other/toast";
import { ROUTER_ADDRESS } from "@/sdk_hybrid/addresses";
import { DEX_SUPPORTED_CHAINS, DexChainId } from "@/sdk_hybrid/chains";
import { ADDRESS_ZERO, FeeAmount } from "@/sdk_hybrid/constants";
import { Currency } from "@/sdk_hybrid/entities/currency";
import { CurrencyAmount } from "@/sdk_hybrid/entities/fractions/currencyAmount";
import { Percent } from "@/sdk_hybrid/entities/fractions/percent";
import { ONE } from "@/sdk_hybrid/internalConstants";
import { getTokenAddressForStandard, Standard } from "@/sdk_hybrid/standard";
import { useComputePoolAddressDex } from "@/sdk_hybrid/utils/computePoolAddress";
import { TickMath } from "@/sdk_hybrid/utils/tickMath";
import { GasOption } from "@/stores/factories/createGasPriceStore";
import { useConfirmInWalletAlertStore } from "@/stores/useConfirmInWalletAlertStore";
import {
  GasFeeModel,
  RecentTransactionTitleTemplate,
  stringifyObject,
  useRecentTransactionsStore,
} from "@/stores/useRecentTransactionsStore";

export function useSwapStatus() {
  const { status: swapStatus } = useSwapStatusStore();

  return {
    isPendingApprove: swapStatus === SwapStatus.PENDING_APPROVE,
    isLoadingApprove: swapStatus === SwapStatus.LOADING_APPROVE,
    isPendingSwap: swapStatus === SwapStatus.PENDING,
    isLoadingSwap: swapStatus === SwapStatus.LOADING,
    isSuccessSwap: swapStatus === SwapStatus.SUCCESS,
    isRevertedSwap: swapStatus === SwapStatus.ERROR,
    isSettledSwap: swapStatus === SwapStatus.SUCCESS || swapStatus === SwapStatus.ERROR,
    isRevertedApprove: swapStatus === SwapStatus.APPROVE_ERROR,
  };
}

function encodePath(address0: Address, address1: Address, fee: FeeAmount): Address {
  return `${address0}${fee.toString(16).padStart(6, "0")}${address1.slice(2)}`;
}

export function useSwapParams() {
  const { tokenA, tokenB, tokenAStandard, tokenBStandard } = useSwapTokensStore();
  const chainId = useCurrentChainId();
  const { address } = useAccount();

  const { typedValue } = useSwapAmountsStore();

  const { slippage, deadline: _deadline } = useSwapSettingsStore();
  const deadline = useTransactionDeadline(_deadline);

  const poolAddress = useComputePoolAddressDex({
    tokenA,
    tokenB,
    tier: FeeAmount.MEDIUM,
  });

  const { trade, isLoading: isLoadingTrade } = useTrade();

  console.log("TRADE");
  console.log(trade);

  const dependentAmount: CurrencyAmount<Currency> | undefined = useMemo(() => {
    return trade?.outputAmount;
  }, [trade?.outputAmount]);

  const minimumAmountOut = useMemo(() => {
    if (!trade) {
      return BigInt(0);
    }

    return BigInt(
      trade
        .minimumAmountOut(new Percent(slippage * 100, 10000), dependentAmount)
        .quotient.toString(),
    );
  }, [dependentAmount, slippage, trade]);

  const swapParams = useMemo(() => {
    if (
      !tokenA ||
      !tokenB ||
      !chainId ||
      !DEX_SUPPORTED_CHAINS.includes(chainId) ||
      !poolAddress ||
      !typedValue ||
      !trade ||
      !address
    ) {
      return null;
    }

    const zeroForOne = tokenA.wrapped.address0 < tokenB.wrapped.address0;

    const sqrtPriceLimitX96 = zeroForOne
      ? JSBI.add(TickMath.MIN_SQRT_RATIO, ONE)
      : JSBI.subtract(TickMath.MAX_SQRT_RATIO, ONE);

    const routerParams = {
      tokenIn: tokenA.wrapped.address0,
      tokenOut: tokenB.wrapped.address0,
      fee: FeeAmount.MEDIUM,
      recipient: address as Address,
      deadline,
      amountIn: parseUnits(typedValue, tokenA.decimals),
      amountOutMinimum: BigInt(0),
      sqrtPriceLimitX96: BigInt(sqrtPriceLimitX96.toString()),
      prefer223Out: tokenBStandard === Standard.ERC223,
    };

    if (tokenA.isNative) {
      return {
        address: ROUTER_ADDRESS[chainId as DexChainId],
        abi: ROUTER_ABI,
        functionName: "exactInputSingle" as "exactInputSingle",
        args: [routerParams],
        value: parseUnits(typedValue, tokenA.decimals),
      };
    }

    if (tokenAStandard === Standard.ERC20) {
      const _params = {
        abi: ROUTER_ABI,
        functionName: "exactInputSingle" as "exactInputSingle",
        args: [routerParams],
      };

      if (tokenB.isNative) {
        const encodedSwapParams = encodeFunctionData({
          abi: ROUTER_ABI,
          functionName: "exactInput" as "exactInput",
          args: [
            {
              path: encodePath(tokenA.address0, tokenB.wrapped.address0, FeeAmount.MEDIUM),
              deadline,
              recipient: ROUTER_ADDRESS[chainId],
              amountOutMinimum: BigInt(0),
              amountIn: parseUnits(typedValue, tokenA.decimals),
              prefer223Out: false,
            },
          ],
        });
        const encodedUnwrapParams = encodeFunctionData({
          abi: ROUTER_ABI,
          functionName: "unwrapWETH9" as const,
          args: [minimumAmountOut, address],
        });

        return {
          address: ROUTER_ADDRESS[chainId],
          abi: ROUTER_ABI,
          functionName: "multicall" as "multicall",
          args: [[encodedSwapParams, encodedUnwrapParams]],
        };
      } else {
        return { ..._params, address: ROUTER_ADDRESS[chainId as DexChainId] };
      }
    }

    if (tokenAStandard === Standard.ERC223) {
      return {
        address: getTokenAddressForStandard(tokenA, tokenAStandard),
        abi: ERC223_ABI,
        functionName: "transfer" as "transfer",
        args: [
          poolAddress.poolAddress,
          parseUnits(typedValue, tokenA.decimals), // amountSpecified
          encodeFunctionData({
            abi: POOL_ABI,
            functionName: "swapExactInput",
            args: [
              (address as Address) || poolAddress.poolAddress, // recipient
              zeroForOne, //zeroForOne
              parseUnits(typedValue, tokenA.decimals), // amountSpecified
              BigInt(0), //amountOutMinimum
              BigInt(sqrtPriceLimitX96.toString()), //sqrtPriceLimitX96
              tokenBStandard === Standard.ERC223, // prefer223Out
              encodeAbiParameters(
                [
                  { name: "path", type: "bytes" },
                  { name: "payer", type: "address" },
                ],
                [
                  encodePacked(
                    ["address", "uint24", "address"],
                    [tokenA.address0, FeeAmount.MEDIUM, tokenB.wrapped.address0],
                  ),
                  ADDRESS_ZERO,
                ],
              ),
              deadline,
              tokenB.isNative,
            ],
          }),
        ],
      };
    }
  }, [
    address,
    chainId,
    deadline,
    minimumAmountOut,
    poolAddress,
    tokenA,
    tokenAStandard,
    tokenB,
    tokenBStandard,
    trade,
    typedValue,
  ]);

  return { swapParams };
}

export function useSwapEstimatedGas() {
  const { address } = useAccount();
  const { swapParams } = useSwapParams();
  const publicClient = usePublicClient();
  const { setEstimatedGas } = useSwapGasLimitStore();
  const { tokenA, tokenB, tokenAStandard } = useSwapTokensStore();
  const chainId = useCurrentChainId();
  const { typedValue } = useSwapAmountsStore();

  const { isAllowed: isAllowedA } = useStoreAllowance({
    token: tokenA,
    contractAddress: ROUTER_ADDRESS[chainId],
    amountToCheck: parseUnits(typedValue, tokenA?.decimals ?? 18),
  });

  useDeepEffect(() => {
    IIFE(async () => {
      if (!swapParams || !address || (!isAllowedA && tokenAStandard === Standard.ERC20)) {
        setEstimatedGas(BigInt(195000));
        console.log("Can't estimate gas");
        return;
      }

      try {
        const estimated = await publicClient?.estimateContractGas({
          account: address,
          ...swapParams,
        } as any);

        if (estimated) {
          setEstimatedGas(estimated + BigInt(10000));
        } else {
          setEstimatedGas(BigInt(195000));
        }
        // console.log(estimated);
      } catch (e) {
        console.log(e);
        setEstimatedGas(BigInt(195000));
      }
    });
  }, [publicClient, address, swapParams, isAllowedA]);
}
export default function useSwap() {
  const t = useTranslations("Swap");
  const { data: walletClient } = useWalletClient();
  const { tokenA, tokenB, tokenAStandard } = useSwapTokensStore();
  const { trade } = useTrade();
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const chainId = useCurrentChainId();

  const { customGasLimit } = useSwapGasLimitStore();
  const { gasPriceOption, gasPriceSettings, setGasPriceSettings, setGasPriceOption } =
    useSwapGasPriceStore();

  const { baseFee, priorityFee, gasPrice } = useFees();

  const { slippage } = useSwapSettingsStore();
  const { typedValue } = useSwapAmountsStore();
  const { addRecentTransaction } = useRecentTransactionsStore();

  const {
    status: swapStatus,
    setStatus: setSwapStatus,
    setSwapHash,
    setApproveHash,
    setErrorType,
  } = useSwapStatusStore();

  const { openConfirmInWalletAlert, closeConfirmInWalletAlert } = useConfirmInWalletAlertStore();

  const {
    isAllowed: isAllowedA,
    writeTokenApprove: approveA,
    updateAllowance,
  } = useStoreAllowance({
    token: tokenA,
    contractAddress: ROUTER_ADDRESS[chainId],
    amountToCheck: parseUnits(typedValue, tokenA?.decimals ?? 18),
  });

  const output = useMemo(() => {
    if (!trade) {
      return "";
    }

    return (+trade.outputAmount.toSignificant() * (100 - slippage)) / 100;
  }, [slippage, trade]);

  const { swapParams } = useSwapParams();

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

  const handleSwap = useCallback(
    async (amountToApprove: string) => {
      if (!publicClient || !tokenA) {
        return;
      }

      if (!isAllowedA && tokenAStandard === Standard.ERC20 && tokenA.isToken) {
        openConfirmInWalletAlert(t("confirm_action_in_your_wallet_alert"));

        setSwapStatus(SwapStatus.PENDING_APPROVE);
        const result = await approveA({
          customAmount: parseUnits(amountToApprove, tokenA?.decimals ?? 18),
          customGasSettings: gasSettings,
        });

        if (!result?.success) {
          setSwapStatus(SwapStatus.INITIAL);
          closeConfirmInWalletAlert();
          return;
        } else {
          setApproveHash(result.hash);
          setSwapStatus(SwapStatus.LOADING_APPROVE);
          closeConfirmInWalletAlert();

          const approveReceipt = await publicClient.waitForTransactionReceipt({
            hash: result.hash,
          });

          if (approveReceipt.status === "reverted") {
            setSwapStatus(SwapStatus.APPROVE_ERROR);
            return;
          }
        }
      }

      if (
        !walletClient ||
        !address ||
        !tokenA ||
        !tokenB ||
        !trade ||
        !output ||
        !chainId ||
        !swapParams
        // !estimatedGas
      ) {
        console.log({
          walletClient,
          address,
          tokenA,
          tokenB,
          trade,
          output,
          publicClient,
          chainId,
          swapParams,
        });
        return;
      }

      setSwapStatus(SwapStatus.PENDING);
      openConfirmInWalletAlert(t("confirm_action_in_your_wallet_alert"));

      let hash;

      try {
        const estimatedGas = await publicClient.estimateContractGas({
          account: address,
          ...swapParams,
        } as any);

        const gasToUse = customGasLimit ? customGasLimit : estimatedGas + BigInt(30000); // set custom gas here if user changed it

        let _request;
        try {
          const { request } = await publicClient.simulateContract({
            ...swapParams,
            account: address,
            ...gasSettings,
            gas: gasToUse,
          } as any);
          _request = request;
        } catch (e) {
          _request = {
            ...swapParams,
            ...gasSettings,
            gas: gasToUse,
            account: undefined,
          } as any;
        }

        hash = await walletClient.writeContract({
          ..._request,
          account: undefined,
        });

        closeConfirmInWalletAlert();

        if (hash) {
          setSwapHash(hash);

          const transaction = await getTransactionWithRetries({ hash, publicClient });
          if (transaction) {
            const nonce = transaction.nonce;
            setSwapStatus(SwapStatus.LOADING);
            addRecentTransaction(
              {
                hash,
                nonce,
                chainId,
                gas: {
                  ...stringifyObject({ ...gasSettings, model: gasPriceSettings.model }),
                  gas: gasToUse.toString(),
                },
                params: {
                  ...stringifyObject(swapParams),
                  abi: [
                    getAbiItem({
                      name: swapParams.functionName,
                      abi: swapParams.abi,
                      args: swapParams.args as any,
                    }),
                  ],
                },
                title: {
                  symbol0: tokenA.symbol!,
                  symbol1: tokenB.symbol!,
                  template: RecentTransactionTitleTemplate.SWAP,
                  amount0: typedValue,
                  amount1: output.toString(),
                  logoURI0: tokenA?.logoURI || "/images/tokens/placeholder.svg",
                  logoURI1: tokenB?.logoURI || "/images/tokens/placeholder.svg",
                },
              },
              address,
            );

            const receipt = await publicClient.waitForTransactionReceipt({ hash }); //TODO: add try catch
            updateAllowance();
            if (receipt.status === "success") {
              setSwapStatus(SwapStatus.SUCCESS);
            }

            if (receipt.status === "reverted") {
              setSwapStatus(SwapStatus.ERROR);

              const ninetyEightPercent = (gasToUse * BigInt(98)) / BigInt(100);

              if (receipt.gasUsed >= ninetyEightPercent && receipt.gasUsed <= gasToUse) {
                setErrorType(SwapError.OUT_OF_GAS);
              } else {
                setErrorType(SwapError.UNKNOWN);
              }
            }
          }
        } else {
          setSwapStatus(SwapStatus.INITIAL);
        }
      } catch (e) {
        console.log(e);
        addToast("Error while executing contract", "error");
        closeConfirmInWalletAlert();
        setSwapStatus(SwapStatus.INITIAL);
      }
    },
    [
      addRecentTransaction,
      address,
      approveA,
      chainId,
      closeConfirmInWalletAlert,
      customGasLimit,
      gasPriceSettings,
      isAllowedA,
      openConfirmInWalletAlert,
      output,
      publicClient,
      setApproveHash,
      setErrorType,
      setSwapHash,
      setSwapStatus,
      swapParams,
      t,
      tokenA,
      tokenAStandard,
      tokenB,
      trade,
      typedValue,
      updateAllowance,
      walletClient,
      gasSettings,
    ],
  );

  return {
    handleSwap,
    isAllowedA: isAllowedA,
    handleApprove: () => null,
  };
}
