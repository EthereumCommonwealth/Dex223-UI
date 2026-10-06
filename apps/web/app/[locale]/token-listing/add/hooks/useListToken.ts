import { isZeroAddress } from "@ethereumjs/util";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo } from "react";
import {
  BaseError,
  ContractFunctionRevertedError,
  getAbiItem,
  parseUnits,
  UserRejectedRequestError,
} from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

import { useAutoListingContract } from "@/app/[locale]/token-listing/add/hooks/useAutoListingContracts";
import useTokensToList from "@/app/[locale]/token-listing/add/hooks/useTokensToList";
import { useAutoListingContractStore } from "@/app/[locale]/token-listing/add/stores/useAutoListingContractStore";
import {
  useListTokensGasLimitStore,
  useListTokensGasPriceStore,
} from "@/app/[locale]/token-listing/add/stores/useListTokensGasSettings";
import { useListTokensStore } from "@/app/[locale]/token-listing/add/stores/useListTokensStore";
import {
  ListError,
  ListTokenStatus,
  useListTokenErrorReasonStore,
  useListTokenStatusStore,
} from "@/app/[locale]/token-listing/add/stores/useListTokenStatusStore";
import { usePaymentTokenStore } from "@/app/[locale]/token-listing/add/stores/usePaymentTokenStore";
import { AUTO_LISTING_ABI } from "@/config/abis/autolisting";
import { ROUTER_ABI } from "@/config/abis/router";
import { getGasSettings } from "@/functions/gasSettings";
import { getTransactionWithRetries } from "@/functions/getTransactionWithRetries";
import { IIFE } from "@/functions/iife";
import { useStoreAllowance } from "@/hooks/useAllowance";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import useDeepEffect from "@/hooks/useDeepEffect";
import { PoolState, useStorePools } from "@/hooks/usePools";
import { DexChainId } from "@/sdk_bi/chains";
import { ADDRESS_ZERO, FeeAmount } from "@/sdk_bi/constants";
import { Token } from "@/sdk_bi/entities/token";
import { useComputePoolAddressDex } from "@/sdk_bi/utils/computePoolAddress";
import { useGlobalFees } from "@/shared/hooks/useGlobalFees";
import { useConfirmInWalletAlertStore } from "@/stores/useConfirmInWalletAlertStore";
import {
  GasFeeModel,
  RecentTransactionTitleTemplate,
  stringifyObject,
  useRecentTransactionsStore,
} from "@/stores/useRecentTransactionsStore";

const poolsFees = [FeeAmount.LOW, FeeAmount.MEDIUM, FeeAmount.HIGH];

function useListParams() {
  const { tokenA, tokenB } = useListTokensStore();
  const { autoListingContract } = useAutoListingContractStore();

  const autoListing = useAutoListingContract(autoListingContract);
  const tokensToList = useTokensToList();

  const pools = useStorePools(
    poolsFees.map((fee) => ({ currencyA: tokenA, currencyB: tokenB, tier: fee })),
  );

  const pool = useMemo(() => {
    return pools.find(
      (pool) =>
        pool[0] !== PoolState.NOT_EXISTS &&
        pool[0] !== PoolState.INVALID &&
        pool[0] !== PoolState.IDLE,
    );
  }, [pools]);

  const { poolAddress } = useComputePoolAddressDex({
    tokenA,
    tokenB,
    tier: pool?.[1]?.fee,
  });

  const isFree = useMemo(() => {
    return !autoListing?.tokensToPay.length;
  }, [autoListing]);

  const { paymentToken } = usePaymentTokenStore();

  return useMemo(() => {
    if (!poolAddress) {
      return;
    }

    const common = {
      address: autoListingContract,
      abi: AUTO_LISTING_ABI,
      functionName: "list",
      args: [poolAddress, pool?.[1]?.fee],
    };

    if (isFree) {
      return { ...common, args: [...common.args, poolAddress] };
    } else {
      if (!paymentToken) {
        return;
      }

      if (isZeroAddress(paymentToken.token.address)) {
        console.log({
          ...common,
          args: [...common.args, paymentToken.token.address],
          value: tokensToList.length
            ? paymentToken.price * BigInt(tokensToList.length)
            : paymentToken.price,
        });

        return {
          ...common,
          args: [...common.args, paymentToken.token.address],
          value: tokensToList.length
            ? paymentToken.price * BigInt(tokensToList.length)
            : paymentToken.price,
        };
      }

      return { ...common, args: [...common.args, paymentToken.token.address] };
    }
  }, [autoListingContract, isFree, paymentToken, pool, poolAddress, tokensToList.length]);
}

