import { useCallback, useMemo, useState } from "react";
import { getAbiItem, getContractAddress, parseEventLogs, parseUnits } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

import {
  useCreateTokenGasLimitStore,
  useCreateTokenGasPriceStore,
} from "@/app/[locale]/create-token/stores/useCreateTokenGasSettingsStore";
import {
  CreateTokenStatus,
  useCreateTokenStatusStore,
} from "@/app/[locale]/create-token/stores/useCreateTokenStatusStore";
import {
  useSwapGasLimitStore,
  useSwapGasPriceStore,
} from "@/app/[locale]/swap/stores/useSwapGasSettingsStore";
import { useImportToken } from "@/components/manage-tokens/ImportToken";
import { ERC223_TOKEN_DEPLOYER_ABI } from "@/config/abis/erc2223TokenDeployer";
import { TOKEN_CONVERTER_ABI } from "@/config/abis/tokenConverter";
import { getGasSettings } from "@/functions/gasSettings";
import { getTransactionWithRetries } from "@/functions/getTransactionWithRetries";
import { IIFE } from "@/functions/iife";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import useDeepEffect from "@/hooks/useDeepEffect";
import { CONVERTER_ADDRESS, ERC223_TOKEN_DEPLOYER_ADDRESS } from "@/sdk_bi/addresses";
import { Standard } from "@/sdk_bi/standard";
import { useGlobalFees } from "@/shared/hooks/useGlobalFees";
import {
  GasFeeModel,
  RecentTransactionTitleTemplate,
  stringifyObject,
  useRecentTransactionsStore,
} from "@/stores/useRecentTransactionsStore";

export function useCreateTokenEstimatedGas(createTokenSettings: {
  name: string;
  symbol: string;
  totalSupply: string;
  imageURL: string;
  allowMintForOwner: boolean;
  createERC20: boolean;
}) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { setEstimatedGas } = useCreateTokenGasLimitStore();
  const chainId = useCurrentChainId();

  useDeepEffect(() => {
    IIFE(async () => {
      if (!address) {
        setEstimatedGas(BigInt(900000));
        console.log("Can't estimate gas");
        return;
      }

      const deployTokenParams = {
        abi: ERC223_TOKEN_DEPLOYER_ABI,
        address: ERC223_TOKEN_DEPLOYER_ADDRESS[chainId],
        functionName: "deployERC223Token" as const,
        args: [
          createTokenSettings.name,
          createTokenSettings.symbol,
          parseUnits(createTokenSettings.totalSupply, 18),
          createTokenSettings.imageURL,
          18,
          createTokenSettings.allowMintForOwner,
        ],
      } as const;

      try {
        const estimated = await publicClient?.estimateContractGas({
          account: address,
          ...deployTokenParams,
        } as any);

        if (estimated) {
          setEstimatedGas(estimated + BigInt(10000));
        } else {
          setEstimatedGas(BigInt(900000));
        }
        // console.log(estimated);
      } catch (e) {
        console.log(e);
        setEstimatedGas(BigInt(900000));
      }
    });
  }, [publicClient, address]);
}

