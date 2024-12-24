import { isZeroAddress } from "@ethereumjs/util";
import { useTranslations } from "next-intl";
import React, { useMemo, useState } from "react";
import { Address, isAddress } from "viem";
import { useReadContract } from "wagmi";

import Checkbox from "@/components/atoms/Checkbox";
import DialogHeader from "@/components/atoms/DialogHeader";
import EmptyStateIcon from "@/components/atoms/EmptyStateIcon";
import ExternalTextLink from "@/components/atoms/ExternalTextLink";
import { InputSize } from "@/components/atoms/Input";
import Svg from "@/components/atoms/Svg";
import TextField from "@/components/atoms/TextField";
import Badge, { BadgeVariant } from "@/components/badges/Badge";
import Button, { ButtonSize } from "@/components/buttons/Button";
import IconButton, { IconButtonSize, IconButtonVariant } from "@/components/buttons/IconButton";
import { ManageTokensDialogContent } from "@/components/manage-tokens/types";
import { ERC20_ABI } from "@/config/abis/erc20";
import { ERC223_ABI } from "@/config/abis/erc223";
import { TOKEN_CONVERTER_ABI } from "@/config/abis/tokenConverter";
import { db } from "@/db/db";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import truncateMiddle from "@/functions/truncateMiddle";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { useTokenLists } from "@/hooks/useTokenLists";
import addToast from "@/other/toast";
import { CONVERTER_ADDRESS } from "@/sdk_hybrid/addresses";
import { Token } from "@/sdk_hybrid/entities/token";

interface Props {
  setContent: (content: ManageTokensDialogContent) => void;
  handleClose: () => void;
}