export function useListTokenEstimatedGas() {
  const { address } = useAccount();
  const listTokenParams = useListParams();
  const publicClient = usePublicClient();
  const { setEstimatedGas } = useListTokensGasLimitStore();
  const { autoListingContract } = useAutoListingContractStore();

  const autoListing = useAutoListingContract(autoListingContract);

  const isFree = useMemo(() => {
    return !autoListing?.tokensToPay.length;
  }, [autoListing]);

  const { paymentToken } = usePaymentTokenStore();

  const { isAllowed } = useStoreAllowance({
    token:
      paymentToken && !isFree
        ? new Token(
            DexChainId.SEPOLIA,
            paymentToken.token.address,
            ADDRESS_ZERO,
            +paymentToken.token.decimals,
            paymentToken.token.symbol,
          )
        : undefined,
    contractAddress: autoListingContract,
    amountToCheck: paymentToken ? paymentToken.price * BigInt(2) : null,
  });

  useDeepEffect(() => {
    IIFE(async () => {
      if (!listTokenParams || !address || (!isAllowed && !isFree)) {
        setEstimatedGas(BigInt(195000));
        console.log("Can't estimate gas");
        return;
      }

      try {
        const estimated = await publicClient?.estimateContractGas({
          account: address,
          ...listTokenParams,
        } as any);

        if (estimated) {
          setEstimatedGas(estimated + BigInt(10000));
        } else {
          setEstimatedGas(BigInt(195000));
        }
      } catch (e) {
        console.log(e);
        setEstimatedGas(BigInt(195000));
      }
    });
  }, [publicClient, address, listTokenParams, isAllowed]);
}