export default function useCreateToken(createTokenSettings: {
  name: string;
  symbol: string;
  totalSupply: string;
  imageURL: string;
  allowMintForOwner: boolean;
  createERC20: boolean;
}) {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const chainId = useCurrentChainId();
  const { address: accountAddress } = useAccount();
  const { status, setStatus, setCreateTokenHash, setCreateWrapperHash } =
    useCreateTokenStatusStore();
  const { addRecentTransaction } = useRecentTransactionsStore();
  const [tokenAddress, setTokenAddress] = useState<string | null>(null);
  const { handleImport } = useImportToken();
  const { baseFee, priorityFee, gasPrice } = useGlobalFees();
  const { customGasLimit } = useCreateTokenGasLimitStore();
  const { gasPriceOption, gasPriceSettings } = useCreateTokenGasPriceStore();

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

  const handleCreateToken = useCallback(async () => {
    if (!walletClient || !publicClient || !accountAddress) {
      return;
    }

    setStatus(CreateTokenStatus.PENDING_CREATE_TOKEN);

    try {
      const deployTokenParams = {
        abi: ERC223_TOKEN_DEPLOYER_ABI,
        address: ERC223_TOKEN_DEPLOYER_ADDRESS[chainId],
        functionName: "deployERC223Token" as const,
        args: [
          createTokenSettings.name,
          createTokenSettings.symbol,
          parseUnits(createTokenSettings.totalSupply, 18),
          createTokenSettings.imageURL,
          18,
          createTokenSettings.allowMintForOwner,
        ],
      } as const;

      const estimatedGas = await publicClient.estimateContractGas({
        account: accountAddress,
        ...deployTokenParams,
      } as any);

      const gasToUse = customGasLimit ? customGasLimit : estimatedGas + BigInt(30000); // set custom gas here if user changed it

      const hash = await walletClient.writeContract({
        ...deployTokenParams,
        ...gasSettings,
        gas: gasToUse,
      });

      setCreateTokenHash(hash);

      const transaction = await getTransactionWithRetries({
        hash,
        publicClient,
      });

      const nonce = transaction.nonce;

      const factoryNonce = await publicClient.getTransactionCount({
        address: ERC223_TOKEN_DEPLOYER_ADDRESS[chainId],
        blockTag: "latest",
      });

      const futureAddress = getContractAddress({
        from: ERC223_TOKEN_DEPLOYER_ADDRESS[chainId],
        nonce: BigInt(factoryNonce),
      });

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
            ...stringifyObject(deployTokenParams),
            abi: [
              getAbiItem({
                name: deployTokenParams.functionName,
                abi: ERC223_TOKEN_DEPLOYER_ABI,
              }),
            ],
          },
          title: {
            template: RecentTransactionTitleTemplate.DEPLOY_TOKEN,
            symbol: createTokenSettings.symbol!,
            amount: createTokenSettings.totalSupply,
            logoURI: createTokenSettings.imageURL || "/images/tokens/placeholder.svg",
            standard: Standard.ERC223,
            address: futureAddress,
            chainId: chainId,
          },
        },
        accountAddress,
      );

      if (hash) {
        setStatus(CreateTokenStatus.LOADING_CREATE_TOKEN);
        const deployReceipt = await publicClient.waitForTransactionReceipt({ hash }); //TODO: add try catch

        const parsedEventLog = parseEventLogs({
          abi: ERC223_TOKEN_DEPLOYER_ABI,
          logs: deployReceipt.logs,
        });

        const deployTokenLog = parsedEventLog.find((log) => log.eventName === "Deployed");

        console.log(deployTokenLog);
        if (deployTokenLog) {
          setTokenAddress(deployTokenLog.args.token);
          try {
            handleImport(deployTokenLog.args.token, chainId);
          } catch (e) {
            console.log(e);
            console.log("Failed to import token to user custom tokenlist");
          }

          if (!createTokenSettings.createERC20) {
            if (deployReceipt.status === "success") {
              setStatus(CreateTokenStatus.SUCCESS);
            }

            if (deployReceipt.status === "reverted") {
              setStatus(CreateTokenStatus.ERROR_CREATE_TOKEN);
            }
          } else {
            try {
              setStatus(CreateTokenStatus.PENDING_CREATE_WRAPPER);

              const deployTokenParams = {
                abi: TOKEN_CONVERTER_ABI,
                address: CONVERTER_ADDRESS[chainId],
                functionName: "createERC20Wrapper" as const,
                args: [deployTokenLog.args.token],
              } as const;

              const wrapperHash = await walletClient.writeContract({
                ...deployTokenParams,
                ...gasSettings,
              });

              setCreateWrapperHash(wrapperHash);

              setStatus(CreateTokenStatus.LOADING_CREATE_WRAPPER);
              const receipt = await publicClient.waitForTransactionReceipt({ hash: wrapperHash });

              if (receipt.status === "success") {
                setStatus(CreateTokenStatus.SUCCESS);
              }

              if (receipt.status === "reverted") {
                setStatus(CreateTokenStatus.ERROR_CREATE_WRAPPER);
              }
            } catch (error) {
              setStatus(CreateTokenStatus.ERROR_CREATE_WRAPPER);
            }
          }
        }
      }
    } catch (e) {
      setStatus(CreateTokenStatus.ERROR_CREATE_TOKEN);
    }
  }, [
    accountAddress,
    addRecentTransaction,
    chainId,
    createTokenSettings.allowMintForOwner,
    createTokenSettings.createERC20,
    createTokenSettings.imageURL,
    createTokenSettings.name,
    createTokenSettings.symbol,
    createTokenSettings.totalSupply,
    handleImport,
    publicClient,
    setCreateTokenHash,
    setCreateWrapperHash,
    setStatus,
    walletClient,
  ]);

  return { handleCreateToken, tokenAddress, setTokenAddress };
}
