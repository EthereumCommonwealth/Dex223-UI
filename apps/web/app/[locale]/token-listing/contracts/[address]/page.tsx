"use client";

import { isZeroAddress } from "@ethereumjs/util";
import ExternalTextLink from "@repo/ui/external-text-link";
import Tooltip from "@repo/ui/tooltip";
import Image from "next/image";
import React, { HTMLAttributes, ReactNode, use, useMemo, useState } from "react";
import { Address, formatUnits, isAddress } from "viem";
import { useReadContract } from "wagmi";

import { SingleAddressToken } from "@/app/[locale]/token-listing/add/hooks/useAutoListing";
import { useAutoListingContract } from "@/app/[locale]/token-listing/add/hooks/useAutoListingContracts";
import Container from "@/components/atoms/Container";
import { SearchInput } from "@/components/atoms/Input";
import Svg from "@/components/atoms/Svg";
import Badge, { BadgeVariant } from "@/components/badges/Badge";
import Button from "@/components/buttons/Button";
import IconButton, { IconButtonSize, IconButtonVariant } from "@/components/buttons/IconButton";
import { useTokenPortfolioDialogStore } from "@/components/dialogs/stores/useTokenPortfolioDialogStore";
import { ERC223_ABI } from "@/config/abis/erc223";
import { TOKEN_CONVERTER_ABI } from "@/config/abis/tokenConverter";
import { TokenListId } from "@/db/db";
import { clsxMerge } from "@/functions/clsxMerge";
import { formatFloat } from "@/functions/formatFloat";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import { filterTokens } from "@/functions/searchTokens";
import truncateMiddle from "@/functions/truncateMiddle";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { useTokenLists } from "@/hooks/useTokenLists";
import { Link } from "@/i18n/routing";
import { CONVERTER_ADDRESS } from "@/sdk_hybrid/addresses";
import { Token } from "@/sdk_hybrid/entities/token";

interface TokenListInfoCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  value: ReactNode;
}
function TokenListInfoCard({ title, value, className, ...props }: TokenListInfoCardProps) {
  return (
    <div
      {...props}
      className={clsxMerge("bg-tertiary-bg rounded-3 px-5 py-4 flex flex-col", className)}
    >
      <h3 className="text-tertiary-text">{title}</h3>
      <span className="text-secondary-text text-20 font-medium">{value}</span>
    </div>
  );
}

function TableRow({ children, className }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsxMerge(
        "grid grid-cols-[minmax(300px,2fr)_minmax(198px,1fr)_minmax(198px,1fr)_minmax(67px,max-content)_minmax(54px,max-content)] pl-5 py-2 pr-2 gap-6 rounded-3 bg-primary-bg",
        className,
      )}
    >
      {children}
    </div>
  );
}

