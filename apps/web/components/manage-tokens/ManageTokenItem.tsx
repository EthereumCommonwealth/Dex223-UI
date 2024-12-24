import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";

import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import Svg from "@/components/atoms/Svg";
import Tooltip from "@/components/atoms/Tooltip";
import Button, { ButtonColor, ButtonVariant } from "@/components/buttons/Button";
import IconButton, { IconButtonVariant } from "@/components/buttons/IconButton";
import { db } from "@/db/db";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { useTokenLists } from "@/hooks/useTokenLists";
import addToast from "@/other/toast";
import { Currency } from "@/sdk_hybrid/entities/currency";
import { Token } from "@/sdk_hybrid/entities/token";

export default function ManageTokenItem({
  token,
  setTokenForPortfolio,
}: {
  token: Currency;
  setTokenForPortfolio: (token: Token) => void;
}) {
  const t = useTranslations("ManageTokens");
  const lists = useTokenLists();

  const [deleteOpened, setDeleteOpened] = useState(false);

  const chainId = useCurrentChainId();

  return (
    <div className="group">
      <div className="flex justify-between py-1.5">
        <div className="flex gap-3 items-center">
          <Image className="rounded-full" width={40} height={40} src={token.logoURI || ""} alt="" />
          <div className="flex flex-col">
            <span>{token.name}</span>
            <span className="text-secondary-text">{token.symbol}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {token.wrapped.lists?.includes(`custom-${chainId}`) && (
            <div className="group-hocus:opacity-100 opacity-0 duration-200">
              <IconButton
                variant={IconButtonVariant.DELETE}
                handleDelete={() => {
                  const otherEnabledLists = lists?.filter(
                    (l) => Boolean(l.enabled) && Boolean(l.list.tokens.length),
                  );

                  const totalTokensInOtherEnabledLists = otherEnabledLists?.reduce(
                    (accumulator, currentValue) => accumulator + currentValue.list.tokens.length,
                    0,
                  );

                  if (!totalTokensInOtherEnabledLists || totalTokensInOtherEnabledLists === 2) {
                    addToast("You can't delete this token now", "warning");
                    return;
                  }
                  setDeleteOpened(true);
                }}
              />
              <DrawerDialog isOpen={deleteOpened} setIsOpen={setDeleteOpened}>
                <div className="w-full md:w-[600px]">
                  <DialogHeader
                    onClose={() => setDeleteOpened(false)}
                    title={t("removing_custom_token")}
                  />
                  <div className="px-4 pb-4 md:px-10 md:pb-10">
                    <Image
                      className="mx-auto mt-5 mb-2"
                      src={token.logoURI || ""}
                      alt=""
                      width={60}
                      height={60}
                    />
                    <p className="mb-5 text-center">
                      {t.rich("confirm_removing_token_text", {
                        token: token.name,
                        bold: (chunks) => <b className="whitespace-nowrap">&quot;{chunks}&quot;</b>,
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
                        onClick={async () => {
                          const currentCustomTokens = await db.tokenLists.get(`custom-${chainId}`);

                          if (currentCustomTokens) {
                            await (db.tokenLists as any).update(`custom-${chainId}`, {
                              "list.tokens": currentCustomTokens.list.tokens.filter(
                                (t) => t.address0 !== token.wrapped.address0,
                              ),
                            });
                          }
                          setDeleteOpened(false);
                        }}
                      >
                        {t("remove")}
                      </Button>
                    </div>
                  </div>
                </div>
              </DrawerDialog>
            </div>
          )}
          {token.isToken && (
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
          )}

          {token.isToken && (
            <IconButton onClick={() => setTokenForPortfolio(token)} iconName="details" />
          )}
        </div>
      </div>
    </div>
  );
}
