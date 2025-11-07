import { useQuery } from "@apollo/client";
import Alert from "@repo/ui/alert";
import Checkbox from "@repo/ui/checkbox";
import clsx from "clsx";
import gql from "graphql-tag";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { isAddress } from "viem";

import EmptyStateIcon from "@/components/atoms/EmptyStateIcon";
import { InputSize } from "@/components/atoms/Input";
import Svg from "@/components/atoms/Svg";
import TextField from "@/components/atoms/TextField";
import Button, { ButtonSize } from "@/components/buttons/Button";
import { ManageTokensDialogContent } from "@/components/manage-tokens/types";
import { db } from "@/db/db";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import useAutoListingApolloClient from "@/hooks/useAutoListingApolloClient";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { useTokenLists } from "@/hooks/useTokenLists";
import addToast from "@/other/toast";
import { Token } from "@/sdk_bi/entities/token";

const query = gql(`
  query AutoListings($address: String!) {
    autoListings(where: { id: $address }) {
      id
      owner
      name
      lastUpdated
      totalTokens
      tokens {
        timestamp
        token {
          addressERC20
          addressERC223
          name
          symbol
          decimals
          numberAdditions
        }
      }
    }
  }
`);

interface Props {
  setContent: (content: ManageTokensDialogContent) => void;
}
export default function ImportListWithContract({ setContent }: Props) {
  const t = useTranslations("ManageTokens");
  const tokenLists = useTokenLists();

  const chainId = useCurrentChainId();
  const [addressToImport, setAddressToImport] = useState("");
  const [checkedUnderstand, setCheckedUnderstand] = useState<boolean>(false);

  const client = useAutoListingApolloClient();

  const { data, loading } = useQuery(query, {
    variables: {
      address: addressToImport.toLowerCase(),
    },
    client,
  });

  const error = useMemo(() => {
    if (addressToImport && !isAddress(addressToImport)) {
      return "Enter contract address in correct format";
    }

    if (
      addressToImport &&
      isAddress(addressToImport) &&
      !loading &&
      !Boolean(data?.autoListings?.[0])
    ) {
      return "Contract address does not contain a token list";
    }

    return "";
  }, [addressToImport, data?.autoListings, loading]);

  const alreadyImportedList = useMemo(() => {
    return tokenLists?.find((tokenList) => {
      return tokenList.autoListingContract?.toLowerCase() === addressToImport.toLowerCase();
    });
  }, [addressToImport, tokenLists]);

  return (
    <div className="flex flex-col flex-grow">
      <TextField
        size={InputSize.LARGE}
        variant="search"
        label="Import token list from contract"
        type="text"
        value={addressToImport}
        onChange={(e) => {
          setAddressToImport(e.target.value);
        }}
        placeholder="Contract address"
        error={error}
      />

      {!addressToImport && (
        <div className="flex-grow flex justify-center items-center flex-col gap-2 bg-empty-import-list bg-no-repeat bg-right-top max-md:bg-size-180 px-4 -mx-4 md:px-10 md:-mx-10 -mt-5 pt-5">
          <p className="text-secondary-text text-center">
            To import a list through a contract, enter contract address in correct format
          </p>
        </div>
      )}

      {addressToImport && !isAddress(addressToImport) && (
        <div className="flex-grow flex justify-center items-center flex-col gap-2">
          <EmptyStateIcon iconName="warning" />
          <p className="text-red-light text-center">Enter valid contract address</p>
        </div>
      )}

      {addressToImport &&
        isAddress(addressToImport) &&
        !loading &&
        !Boolean(data?.autoListings?.[0]) && (
          <div className="flex-grow flex justify-center items-center flex-col gap-2">
            <EmptyStateIcon iconName="warning" />
            <p className="text-red-light text-center">
              Contract address does not contain a token list
            </p>
          </div>
        )}

      {!!alreadyImportedList && addressToImport && (
        <>
          <div className="flex-grow">
            <div className="flex justify-between items-center pb-2.5 mb-3">
              <div className="flex items-center gap-3">
                <img
                  className="w-12 h-12"
                  width={48}
                  height={48}
                  src="/images/token-list-placeholder.svg"
                  alt=""
                />
                <div className="flex flex-col text-16">
                  <span className="text-primary-text">{alreadyImportedList.list.name}</span>
                  <span className="text-secondary-text">
                    {t("tokens_amount", { amount: alreadyImportedList.list.tokens.length })}
                  </span>
                </div>
              </div>
              <a
                target="_blank"
                className={clsx(
                  "flex items-center gap-2 py-2 duration-200",
                  "text-green hocus:text-green-hover",
                )}
                href={getExplorerLink(ExplorerLinkType.ADDRESS, addressToImport, chainId)}
              >
                {t("view_list")}
                <Svg iconName="next" />
              </a>
            </div>

            <Alert
              text={
                "This token list has already been imported. You cannot import same autolisting contract twice."
              }
              type={"info"}
            />
          </div>
          <Button fullWidth disabled size={ButtonSize.MEDIUM}>
            List already imported
          </Button>
        </>
      )}

      {Boolean(data?.autoListings?.[0]) && !alreadyImportedList && (
        <>
          <div className="flex-grow">
            <div className="flex items-center gap-3 pb-2.5 mb-3">
              <img
                className="w-12 h-12"
                width={48}
                height={48}
                src="/images/token-list-placeholder.svg"
                alt=""
              />
              <div className="flex flex-col text-16">
                <span className="text-primary-text">
                  {" "}
                  {data?.autoListings?.[0].name === "unknown"
                    ? `Autolisting ${data?.autoListings?.[0].id.toLowerCase().slice(0, 6)}...${data?.autoListings?.[0].id.toLowerCase().slice(-6)}`
                    : data?.autoListings?.[0].name}
                </span>
                <span className="text-secondary-text">
                  {t("tokens_amount", { amount: data?.autoListings?.[0].tokens.length })}
                </span>
              </div>
            </div>
            <Alert text={t("adding_list_warning")} type={"warning"} />
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
              disabled={!checkedUnderstand}
              size={ButtonSize.LARGE}
              onClick={async () => {
                const queryRes = data?.autoListings?.[0];
                if (!queryRes) {
                  addToast("Something went wrong, please, contact support");
                  return;
                }
                await db.tokenLists.add({
                  autoListingContract: queryRes.id.toLowerCase(),
                  lastUpdated: queryRes.lastUpdated,
                  list: {
                    logoURI: "/images/token-list-placeholder.svg",
                    name:
                      queryRes.name === "unknown"
                        ? `Autolisting ${queryRes.id.toLowerCase().slice(0, 6)}...${queryRes.id.toLowerCase().slice(-6)}`
                        : queryRes.name,
                    version: {
                      major: 0,
                      minor: 0,
                      patch: 1,
                    },
                    tokens: queryRes.tokens.map(({ token }: any) => {
                      return new Token(
                        chainId,
                        token.addressERC20,
                        token.addressERC223,
                        +token.decimals,
                        token.symbol,
                        token.name,
                        "/images/tokens/placeholder.svg",
                      );
                    }),
                  },
                  chainId,
                  enabled: true,
                });
                addToast("Tokenlist imported successfully!");
                setContent("default");
              }}
            >
              {t("import_list")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
