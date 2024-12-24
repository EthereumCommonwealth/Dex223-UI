import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { isAddress } from "viem";

import Checkbox from "@/components/atoms/Checkbox";
import EmptyStateIcon from "@/components/atoms/EmptyStateIcon";
import { InputSize, SearchInput } from "@/components/atoms/Input";
import Svg from "@/components/atoms/Svg";
import TextField from "@/components/atoms/TextField";
import Button, { ButtonSize } from "@/components/buttons/Button";
import { convertList } from "@/components/manage-tokens/scripts/convertTokenList";
import { ManageTokensDialogContent } from "@/components/manage-tokens/types";
import { db, TokenList } from "@/db/db";
import { IIFE } from "@/functions/iife";
import { fetchTokenList } from "@/hooks/useTokenLists";
import addToast from "@/other/toast";
interface Props {
  setContent: (content: ManageTokensDialogContent) => void;
}

function isValidUrl(url: string) {
  try {
    const newUrl = new URL(url);
    return (
      newUrl.protocol === "http:" || newUrl.protocol === "https:" || newUrl.protocol === "ipfs:"
    );
  } catch (err) {
    return false;
  }
}
export default function ImportListWithURL({ setContent }: Props) {
  const t = useTranslations("ManageTokens");

  const [tokenListAddressToImport, setTokenListAddressToImport] = useState<string>("");
  const [tokenListToImport, setTokenListToImport] = useState<TokenList | null>(null);
  const [checkedUnderstand, setCheckedUnderstand] = useState<boolean>(false);

  useEffect(() => {
    IIFE(async () => {
      try {
        if (!isValidUrl(tokenListAddressToImport)) {
          return;
        }

        const data = await convertList(tokenListAddressToImport);

        console.log(data);
        //TODO: Check that all tokens in list from same chain
        const listChainId = data.tokens[0].chainId;

        console.log(listChainId);
        if (data && listChainId) {
          setTokenListToImport({
            enabled: true,
            chainId: listChainId,
            list: data,
          });
        }
      } catch (e) {
        console.log(e);
      }
    });
  }, [tokenListAddressToImport]);

  const error = useMemo(() => {
    if (tokenListAddressToImport && !isValidUrl(tokenListAddressToImport)) {
      return "Enter a link in the format https:// or ipfs://";
    }

    return "";
  }, [tokenListAddressToImport]);

  const isNotFound = useMemo(() => {
    return !!(
      tokenListAddressToImport &&
      isValidUrl(tokenListAddressToImport) &&
      !tokenListToImport
    );
  }, [tokenListAddressToImport, tokenListToImport]);

  return (
    <div className="flex flex-col flex-grow">
      <TextField
        size={InputSize.LARGE}
        variant={"search"}
        label={t("import_with_URL")}
        value={tokenListAddressToImport}
        onChange={(e) => setTokenListAddressToImport(e.target.value)}
        placeholder={t("https_or_ipfs_placeholder")}
        error={error}
      />

      {tokenListToImport && (
        <>
          <div className="flex-grow card-spacing-x">
            <div className="flex items-center gap-3 py-2.5 mt-3 mb-3">
              <img
                className="w-12 h-12"
                width={48}
                height={48}
                src={tokenListToImport.list.logoURI}
                alt=""
              />
              <div className="flex flex-col text-16">
                <span className="text-primary-text">{tokenListToImport.list.name}</span>
                <span className="text-secondary-text">
                  {t("tokens_amount", { amount: tokenListToImport.list.tokens.length })}
                </span>
              </div>
            </div>
            <div className="px-5 py-3 flex gap-2 rounded-1 border border-orange bg-orange-bg">
              <Svg className="text-orange shrink-0" iconName="warning" />
              <p className="text-16 text-primary-text flex-grow">{t("adding_list_warning")}</p>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <Checkbox
              checked={checkedUnderstand}
              handleChange={() => setCheckedUnderstand(!checkedUnderstand)}
              id="approve-list-import"
              label={t("i_understand")}
            />
            <Button
              fullWidth
              size={ButtonSize.MEDIUM}
              disabled={!checkedUnderstand}
              onClick={() => {
                db.tokenLists.add(tokenListToImport);

                setContent("default");
                addToast(t("list_imported"));
              }}
            >
              {t("import_with_URL")}
            </Button>
          </div>
        </>
      )}

      {!tokenListToImport && !tokenListAddressToImport && (
        <div className="flex-grow flex justify-center items-center flex-col gap-2 bg-empty-url bg-right-top bg-no-repeat max-md:bg-size-180 px-4 -mx-4 md:px-10 md:-mx-10 -mt-5 pt-5">
          <p className="text-secondary-text text-center">{t("to_import_through_URL")}</p>
        </div>
      )}

      {tokenListAddressToImport && !isValidUrl(tokenListAddressToImport) && (
        <div className="flex-grow flex justify-center items-center flex-col gap-2">
          <EmptyStateIcon iconName="warning" />
          <p className="text-red-light text-center">Enter valid list location</p>
        </div>
      )}

      {isNotFound && (
        <div className="flex-grow flex justify-center items-center flex-col gap-2 bg-empty-not-found-list bg-right-top bg-no-repeat max-md:bg-size-180 px-4 -mx-4 md:px-10 md:-mx-10 -mt-5 pt-5">
          <p className="text-secondary-text text-center">List not found</p>
        </div>
      )}
    </div>
  );
}
