import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Address, formatUnits, isAddress, parseUnits } from "viem";
import { useAccount, usePublicClient, useReadContract, useWalletClient } from "wagmi";

import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import Popover from "@/components/atoms/Popover";
import Preloader from "@/components/atoms/Preloader";
import SelectButton from "@/components/atoms/SelectButton";
import Svg from "@/components/atoms/Svg";
import TextField, { InputLabel } from "@/components/atoms/TextField";
import Button from "@/components/buttons/Button";
import { useConnectWalletDialogStateStore } from "@/components/dialogs/stores/useConnectWalletStore";
import { useMintTestTokensDialogStore } from "@/components/dialogs/stores/useMintTestTokensDialogStore";
import { ERC20_ABI } from "@/config/abis/erc20";
import { ERC223_ABI } from "@/config/abis/erc223";
import { TOKEN_CONVERTER_ABI } from "@/config/abis/tokenConverter";
import { formatFloat } from "@/functions/formatFloat";
import { IIFE } from "@/functions/iife";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import useScopedBlockNumber from "@/hooks/useScopedBlockNumber";
import { useTokens } from "@/hooks/useTokenLists";
import addToast from "@/other/toast";
import { CONVERTER_ADDRESS } from "@/sdk_hybrid/addresses";

export default function MintTestTokensDialog() {
  const { isOpen, handleOpen, handleClose } = useMintTestTokensDialogStore();
  const tokens = useTokens();
  const { isOpened: isOpenedWallet, setIsOpened: setOpenedWallet } =
    useConnectWalletDialogStateStore();
  const [isPopoverOpened, setPopoverOpened] = useState(false);

  const [amountToMint, setAmountToMint] = useState<string>("1000");
  const publicClient = usePublicClient();

  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const { address, isConnected, connector } = useAccount();

  const chainId = useCurrentChainId();

  const { data: walletClient } = useWalletClient();

  const [tokenToMint, setTokenToMint] = useState(tokens[0]);

  useEffect(() => {
    if (tokens.length && !tokenToMint) {
      setTokenToMint(tokens[0]);
    }
  }, [tokenToMint, tokens]);

  const { data: isAddress1Wrapper } = useReadContract({
    abi: TOKEN_CONVERTER_ABI,
    functionName: "isWrapper",
    address: CONVERTER_ADDRESS[chainId],
    args: [tokenToMint.wrapped.address1],
    chainId,
    query: {
      enabled: tokenToMint.isToken,
    },
  });

  const { data: erc223Origin } = useReadContract({
    abi: TOKEN_CONVERTER_ABI,
    functionName: "getERC223OriginFor",
    address: CONVERTER_ADDRESS[chainId],
    args: [tokenToMint.wrapped.address0],
    chainId,
    query: {
      enabled: tokenToMint.isToken && !isAddress1Wrapper,
    },
  });

  const mintErc223 = useMemo(() => {
    return !isAddress1Wrapper && Boolean(erc223Origin);
  }, [erc223Origin, isAddress1Wrapper]);

  const { data: balance, refetch } = useReadContract({
    abi: ERC20_ABI,
    functionName: "balanceOf",
    address: mintErc223 ? tokenToMint?.wrapped.address1 : tokenToMint?.wrapped.address0,
    // address: tokenToMint.wrapped.address0,
    chainId,
    args: [address as Address],
    query: {
      enabled: !!tokenToMint,
    },
  });

  const { data: latestBlock } = useScopedBlockNumber({ watch: isOpen });

  useEffect(() => {
    refetch();
  }, [latestBlock, refetch]);
  const handleMint = useCallback(() => {
    if (!tokenToMint || !walletClient || !publicClient) {
      addToast("Not correct data", "error");
      return;
    }

    IIFE(async () => {
      if (!address) {
        return;
      }
      setIsLoading(true);

      try {
        const hash = await walletClient.writeContract({
          abi: ERC223_ABI,
          address: mintErc223 ? tokenToMint?.wrapped.address1 : tokenToMint?.wrapped.address0,
          // address: tokenToMint.wrapped.address0,
          functionName: "mint",
          args: [address, parseUnits(amountToMint, tokenToMint.decimals)],
        });
        setIsLoading(false);
        setIsPending(true);

        await publicClient.waitForTransactionReceipt({ hash });
        addToast("Minted successfully");
      } catch (e) {
        console.log(e);
      } finally {
        setIsLoading(false);
        setIsPending(false);
      }
    });
  }, [connector, tokenToMint, walletClient, publicClient, address, mintErc223, amountToMint]);

  return (
    <DrawerDialog isOpen={isOpen} setIsOpen={handleClose}>
      <DialogHeader onClose={handleClose} title="Get test tokens" />
      <div className="mx-auto card-spacing rounded-2 bg-primary-bg md:w-[600px] w-full border border-transparent">
        <InputLabel label="Token for mint" />
        <div className="flex flex-col gap-4 relative">
          <Popover
            customOffset={5}
            isOpened={isPopoverOpened}
            setIsOpened={setPopoverOpened}
            placement="bottom-end"
            customStyles={{ width: "100%" }}
            trigger={
              <SelectButton
                onClick={() => setPopoverOpened(!isPopoverOpened)}
                fullWidth
                size="large"
                className={clsx(
                  "flex-shrink-0 pl-5 bg-tertiary-bg border border-transparent text-16 lg:text-16 lg:py-2",
                  isPopoverOpened && "bg-green-bg border-green shadow-green/60 shadow",
                )}
                isOpen={isPopoverOpened}
              >
                {tokenToMint?.symbol || "Select token"}
              </SelectButton>
            }
          >
            <div className="py-1 grid gap-1 bg-tertiary-bg rounded-3 w-full h-[172px] md:h-[200px] overflow-scroll">
              {tokens.map((token) => {
                return (
                  <button
                    key={token.wrapped.address0}
                    onClick={() => {
                      setTokenToMint(token);
                      setPopoverOpened(false);
                    }}
                    className="flex items-center gap-3 bg-tertiary-bg-bg hocus:bg-quaternary-bg duration-300 w-full min-w-[250px] px-5 h-10 md:h-12 justify-between"
                  >
                    <span
                      className={token.equals(tokenToMint) ? "text-green" : "text-secondary-text"}
                    >
                      {token.symbol}
                    </span>
                    {token.equals(tokenToMint) && (
                      <Svg iconName="check" className="text-green" size={20} />
                    )}
                  </button>
                );
              })}
            </div>
          </Popover>

          <TextField
            label="Amount of tokens"
            helperText={`Balance: ${balance && tokenToMint ? `${formatFloat(formatUnits(balance, tokenToMint.decimals))} ${tokenToMint.symbol}` : "0"}`}
            readOnly
            value={amountToMint}
            onChange={(e) => setAmountToMint(e.target.value)}
            placeholder="Amount"
            internalText={tokenToMint?.symbol}
            isNumeric
          />

          {isConnected ? (
            <Button disabled={isLoading || isPending} onClick={handleMint}>
              {isLoading && (
                <span className="flex items-center gap-2">
                  <span>Waiting for confirmation</span>
                  <Preloader color="green" />
                </span>
              )}
              {isPending && (
                <span className="flex items-center gap-2">
                  <span>Minting in progress</span>
                  <Preloader color="green" />
                </span>
              )}
              {!isLoading && !isPending && "Mint tokens"}
            </Button>
          ) : (
            <Button
              onClick={() => {
                setOpenedWallet(true);
              }}
            >
              Connect your wallet
            </Button>
          )}
        </div>
      </div>
    </DrawerDialog>
  );
}