function EmptyState({
  tokenAddressToImport,
  isFound,
}: {
  tokenAddressToImport: string;
  isFound: boolean;
}) {
  const t = useTranslations("ManageTokens");

  if (!tokenAddressToImport) {
    return (
      <div className="flex-grow flex justify-center items-center flex-col gap-2 bg-empty-import-token bg-right-top bg-no-repeat max-md:bg-size-180 px-4 -mx-4 md:px-10 md:-mx-10 -mt-5 pt-5">
        <p className="text-secondary-text text-center">{t("to_import_a_token")}</p>
      </div>
    );
  }

  if (!isAddress(tokenAddressToImport)) {
    return (
      <div className="flex items-center justify-center gap-2 flex-col flex-grow">
        <EmptyStateIcon iconName="warning" />
        <span className="text-red-light">{t("enter_valid")}</span>
      </div>
    );
  }

  if (!isFound) {
    return (
      <div className="flex items-center justify-center gap-2 flex-col flex-grow bg-empty-not-found-token bg-right-top bg-no-repeat max-md:bg-size-180 px-4 -mx-4 md:px-10 md:-mx-10 -mt-5 pt-5">
        <span className="text-secondary-text">{t("token_not_found")}</span>
      </div>
    );
  }
}
export default function ImportToken({ setContent, handleClose }: Props) {
  const t = useTranslations("ManageTokens");
  const [tokenAddressToImport, setTokenAddressToImport] = useState("");
  const chainId = useCurrentChainId();
  const tokenLists = useTokenLists();

  const { data: tokenName, isFetched } = useReadContract({
    abi: ERC20_ABI,
    functionName: "name",
    chainId,
    address: tokenAddressToImport! as Address,
    query: {
      enabled: !!tokenAddressToImport && isAddress(tokenAddressToImport),
    },
  });

  const { data: tokenSymbol } = useReadContract({
    abi: ERC20_ABI,
    functionName: "symbol",
    address: tokenAddressToImport! as Address,
    chainId,
    query: {
      enabled: !!tokenAddressToImport && isAddress(tokenAddressToImport),
    },
  });

  const { data: tokenDecimals } = useReadContract({
    abi: ERC20_ABI,
    functionName: "decimals",
    address: tokenAddressToImport! as Address,
    chainId,
    query: {
      enabled: !!tokenAddressToImport && isAddress(tokenAddressToImport),
    },
  });

  const { data: standard } = useReadContract({
    abi: ERC223_ABI,
    functionName: "standard",
    address: tokenAddressToImport as Address,
    chainId,
    query: {
      enabled: !!tokenAddressToImport && isAddress(tokenAddressToImport),
    },
  });

  const { data: isWrapper } = useReadContract({
    abi: TOKEN_CONVERTER_ABI,
    functionName: "isWrapper",
    address: CONVERTER_ADDRESS[chainId],
    args: [tokenAddressToImport as Address],
    chainId,
    query: {
      enabled: !!tokenAddressToImport && isAddress(tokenAddressToImport),
    },
  });

  const otherAddressFunctionName = useMemo(() => {
    if (isWrapper == null) {
      return null;
    }

    if (isWrapper) {
      if (standard === 223) {
        return "getERC20OriginFor";
      }
      return "getERC223OriginFor";
    }

    return "predictWrapperAddress";
  }, [isWrapper, standard]);

  const otherAddressCheckFunctionName = useMemo(() => {
    if (otherAddressFunctionName !== "predictWrapperAddress") {
      return null;
    }

    if (standard === 223) {
      return "getERC20WrapperFor";
    }
    return "getERC223WrapperFor";
  }, [otherAddressFunctionName, standard]);

  const { data: otherAddress } = useReadContract({
    abi: TOKEN_CONVERTER_ABI,
    functionName: otherAddressCheckFunctionName!,
    address: CONVERTER_ADDRESS[chainId],
    args: [tokenAddressToImport as Address],
    chainId,
    query: {
      enabled:
        !!tokenAddressToImport &&
        isAddress(tokenAddressToImport) &&
        Boolean(otherAddressCheckFunctionName),
    },
  });

  const { data: predictedOtherAddress } = useReadContract({
    abi: TOKEN_CONVERTER_ABI,
    functionName: otherAddressFunctionName!,
    address: CONVERTER_ADDRESS[chainId],
    args: [tokenAddressToImport as Address, standard !== 223],
    chainId,
    query: {
      enabled:
        !!tokenAddressToImport &&
        isAddress(tokenAddressToImport) &&
        Boolean(otherAddressFunctionName),
    },
  });

  const { erc20AddressToImport, erc223AddressToImport, isErc20Exist, isErc223Exist } =
    useMemo(() => {
      if (standard === 223) {
        return {
          erc20AddressToImport: predictedOtherAddress,
          erc223AddressToImport: tokenAddressToImport,
          isErc20Exist: otherAddress && isAddress(otherAddress) && !isZeroAddress(otherAddress),
          isErc223Exist: true,
        };
      }

      return {
        erc223AddressToImport: predictedOtherAddress,
        erc20AddressToImport: tokenAddressToImport,
        isErc223Exist: otherAddress && isAddress(otherAddress) && !isZeroAddress(otherAddress),
        isErc20Exist: true,
      };
    }, [otherAddress, predictedOtherAddress, standard, tokenAddressToImport]);

  const [checkedUnderstand, setCheckedUnderstand] = useState<boolean>(false);

  const custom = useTokenLists(true);

  const alreadyImported = useMemo(() => {
    return !!(custom && custom?.[0]?.list.tokens.find((v) => v.address0 === tokenAddressToImport));
  }, [custom, tokenAddressToImport]);

  return (
    <>
      <DialogHeader
        onBack={() => setContent("default")}
        onClose={handleClose}
        title={t("import_token")}
      />
      <div className="w-full md:w-[600px] card-spacing min-h-[580px] flex flex-col">
        <TextField
          label={t("import_token")}
          size={InputSize.LARGE}
          value={tokenAddressToImport}
          onChange={(e) => setTokenAddressToImport(e.target.value)}
          placeholder={t("token_address_placeholder")}
          error={
            Boolean(tokenAddressToImport) && !isAddress(tokenAddressToImport)
              ? t("enter_in_correct_format")
              : ""
          }
        />

        <EmptyState
          tokenAddressToImport={tokenAddressToImport}
          isFound={Boolean(
            tokenName &&
              typeof tokenDecimals !== "undefined" &&
              tokenSymbol &&
              predictedOtherAddress,
          )}
        />

        {tokenName &&
          typeof tokenDecimals !== "undefined" &&
          tokenSymbol &&
          predictedOtherAddress && (
            <>
              <div className="flex-grow">
                <div className="flex items-center gap-3 pb-2.5 mt-0.5 mb-3">
                  <img
                    className="w-12 h-12"
                    width={48}
                    height={48}
                    src="/images/tokens/placeholder.svg"
                    alt=""
                  />
                  <div className="flex flex-col text-16">
                    <span className="text-primary-text">{tokenSymbol}</span>
                    <span className="text-secondary-text">
                      {tokenName} ({t("decimals_amount", { decimals: tokenDecimals })})
                    </span>
                  </div>
                </div>
                {!alreadyImported && erc223AddressToImport && erc20AddressToImport && (
                  <>
                    <div className="mb-4 flex flex-col gap-4 pl-5 pr-3 pb-5 pt-4 bg-tertiary-bg rounded-3">
                      <div className="grid grid-cols-[1fr_auto_32px] gap-y-1">
                        <span className="text-secondary-text flex items-center gap-1">
                          {t("address")} <Badge variant={BadgeVariant.COLORED} text="ERC-20" />{" "}
                        </span>
                        <ExternalTextLink
                          text={truncateMiddle(erc20AddressToImport)}
                          href={getExplorerLink(
                            ExplorerLinkType.ADDRESS,
                            erc20AddressToImport,
                            chainId,
                          )}
                          className="justify-between"
                        />
                        <IconButton
                          variant={IconButtonVariant.COPY}
                          buttonSize={IconButtonSize.SMALL}
                          text={erc20AddressToImport}
                        />
                        <span className="text-secondary-text flex items-center gap-1">
                          {t("address")}{" "}
                          <Badge variant={BadgeVariant.COLORED} text="ERC-223" color="green" />
                        </span>
                        {erc223AddressToImport && isErc223Exist && (
                          <>
                            <ExternalTextLink
                              text={truncateMiddle(erc223AddressToImport)}
                              href={getExplorerLink(
                                ExplorerLinkType.ADDRESS,
                                erc20AddressToImport,
                                chainId,
                              )}
                              className="justify-between"
                            />
                            <IconButton
                              variant={IconButtonVariant.COPY}
                              buttonSize={IconButtonSize.SMALL}
                              text={erc223AddressToImport}
                            />
                          </>
                        )}
                        {erc223AddressToImport && !isErc223Exist && (
                          <>
                            <span></span>
                            <span className="text-tertiary-text text-right flex w-8 items-center justify-center">
                              —
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="px-5 py-3 flex gap-2 rounded-1 border border-orange bg-orange-bg">
                      <Svg className="text-orange shrink-0" iconName="warning" />
                      <p className="text-16 text-secondary-text flex-grow">
                        {t("import_token_warning")}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-5 mt-5">
                {!alreadyImported && (
                  <Checkbox
                    checked={checkedUnderstand}
                    handleChange={() => setCheckedUnderstand(!checkedUnderstand)}
                    id="approve-list-import"
                    label={t("i_understand")}
                  />
                )}
                <Button
                  fullWidth
                  size={ButtonSize.MEDIUM}
                  disabled={!checkedUnderstand || alreadyImported}
                  onClick={async () => {
                    if (
                      chainId &&
                      tokenName &&
                      tokenDecimals &&
                      tokenSymbol &&
                      predictedOtherAddress
                    ) {
                      const currentCustomList = tokenLists?.find(
                        (t) => t.id === `custom-${chainId}`,
                      );

                      const token = new Token(
                        chainId,
                        tokenAddressToImport as Address,
                        predictedOtherAddress,
                        tokenDecimals,
                        tokenSymbol,
                        tokenName,
                        "/images/tokens/placeholder.svg",
                      );

                      if (!currentCustomList) {
                        await db.tokenLists.add({
                          id: `custom-${chainId}`,
                          enabled: true,
                          chainId,
                          list: {
                            name: "Custom token list",
                            version: {
                              minor: 0,
                              major: 0,
                              patch: 0,
                            },
                            tokens: [token],
                            logoURI: "/images/token-list-placeholder.svg",
                          },
                        });
                      } else {
                        (db.tokenLists as any).update(`custom-${chainId}`, {
                          "list.tokens": [...currentCustomList.list.tokens, token],
                        });
                      }
                    }
                    setContent("default");
                    addToast(t("imported_successfully"));
                  }}
                >
                  {alreadyImported
                    ? t("already_imported")
                    : t("import_symbol", { symbol: tokenSymbol })}
                </Button>
              </div>
            </>
          )}
      </div>
    </>
  );
}
