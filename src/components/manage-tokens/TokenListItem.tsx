import clsx from "clsx";
import download from "downloadjs";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { scroller } from "react-scroll";

import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import Popover from "@/components/atoms/Popover";
import Svg from "@/components/atoms/Svg";
import Switch from "@/components/atoms/Switch";
import TokenListLogo, { TokenListLogoType } from "@/components/atoms/TokenListLogo";
import Button, { ButtonColor, ButtonVariant } from "@/components/buttons/Button";
import { db, TokenList, TokenListId } from "@/db/db";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { useTokenLists } from "@/hooks/useTokenLists";
import addToast from "@/other/toast";
import { useManageTokensDialogStore } from "@/stores/useManageTokensDialogStore";

enum ListActionOption {
  VIEW,
  DOWNLOAD,
  REMOVE,
}

type Props =
  | {
      variant: ListActionOption.VIEW;
      href: string;
    }
  | {
      variant: ListActionOption.DOWNLOAD;
      handleDownload: () => void;
    }
  | {
      variant: ListActionOption.REMOVE;
      handleRemove: () => void;
    };

const commonClassName = "flex items-center gap-2 py-2 duration-200";
function ListPopoverOption(props: Props) {
  const t = useTranslations("ManageTokens");

  switch (props.variant) {
    case ListActionOption.DOWNLOAD:
      return (
        <button
          className={clsx(commonClassName, "text-primary-text hocus:text-green-hover")}
          onClick={() => props.handleDownload()}
        >
          {t("download")}
          <Svg iconName="download" />
        </button>
      );
    case ListActionOption.REMOVE:
      return (
        <button
          className={clsx(commonClassName, "text-red hocus:text-red-hover")}
          onClick={() => props.handleRemove()}
        >
          {t("remove")}
          <Svg iconName="delete" />
        </button>
      );
    case ListActionOption.VIEW:
      return (
        <a
          target="_blank"
          className={clsx(
            commonClassName,
            "text-green hocus:text-green-hover",
            props.href === "#" && "opacity-50 pointer-events-none",
          )}
          href={props.href}
        >
          {t("view_list")}
          <Svg iconName="next" />
        </a>
      );
  }
}
export default function TokenListItem({
  tokenList,
  toggle,
}: {
  tokenList: TokenList;
  toggle: any;
}) {
  const lists = useTokenLists();
  const t = useTranslations("ManageTokens");
  const [isPopoverOpened, setPopoverOpened] = useState(false);
  const [deleteOpened, setDeleteOpened] = useState(false);
  const { scrollTo, setScrollTo } = useManageTokensDialogStore();
  const chainId = useCurrentChainId();
  const [effect, setEffect] = useState(false);

  useEffect(() => {
    if (!!tokenList.id && scrollTo === tokenList.id) {
      setScrollTo(null);

      let scrollDuration;

      scroller.scrollTo(tokenList.id.toString(), {
        duration: (scrollDistanceInPx: number) => {
          console.log(scrollDistanceInPx);
          scrollDuration = scrollDistanceInPx * 2;
          return scrollDuration;
        },
        delay: 100,
        smooth: true,
        containerId: "manage-lists-container",
        offset: 0, // Scrolls to element + 50 pixels down the page
        // ... other options
      });

      setTimeout(() => {
        setEffect(true);
      }, scrollDuration);
    }
  }, [scrollTo, setScrollTo, tokenList.id]);

  return (
    <div
      onAnimationEnd={() => setEffect(false)}
      className={clsx(
        "flex justify-between py-1.5 rounded-3 bg-tertiary-bg px-4 md:px-5",
        effect ? "animate-list" : "",
      )}
      id={tokenList?.id?.toString()}
    >
      <div className="flex gap-3 items-center">
        {tokenList?.id?.toString()?.startsWith("default") && (
          <TokenListLogo type={TokenListLogoType.DEFAULT} chainId={tokenList.chainId} />
        )}
        {tokenList?.id?.toString()?.includes("autolisting") && (
          <TokenListLogo type={TokenListLogoType.AUTOLISTING} chainId={tokenList.chainId} />
        )}
        {tokenList?.id?.toString()?.startsWith("custom") && (
          <TokenListLogo type={TokenListLogoType.CUSTOM} chainId={tokenList.chainId} />
        )}
        {typeof tokenList.id === "number" && (
          <TokenListLogo type={TokenListLogoType.OTHER} url={tokenList.list.logoURI} />
        )}

        <div className="flex flex-col">
          <span className="text-14 md:text-16">{tokenList.list.name}</span>
          <div className="flex gap-1 items-center text-secondary-text text-12 md:text-16">
            {tokenList.list.tokens.length} tokens
            <Popover
              placement="top"
              isOpened={isPopoverOpened}
              setIsOpened={() => setPopoverOpened(!isPopoverOpened)}
              customOffset={12}
              trigger={
                <button
                  onClick={() => setPopoverOpened(true)}
                  className="text-secondary-text hocus:text-primary-text duration-200 relative"
                >
                  <Svg size={20} iconName="settings" />
                </button>
              }
            >
              <div className="flex flex-col gap-1 px-5 py-3 border-secondary-border border bg-primary-bg rounded-1 shadow-popover shadow-black/70">
                <ListPopoverOption
                  variant={ListActionOption.VIEW}
                  href={
                    tokenList.autoListingContract
                      ? getExplorerLink(
                          ExplorerLinkType.ADDRESS,
                          tokenList.autoListingContract,
                          tokenList.chainId,
                        )
                      : "#"
                  }
                />
                <ListPopoverOption
                  variant={ListActionOption.DOWNLOAD}
                  handleDownload={async () => {
                    const blob = new Blob([JSON.stringify(tokenList.list, null, 2)], {
                      type: "application/json",
                    });

                    download(blob, tokenList.list.name, "application/json");
                  }}
                />

                {tokenList.id !== `default-${chainId}` &&
                  tokenList.id !== `free-autolisting-${chainId}` &&
                  tokenList.id !== `core-autolisting-${chainId}` && (
                    <>
                      <ListPopoverOption
                        variant={ListActionOption.REMOVE}
                        handleRemove={() => {
                          const otherEnabledLists = lists?.filter(
                            (l) =>
                              Boolean(l.enabled) &&
                              Boolean(l.list.tokens.length) &&
                              l.id !== tokenList.id,
                          );

                          const totalTokensInOtherEnabledLists = otherEnabledLists?.reduce(
                            (accumulator, currentValue) =>
                              accumulator + currentValue.list.tokens.length,
                            0,
                          );

                          if (
                            tokenList.enabled &&
                            (!totalTokensInOtherEnabledLists || totalTokensInOtherEnabledLists < 2)
                          ) {
                            addToast("You can't delete this token list now", "warning");
                            return;
                          }
                          setDeleteOpened(true);
                        }}
                      />
                      <DrawerDialog isOpen={deleteOpened} setIsOpen={setDeleteOpened}>
                        <div className="w-full md:w-[600px]">
                          <DialogHeader
                            onClose={() => setDeleteOpened(false)}
                            title={t("removing_list")}
                          />
                          <div className="px-4 pb-4 md:px-10 md:pb-10">
                            <Image
                              className="mx-auto mt-5 mb-2"
                              src={tokenList.list.logoURI || ""}
                              alt=""
                              width={60}
                              height={60}
                            />
                            <p className="mb-5 text-center">
                              {t.rich("confirm_removing_list_text", {
                                list: tokenList.list.name,
                                bold: (chunks) => (
                                  <b className="whitespace-nowrap">&quot;{chunks}&quot;</b>
                                ),
                              })}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                colorScheme={ButtonColor.LIGHT_GREEN}
                                onClick={() => setDeleteOpened(false)}
                              >
                                {t("cancel")}
                              </Button>
                              <Button
                                colorScheme={ButtonColor.RED}
                                onClick={() => {
                                  db.tokenLists.delete(tokenList.id);
                                  setDeleteOpened(false);
                                }}
                              >
                                {t("confirm_removing")}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </DrawerDialog>
                    </>
                  )}
              </div>
            </Popover>
          </div>
        </div>
      </div>
      <div className="flex items-center">
        <Switch checked={tokenList.enabled} handleChange={() => toggle(tokenList.id)} />
      </div>
    </div>
  );
}
