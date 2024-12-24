import Image from "next/image";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import ExternalTextLink from "@/components/atoms/ExternalTextLink";
import Svg from "@/components/atoms/Svg";
import TokenListLogo, { TokenListLogoType } from "@/components/atoms/TokenListLogo";
import Badge, { BadgeVariant } from "@/components/badges/Badge";
import IconButton, {
  IconButtonSize,
  IconButtonVariant,
  IconSize,
} from "@/components/buttons/IconButton";
import { useTokenPortfolioDialogStore } from "@/components/dialogs/stores/useTokenPortfolioDialogStore";
import { TokenListId } from "@/db/db";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import { useTokenLists } from "@/hooks/useTokenLists";
import { Token } from "@/sdk_hybrid/entities/token";
import { useManageTokensDialogStore } from "@/stores/useManageTokensDialogStore";

function TokenListInfo({ listId }: { listId: TokenListId }) {
  const t = useTranslations("ManageTokens");
  const tokenLists = useTokenLists();

  const tokenList = useMemo(() => {
    return tokenLists?.find((tl) => tl.id === listId);
  }, [listId, tokenLists]);
  const { isOpen, setIsOpen, setActiveTab, activeTab, content, setScrollTo, setContent } =
    useManageTokensDialogStore();
  const { handleClose } = useTokenPortfolioDialogStore();
  return (
    <div className="flex justify-between w-full flex-col xs:flex-row bg-tertiary-bg rounded-3 xs:bg-transparent pb-1.5 pt-2 pl-4 xs:p-0">
      <div className="flex gap-2 md:gap-3 items-center">
        {tokenList?.id?.toString()?.startsWith("default") && (
          <TokenListLogo type={TokenListLogoType.DEFAULT} chainId={tokenList.chainId} />
        )}
        {tokenList?.id?.toString()?.includes("autolisting") && (
          <TokenListLogo type={TokenListLogoType.AUTOLISTING} chainId={tokenList.chainId} />
        )}
        {tokenList?.id?.toString()?.startsWith("custom") && (
          <TokenListLogo type={TokenListLogoType.CUSTOM} chainId={tokenList.chainId} />
        )}
        {typeof tokenList?.id === "number" && (
          <TokenListLogo type={TokenListLogoType.OTHER} url={tokenList.list.logoURI} />
        )}

        <div className="flex flex-col">
          <div className="table table-fixed w-full">
            <span className="text-14 md:text-16 table-cell whitespace-nowrap overflow-ellipsis overflow-hidden">
              {tokenList?.list.name}
            </span>
          </div>
          <div className="flex gap-1 items-cente text-secondary-text text-12 md:text-16">
            {t("tokens_amount", { amount: tokenList?.list.tokens.length })}
          </div>
        </div>
      </div>
      <button
        onClick={() => {
          setIsOpen(true);
          setActiveTab(0);
          setContent("default");
          setScrollTo(tokenList?.id || null);
          handleClose();
        }}
        className="pl-12 text-12 md:text-16 md:pl-0 text-secondary-text hocus:text-green-hover duration-200 flex items-center gap-2 flex-shrink-0"
      >
        Manage list
        {
          <span className="md:hidden">
            <Svg size={20} iconName="next" />
          </span>
        }
        {
          <span className="hidden md:inline">
            <Svg size={24} iconName="next" />
          </span>
        }
      </button>
    </div>
  );
}

export function TokenPortfolioDialogContent({ token }: { token: Token }) {
  const t = useTranslations("ManageTokens");

  return (
    <div className="w-full md:w-[600px]">
      <div className="px-4 pb-5 md:px-10 flex flex-col gap-2">
        <div className="flex justify-between">
          <span className="text-secondary-text">{t("symbol")}</span>
          <span>{token.symbol}</span>
        </div>
        <div className="grid grid-cols-[1fr_auto_32px] gap-x-2 -mr-1 gap-y-1">
          <span className="text-secondary-text flex items-center gap-1">
            {t("address")} <Badge variant={BadgeVariant.COLORED} text="ERC-20" />{" "}
          </span>
          <ExternalTextLink
            text={`${token.address0.slice(0, 6)}...${token.address0.slice(-6)}`}
            href={getExplorerLink(ExplorerLinkType.ADDRESS, token.address0, token.chainId)}
            className="justify-between"
          />
          <IconButton
            iconSize={IconSize.REGULAR}
            variant={IconButtonVariant.COPY}
            buttonSize={IconButtonSize.SMALL}
            text={token.address0}
          />
          <span className="text-secondary-text flex items-center gap-1">
            {t("address")} <Badge variant={BadgeVariant.COLORED} text="ERC-223" />{" "}
          </span>
          <ExternalTextLink
            text={`${token.address1.slice(0, 6)}...${token.address1.slice(-6)}`}
            href={getExplorerLink(ExplorerLinkType.ADDRESS, token.address1, token.chainId)}
          />
          <IconButton
            iconSize={IconSize.REGULAR}
            variant={IconButtonVariant.COPY}
            buttonSize={IconButtonSize.SMALL}
            text={token.address1}
          />
        </div>
        <div className="flex justify-between">
          <span className="text-secondary-text">{t("decimals")}</span>
          <span>{token.decimals}</span>
        </div>
      </div>
      <div className="mx-4 md:mx-10 bg-secondary-border h-px" />
      <p className="text-secondary-text card-spacing-x py-3">
        {t("found_in", { amount: token.lists?.length })}
      </p>
      <div className="flex flex-col gap-3 card-spacing">
        {token.lists?.map((listId) => {
          return (
            <div className="flex gap-3 items-center justify-between" key={listId}>
              <TokenListInfo listId={listId} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TokenPortfolioDialog() {
  const { token, isOpen, handleClose } = useTokenPortfolioDialogStore();

  return (
    <DrawerDialog isOpen={isOpen} setIsOpen={handleClose}>
      <DialogHeader
        titlePosition="center"
        onClose={handleClose}
        title={
          <span className="flex items-center gap-2">
            <Image
              width={32}
              height={32}
              src={token?.logoURI || "/images/tokens/placeholder.svg"}
              alt=""
            />
            {token?.name || "Unknown"}
          </span>
        }
      />
      {token && <TokenPortfolioDialogContent token={token} />}
    </DrawerDialog>
  );
}