function TokenSymbolButton({ tokenToPay }: { tokenToPay: SingleAddressToken }) {
  const { handleOpen } = useTokenPortfolioDialogStore();

  const { data: standard } = useReadContract({
    abi: ERC223_ABI,
    functionName: "standard",
    address: tokenToPay.address as Address,
    chainId: tokenToPay.chainId,
    query: {
      enabled: !!tokenToPay.address && isAddress(tokenToPay.address),
    },
  });

  const { data: isWrapper } = useReadContract({
    abi: TOKEN_CONVERTER_ABI,
    functionName: "isWrapper",
    address: CONVERTER_ADDRESS[tokenToPay.chainId],
    args: [tokenToPay.address as Address],
    chainId: tokenToPay.chainId,
    query: {
      enabled: !!tokenToPay.address && isAddress(tokenToPay.address),
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
    address: CONVERTER_ADDRESS[tokenToPay.chainId],
    args: [tokenToPay.address as Address],
    chainId: tokenToPay.chainId,
    query: {
      enabled:
        !!tokenToPay.address &&
        isAddress(tokenToPay.address) &&
        Boolean(otherAddressCheckFunctionName),
    },
  });

  const { data: predictedOtherAddress } = useReadContract({
    abi: TOKEN_CONVERTER_ABI,
    functionName: otherAddressFunctionName!,
    address: CONVERTER_ADDRESS[tokenToPay.chainId],
    args: [tokenToPay.address as Address, standard !== 223],
    chainId: tokenToPay.chainId,
    query: {
      enabled:
        !!tokenToPay.address && isAddress(tokenToPay.address) && Boolean(otherAddressFunctionName),
    },
  });

  const { erc20AddressToImport, erc223AddressToImport, isErc20Exist, isErc223Exist } =
    useMemo(() => {
      if (standard === 223) {
        return {
          erc20AddressToImport: predictedOtherAddress,
          erc223AddressToImport: tokenToPay.address,
          isErc20Exist: otherAddress && isAddress(otherAddress) && !isZeroAddress(otherAddress),
          isErc223Exist: true,
        };
      }

      return {
        erc223AddressToImport: predictedOtherAddress,
        erc20AddressToImport: tokenToPay.address,
        isErc223Exist: otherAddress && isAddress(otherAddress) && !isZeroAddress(otherAddress),
        isErc20Exist: true,
      };
    }, [otherAddress, predictedOtherAddress, standard, tokenToPay.address]);

  const tokenLists = useTokenLists();

  return (
    <>
      <button
        className="rounded-2 bg-quaternary-bg py-1 flex items-center justify-center hocus:bg-green-bg hocus:text-primary-text text-secondary-text duration-200"
        onClick={() =>
          handleOpen(
            new Token(
              tokenToPay.chainId,
              erc20AddressToImport || tokenToPay.address,
              erc223AddressToImport || tokenToPay.address,
              tokenToPay.decimals,
              tokenToPay.symbol,
              tokenToPay.name,
              "/images/tokens/placeholder.svg",
              tokenLists
                ?.filter((tokenList) => {
                  return !!tokenList.list.tokens.find(
                    (t) =>
                      t.address0.toLowerCase() === tokenToPay.address.toLowerCase() ||
                      t.address1.toLowerCase() === tokenToPay.address.toLowerCase(),
                  );
                })
                .map((t) => t.id),
            ),
          )
        }
      >
        {tokenToPay.symbol}
      </button>
      <div className="flex items-center">
        <Badge
          variant={BadgeVariant.COLORED}
          color="green"
          text={
            tokenToPay.address && isZeroAddress(tokenToPay.address)
              ? "Native"
              : standard === 20
                ? "ERC-20"
                : "ERC-223"
          }
        />
      </div>
    </>
  );
}
export default function AutoListingContractDetails({
  params,
}: {
  params: Promise<{
    address: Address;
  }>;
}) {
  const tokenLists = useTokenLists();
  const chainId = useCurrentChainId();

  const [searchValue, setSearchValue] = useState("");
  const { handleOpen } = useTokenPortfolioDialogStore();

  const listingContract = useAutoListingContract(use(params).address);

  const tokens = useMemo(() => {
    if (!listingContract) {
      return [];
    }

    return listingContract.tokens.map((token) => {
      let lists: TokenListId[] = [];

      if (tokenLists) {
        lists = tokenLists
          .filter((list) =>
            list.list.tokens.find((t) => t.address0.toLowerCase() === token.address0.toLowerCase()),
          )
          .map((t) => t.id);
      }

      return new Token(
        token.chainId,
        token.address0,
        token.address1,
        +token.decimals,
        token.symbol,
        token.name,
        "/images/tokens/placeholder.svg",
        lists,
      );
    });
  }, [listingContract, tokenLists]);

  const filteredTokens = useMemo(() => {
    return filterTokens(searchValue, tokens);
  }, [searchValue, tokens]);

  if (!listingContract) {
    return <div>Whoops, this autolisting not found.</div>;
  }

  return (
    <>
      <Container>
        <div className="mb-2 mt-4 xl:my-10 px-4 flex">
          <Link href="/token-listing/contracts">
            <span className="flex items-center gap-2 text-secondary-text hocus:text-green-hover duration-200">
              <Svg iconName="back" />
              Back to token listing
            </span>
          </Link>
        </div>
        <div className="my-2 xl:my-10 px-4">
          <div className="flex justify-between mb-2 xl:mb-5">
            <h1 className="text-24 xl:text-40 font-medium">Listing contract details</h1>
            <Link
              className="hidden xl:block"
              href={`/token-listing/add/?autoListingContract=${use(params).address}&dest=${encodeURIComponent(`/token-listing/contracts/${use(params).address}`)}`}
            >
              <Button>List token(s)</Button>
            </Link>
          </div>
          <div className="bg-primary-bg rounded-5 grid xl:grid-cols-5 xl:grid-areas-[first_first_first_first_first,second_third_fourth_fifth_sixth] pb-4 px-4 pt-3 xl:p-5 gap-3 mb-4 xl:mb-10 grid-cols-2 grid-areas-[first_first,second_second,third_fourth,fifth_sixth]">
            <div className="flex flex-col justify-center grid-in-[first]">
              <h3 className="text-18 md:text-20 font-medium">{listingContract.name}</h3>
              <p className="text-secondary-text">{listingContract.totalTokens} tokens</p>
            </div>
            <TokenListInfoCard
              title="Chain"
              value="Sepolia"
              className="grid-in-[third] xl:grid-in-[second]"
            />
            <TokenListInfoCard
              title="Source"
              value={
                <span className="flex items-center">
                  <ExternalTextLink
                    text={truncateMiddle(use(params).address, {
                      charsFromEnd: 3,
                      charsFromStart: 3,
                    })}
                    href="#"
                  />{" "}
                  <IconButton variant={IconButtonVariant.COPY} text={use(params).address} />{" "}
                </span>
              }
              className="grid-in-[second] xl:grid-in-[third] justify-between flex-row items-center xl:flex-col xl:items-start"
            />
            <TokenListInfoCard
              title="Last updated"
              value={new Date(+listingContract.lastUpdated * 1000).toLocaleString("en-us", {
                month: "short",
                year: "numeric",
                day: "numeric",
              })}
              className="grid-in-[fourth]"
            />
            <TokenListInfoCard title="Version" value="1.0.0" className="grid-in-[fifth]" />
            <TokenListInfoCard
              title="Listing type"
              value={listingContract.isFree ? "Free" : "Paid"}
              className="grid-in-[sixth]"
            />
          </div>
          <Link
            className="block w-full xl:hidden mb-6"
            href={`/token-listing/add/?autoListingContract=${use(params).address}`}
          >
            <Button fullWidth>List token(s)</Button>
          </Link>
          {!listingContract.isFree && (
            <>
              <div className="mb-2 xl:mb-5">
                <h1 className="text-18 xl:text-32 font-medium">Listing price</h1>
              </div>
              <div className="px-5 pb-5 pt-3 bg-primary-bg rounded-5 mb-10">
                <div className="flex items-center gap-1 mb-3">
                  <h3 className="text-secondary-text ">
                    {listingContract.tokensToPay.length} tokens available to pay for listing
                  </h3>
                  <Tooltip text="You can only pay for the listing in one of the specified accepted assets." />
                </div>
                <div className="flex flex-col sm:grid sm:grid-cols-[minmax(224px,1fr)_minmax(224px,1fr)] md:grid-cols-[minmax(224px,1fr)_minmax(224px,1fr)_minmax(224px,1fr)] xl:grid-cols-[minmax(284px,1fr)_minmax(284px,1fr)_minmax(284px,1fr)_minmax(284px,1fr)] gap-x-2 gap-y-3">
                  {listingContract.tokensToPay.map((tokenToPay, index) => {
                    return (
                      <div
                        key={index}
                        className="bg-tertiary-bg grid grid-cols-[1fr_91px_68px] gap-2 py-2 pr-2 pl-3 rounded-3"
                      >
                        <div className="flex items-center">
                          {formatUnits(tokenToPay.price, tokenToPay.token.decimals).slice(0, 7) ===
                          "0.00000"
                            ? truncateMiddle(
                                formatUnits(tokenToPay.price, tokenToPay.token.decimals),
                                {
                                  charsFromStart: 4,
                                  charsFromEnd: 3,
                                },
                              )
                            : formatFloat(formatUnits(tokenToPay.price, tokenToPay.token.decimals))}
                        </div>

                        <TokenSymbolButton tokenToPay={tokenToPay.token} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <div>
            <div>
              <div className="flex justify-between mb-4 xl:mb-5 flex-col xl:flex-row">
                <h1 className="text-18 xl:text-32 font-medium mb-2 xl:mb-0">Tokens</h1>
                {!!listingContract.tokens.length && (
                  <div className="w-full md:w-[480px]">
                    <SearchInput
                      className="bg-tertiary-bg"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      placeholder="Search name or paste contract"
                    />
                  </div>
                )}
              </div>
            </div>
            {searchValue && !filteredTokens.length && (
              <div className="h-[340px] flex items-center rounded-5 bg-primary-bg justify-center flex-col bg-no-repeat bg-right-top bg-empty-not-found-token max-md:bg-size-180">
                <span className="text-secondary-text">No tokens found</span>
              </div>
            )}
            {Boolean(
              !!listingContract.tokens.length &&
                (!searchValue || (searchValue && filteredTokens.length)),
            ) && (
              <>
                <div className="xl:hidden flex flex-col gap-4">
                  {filteredTokens.map((token: Token, index: number) => {
                    return (
                      <div
                        key={token.address0}
                        className="bg-primary-bg rounded-3 pt-2 pl-4 pb-4 pr-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Image
                              width={32}
                              height={32}
                              src="/images/tokens/placeholder.svg"
                              alt=""
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{token.name}</span>
                              <span className="text-secondary-text text-12">{token.symbol}</span>
                            </div>
                          </div>

                          <div className="flex items-center">
                            <Tooltip
                              text={`Token belongs to ${token.lists?.length || 1} token lists`}
                              renderTrigger={(ref, refProps) => {
                                return (
                                  <span
                                    onClick={(e) => e.stopPropagation()}
                                    ref={ref.setReference}
                                    {...refProps}
                                    className="flex gap-0.5 items-center text-secondary-text text-14 cursor-pointer"
                                  >
                                    {token.lists?.length || 1}
                                    <Svg className="text-tertiary-text" iconName="list" />
                                  </span>
                                );
                              }}
                            />
                            <div className="flex items-center justify-end p-2">
                              <Tooltip
                                text={"Token details"}
                                renderTrigger={(ref, refProps) => {
                                  return (
                                    <div
                                      ref={ref.setReference}
                                      {...refProps}
                                      className="w-10 h-10 flex items-center justify-center"
                                    >
                                      <IconButton
                                        onClick={() => handleOpen(token)}
                                        iconName="details"
                                      />
                                    </div>
                                  );
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 ">
                          <div className="bg-tertiary-bg pb-1 pl-4 pt-2.5 rounded-2">
                            <div className="flex items-center gap-2 text-secondary-text text-14">
                              Address
                              <Badge size="small" variant={BadgeVariant.COLORED} text="ERC-20" />
                            </div>
                            <div className="flex items-center text-14 -mt-0.5">
                              <ExternalTextLink
                                text={truncateMiddle(token.address0, {
                                  charsFromStart: 3,
                                  charsFromEnd: 3,
                                })}
                                href={getExplorerLink(
                                  ExplorerLinkType.ADDRESS,
                                  token.address0,
                                  chainId,
                                )}
                              />{" "}
                              <IconButton
                                buttonSize={IconButtonSize.SMALL}
                                variant={IconButtonVariant.COPY}
                                text={token.address0}
                              />
                            </div>
                          </div>
                          <div className="bg-tertiary-bg pb-1 pl-4 pt-2.5 rounded-2">
                            <div className="flex items-center gap-2 text-secondary-text text-14">
                              Address
                              <Badge size="small" variant={BadgeVariant.COLORED} text="ERC-223" />
                            </div>
                            <div className="flex items-center text-14 -mt-0.5">
                              <ExternalTextLink
                                text={truncateMiddle(token.address1, {
                                  charsFromStart: 3,
                                  charsFromEnd: 3,
                                })}
                                href={getExplorerLink(
                                  ExplorerLinkType.ADDRESS,
                                  token.address1,
                                  chainId,
                                )}
                              />{" "}
                              <IconButton
                                buttonSize={IconButtonSize.SMALL}
                                variant={IconButtonVariant.COPY}
                                text={token.address1}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="hidden xl:contents">
                  <div className="grid px-5 py-2.5 bg-tertiary-bg rounded-t-5">
                    <TableRow className="bg-tertiary-bg text-tertiary-text">
                      <div>Name</div>
                      <div className="flex items-center gap-2">
                        Address
                        <Badge variant={BadgeVariant.COLORED} color="green" text="ERC-20" />
                      </div>
                      <div className="flex items-center gap-2">
                        Address
                        <Badge variant={BadgeVariant.COLORED} color="green" text="ERC-223" />
                      </div>
                      <div>Found in</div>
                      <div>Details</div>
                    </TableRow>
                  </div>

                  <div className="bg-primary-bg rounded-b-5 py-2.5 px-5">
                    {filteredTokens.map((token: Token, index: number) => {
                      return (
                        <TableRow key={index} className={index % 2 !== 0 ? "bg-tertiary-bg" : ""}>
                          <div className="flex items-center gap-2">
                            <Image
                              width={24}
                              height={24}
                              src="/images/tokens/placeholder.svg"
                              alt=""
                            />
                            <span className="font-medium">{token.name}</span>
                            <span className="text-tertiary-text">{token.symbol}</span>
                          </div>
                          <div className="flex items-center">
                            <ExternalTextLink
                              textClassname="w-[13ch]"
                              text={truncateMiddle(token.address0)}
                              href={getExplorerLink(
                                ExplorerLinkType.ADDRESS,
                                token.address0,
                                chainId,
                              )}
                            />{" "}
                            <IconButton variant={IconButtonVariant.COPY} text={token.address0} />
                          </div>
                          <div className="flex items-center">
                            <ExternalTextLink
                              textClassname="w-[13ch]"
                              text={truncateMiddle(token.address1)}
                              href={getExplorerLink(
                                ExplorerLinkType.ADDRESS,
                                token.address1,
                                chainId,
                              )}
                            />{" "}
                            <IconButton variant={IconButtonVariant.COPY} text={token.address1} />
                          </div>
                          <div className="flex items-center">{token.lists?.length || 0} list</div>
                          <div className="flex items-center justify-end">
                            {" "}
                            <Tooltip
                              text={"Token details"}
                              renderTrigger={(ref, refProps) => {
                                return (
                                  <div
                                    ref={ref.setReference}
                                    {...refProps}
                                    className="w-10 h-10 flex items-center justify-center"
                                  >
                                    <IconButton
                                      onClick={() => handleOpen(token)}
                                      iconName="details"
                                    />
                                  </div>
                                );
                              }}
                            />
                          </div>
                        </TableRow>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {!listingContract.tokens.length && (
              <div className="flex items-center justify-center min-h-[340px] bg-primary-bg flex-col gap-2 rounded-5 bg-empty-no-tokens bg-no-repeat bg-right-top max-md:bg-size-180">
                <span className="text-secondary-text">No listed tokens yet</span>
              </div>
            )}
          </div>
        </div>
      </Container>
    </>
  );
}
