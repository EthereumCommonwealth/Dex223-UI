import Preloader from "@repo/ui/preloader";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Address, formatUnits, parseUnits } from "viem";
import { useAccount, usePublicClient, useReadContract, useWalletClient } from "wagmi";

import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import Popover from "@/components/atoms/Popover";
import ScrollbarContainer from "@/components/atoms/ScrollbarContainer";
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
import { useTokens } from "@/hooks/useTokenLists";
import addToast from "@/other/toast";
import { CONVERTER_ADDRESS } from "@/sdk_bi/addresses";
import { useGlobalBlockNumber } from "@/shared/hooks/useGlobalBlockNumber";

export default function MintTestTokensDialog() {
  const t = useTranslations("MintTest");
  const tSwap = useTranslations("Swap");
  const tWallet = useTranslations("Wallet");
  const tManage = useTranslations("ManageTokens");
  const tRevenue = useTranslations("Revenue");
  const { isOpen, handleOpen, handleClose } = useMintTestTokensDialogStore();
  const tokens = useTokens();
  const withoutWrapped = useMemo(() => {
    return tokens.filter((token) => token.isToken);
  }, [tokens]);

  const { isOpened: isOpenedWallet, setIsOpened: setOpenedWallet } =
    useConnectWalletDialogStateStore();
  const [isPopoverOpened, setPopoverOpened] = useState(false);

  const [amountToMint, setAmountToMint] = useState<string>("10000");
  const publicClient = usePublicClient();

  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const { address, isConnected, connector } = useAccount();

  const chainId = useCurrentChainId();

  const { data: walletClient } = useWalletClient();

  const [tokenToMint, setTokenToMint] = useState(withoutWrapped[0]);

  useEffect(() => {
    if (withoutWrapped.length && !tokenToMint) {
      setTokenToMint(withoutWrapped[0]);
    }
  }, [tokenToMint, withoutWrapped]);

  const { data: isAddress1Wrapper } = useReadContract({
    abi: TOKEN_CONVERTER_ABI,
    functionName: "isWrapper",
    address: CONVERTER_ADDRESS[chainId],
    args: [tokenToMint?.wrapped.address1],
    chainId,
    query: {
      enabled: tokenToMint?.isToken,
    },
  });

  const { data: erc223Origin } = useReadContract({
    abi: TOKEN_CONVERTER_ABI,
    functionName: "getERC223OriginFor",
    address: CONVERTER_ADDRESS[chainId],
    args: [tokenToMint?.wrapped.address0],
    chainId,
    query: {
      enabled: tokenToMint?.isToken && !isAddress1Wrapper,
    },
  });

  const mintErc223 = useMemo(() => {
    return false;
  }, []);

  const { data: balance, refetch } = useReadContract({
    abi: ERC20_ABI,
    functionName: "balanceOf",
    address: mintErc223 ? tokenToMint?.wrapped.address1 : tokenToMint?.wrapped.address0,
    chainId,
    args: [address as Address],
    query: {
      enabled: !!tokenToMint,
    },
  });

  const { blockNumber } = useGlobalBlockNumber();

  useEffect(() => {
    refetch();
  }, [blockNumber, refetch]);

  const handleMint = useCallback(() => {
    if (!tokenToMint || !walletClient || !publicClient) {
      addToast(t("bad_data"), "error");
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
          functionName: "mint",
          args: [address, parseUnits(amountToMint, tokenToMint.decimals)],
        });
        setIsLoading(false);
        setIsPending(true);

        await publicClient.waitForTransactionReceipt({ hash });
        addToast(t("minted"));
      } catch (e) {
        console.log(e);
      } finally {
        setIsLoading(false);
        setIsPending(false);
      }
    });
  }, [address, amountToMint, mintErc223, publicClient, t, tokenToMint, walletClient]);

  const ref = useRef<HTMLButtonElement | null>(null);

  return (
    <DrawerDialog isOpen={isOpen} setIsOpen={handleClose}>
      <DialogHeader onClose={handleClose} title={t("title")} />
      <div className="mx-auto card-spacing rounded-2 bg-primary-bg md:w-[600px] w-full border border-transparent">
        <InputLabel label={t("token_for_mint")} />
        <div className="flex flex-col gap-4 relative">
          <Popover
            placement="bottom-start"
            customOffset={5}
            isOpened={isPopoverOpened}
            setIsOpened={setPopoverOpened}
            trigger={
              <SelectButton
                ref={ref}
                onClick={() => setPopoverOpened(!isPopoverOpened)}
                fullWidth
                size="large"
                className={clsx(
                  "flex-shrink-0 pl-5 bg-tertiary-bg border border-transparent text-16 lg:text-16 lg:py-2",
                  isPopoverOpened && "bg-green-bg border-green shadow-green/60 shadow",
                )}
                isOpen={isPopoverOpened}
              >
                {tokenToMint?.symbol || tManage("select_token")}
              </SelectButton>
            }
          >
            <ScrollbarContainer
              height={172}
              className="bg-tertiary-bg rounded-3 py-1"
              style={{ width: ref.current?.getBoundingClientRect().width || 328 }}
            >
              {withoutWrapped.map((token) => {
                return (
                  <button
                    key={token.wrapped.address0}
                    onClick={() => {
                      setTokenToMint(token);
                      setPopoverOpened(false);
                    }}
                    className="flex w-full items-center gap-3 bg-tertiary-bg-bg hocus:bg-quaternary-bg duration-300 min-w-[250px] px-5 h-10 md:h-12 justify-between"
                  >
                    <span
                      className={
                        tokenToMint && token?.equals(tokenToMint)
                          ? "text-green"
                          : "text-secondary-text"
                      }
                    >
                      {token.symbol}
                    </span>
                    {tokenToMint && token?.equals(tokenToMint) && (
                      <Svg iconName="check" className="text-green" size={20} />
                    )}
                  </button>
                );
              })}
            </ScrollbarContainer>
          </Popover>

          <TextField
            label={t("amount_label")}
            helperText={`${tSwap("balance")} ${balance && tokenToMint ? `${formatFloat(formatUnits(balance, tokenToMint.decimals))} ${tokenToMint.symbol}` : "0"}`}
            readOnly
            value={amountToMint}
            onChange={(e) => setAmountToMint(e.target.value)}
            placeholder={tRevenue("amount")}
            internalText={tokenToMint?.symbol}
            isNumeric
          />

          {isConnected ? (
            <Button disabled={isLoading || isPending} onClick={handleMint}>
              {isLoading && (
                <span className="flex items-center gap-2">
                  <span>{tSwap("waiting_for_confirmation")}</span>
                  <Preloader color="green" />
                </span>
              )}
              {isPending && (
                <span className="flex items-center gap-2">
                  <span>{t("minting")}</span>
                  <Preloader color="green" />
                </span>
              )}
              {!isLoading && !isPending && t("mint")}
            </Button>
          ) : (
            <Button
              onClick={() => {
                setOpenedWallet(true);
              }}
            >
              {tWallet("connect_wallet")}
            </Button>
          )}
        </div>
      </div>
    </DrawerDialog>
  );
}