export default function useListToken() {
  const t = useTranslations("Swap");
  const { tokenA, tokenB } = useListTokensStore();
  const { autoListingContract } = useAutoListingContractStore();

  const autoListing = useAutoListingContract(autoListingContract);
  const { openConfirmInWalletAlert, closeConfirmInWalletAlert } = useConfirmInWalletAlertStore();
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const pools = useStorePools(
    poolsFees.map((fee) => ({ currencyA: tokenA, currencyB: tokenB, tier: fee })),
  );

  const pool = useMemo(() => {
    return pools.find(
      (pool) =>
        pool[0] !== PoolState.NOT_EXISTS &&
        pool[0] !== PoolState.INVALID &&
        pool[0] !== PoolState.IDLE,
    );
  }, [pools]);

  const { poolAddress } = useComputePoolAddressDex({
    tokenA,
    tokenB,
    tier: pool?.[1]?.fee,
  });

  const tokensToList = useTokensToList();

  const isFree = useMemo(() => {
    return !autoListing?.tokensToPay.length;
  }, [autoListing]);

  const { data: walletClient } = useWalletClient();
  const { paymentToken } = usePaymentTokenStore();

  const {
    status: listTokenStatus,
    setStatus: setListTokenStatus,
    setApproveHash,
    setErrorType,
    setListTokenHash,
  } = useListTokenStatusStore();
  const { setReason: setListErrorReason } = useListTokenErrorReasonStore();
  const chainId = useCurrentChainId();
  const { addRecentTransaction } = useRecentTransactionsStore();

  const listParams = useListParams();

  const { gasPrice, priorityFee, baseFee } = useGlobalFees();
  const { gasPriceOption, gasPriceSettings } = useListTokensGasPriceStore();
  const { customGasLimit } = useListTokensGasLimitStore();

  const { isAllowed, writeTokenApprove, updateAllowance } = useStoreAllowance({
    token:
      paymentToken && !isFree
        ? new Token(
            DexChainId.SEPOLIA,
            paymentToken.token.address,
            ADDRESS_ZERO,
            +paymentToken.token.decimals,
            paymentToken.token.symbol,
          )
        : undefined,
    contractAddress: autoListingContract,
    amountToCheck:
      paymentToken && tokensToList.length ? paymentToken.price * BigInt(tokensToList.length) : null,
  });

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

  const handleList = useCallback(
    async (amountToApprove: string) => {
      if (!poolAddress || !walletClient || (!paymentToken && !isFree) || !publicClient) {
        return;
      }

      if (!isAllowed && !isFree && paymentToken && !isZeroAddress(paymentToken.token.address)) {
        openConfirmInWalletAlert(t("confirm_action_in_your_wallet_alert"));

        setListTokenStatus(ListTokenStatus.PENDING_APPROVE);
        const result = await writeTokenApprove({
          customAmount: parseUnits(amountToApprove, paymentToken.token.decimals),
          customGasSettings: gasSettings,
        });

        if (!result?.success) {
          setListTokenStatus(ListTokenStatus.INITIAL);
          closeConfirmInWalletAlert();
          return;
        } else {
          setApproveHash(result.hash);
          setListTokenStatus(ListTokenStatus.LOADING_APPROVE);
          closeConfirmInWalletAlert();

          const approveReceipt = await publicClient.waitForTransactionReceipt({
            hash: result.hash,
          });

          if (approveReceipt.status === "reverted") {
            setListTokenStatus(ListTokenStatus.ERROR_APPROVE);
            return;
          }
        }
      }

      if (!tokenA || !tokenB || !address || !listParams) {
        return;
      }

      setListErrorReason(undefined);
      setListTokenStatus(ListTokenStatus.PENDING_LIST_TOKEN);
      openConfirmInWalletAlert(t("confirm_action_in_your_wallet_alert"));

      let hash;

      try {
        const estimatedGas = await publicClient.estimateContractGas({
          account: address,
          ...listParams,
        } as any);

        const gasToUse = customGasLimit ? customGasLimit : estimatedGas + BigInt(30000); // set custom gas here if user changed it
        // const gasToUse = BigInt(0);
        //
        const { request } = await publicClient.simulateContract({
          ...listParams,
          account: address,
          ...gasSettings,
          gas: gasToUse,
        } as any);

        hash = await walletClient.writeContract({
          ...request,
          account: undefined,
        });

        closeConfirmInWalletAlert();

        if (hash) {
          setListTokenHash(hash);
          const transaction = await getTransactionWithRetries({
            hash,
            publicClient,
          });

          const nonce = transaction.nonce;
          setListTokenStatus(ListTokenStatus.LOADING_LIST_TOKEN);

          if (tokensToList.length) {
            addRecentTransaction(
              {
                hash,
                nonce,
                chainId,
                gas: {
                  ...stringifyObject({ ...gasSettings, model: GasFeeModel.EIP1559 }),
                  gas: gasToUse.toString(),
                },
                params: {
                  ...stringifyObject(listParams),
                  abi: [getAbiItem({ name: "exactInputSingle", abi: ROUTER_ABI })],
                },
                title:
                  tokensToList.length === 2
                    ? {
                        symbol0: tokenA.wrapped.symbol!,
                        symbol1: tokenB.wrapped.symbol!,
                        template: RecentTransactionTitleTemplate.LIST_DOUBLE,
                        logoURI0: tokenA?.logoURI || "/images/tokens/placeholder.svg",
                        logoURI1: tokenB?.logoURI || "/images/tokens/placeholder.svg",
                        autoListing: autoListing?.name || "Unknown",
                      }
                    : {
                        symbol: tokensToList[0]?.symbol || "Unknown",
                        template: RecentTransactionTitleTemplate.LIST_SINGLE,
                        logoURI: tokensToList[0]?.logoURI || "/images/tokens/placeholder.svg",
                        autoListing: autoListing?.name || "Unknown",
                      },
              },
              address,
            );
          }

          const receipt = await publicClient.waitForTransactionReceipt({ hash }); //TODO: add try catch
          updateAllowance();
          if (receipt.status === "success") {
            setListTokenStatus(ListTokenStatus.SUCCESS);
          }

          if (receipt.status === "reverted") {
            setListTokenStatus(ListTokenStatus.ERROR_LIST_TOKEN);

            const ninetyEightPercent = (gasToUse * BigInt(98)) / BigInt(100);

            if (receipt.gasUsed >= ninetyEightPercent && receipt.gasUsed <= gasToUse) {
              setErrorType(ListError.OUT_OF_GAS);
            } else {
              setErrorType(ListError.UNKNOWN);
            }
          }
        } else {
          setListTokenStatus(ListTokenStatus.INITIAL);
        }
      } catch (e) {
        console.log(e);
        closeConfirmInWalletAlert();

        if (e instanceof BaseError && e.walk((err) => err instanceof UserRejectedRequestError)) {
          setListTokenStatus(ListTokenStatus.INITIAL);
          return;
        }

        const reverted =
          e instanceof BaseError
            ? e.walk((err) => err instanceof ContractFunctionRevertedError)
            : null;
        setListErrorReason(
          reverted instanceof ContractFunctionRevertedError ? reverted.reason : undefined,
        );
        setListTokenStatus(ListTokenStatus.ERROR_LIST_TOKEN);
      }
    },
    [
      addRecentTransaction,
      address,
      autoListing?.name,
      chainId,
      closeConfirmInWalletAlert,
      customGasLimit,
      isAllowed,
      isFree,
      listParams,
      openConfirmInWalletAlert,
      paymentToken,
      poolAddress,
      publicClient,
      setApproveHash,
      setErrorType,
      setListTokenHash,
      setListTokenStatus,
      setListErrorReason,
      t,
      tokenA,
      tokenB,
      tokensToList,
      updateAllowance,
      walletClient,
      writeTokenApprove,
      gasSettings,
    ],
  );

  return { handleList };
}
