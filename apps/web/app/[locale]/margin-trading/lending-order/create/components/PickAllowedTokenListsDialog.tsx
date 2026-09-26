import ExternalTextLink from "@repo/ui/external-text-link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { useAllowedTokenListsDialogOpenedStore } from "@/app/[locale]/margin-trading/stores/dialogStates";
import { AutoListing } from "@/app/[locale]/token-listing/add/hooks/useAutoListing";
import useAutoListingContracts from "@/app/[locale]/token-listing/add/hooks/useAutoListingContracts";
import Dialog from "@/components/atoms/Dialog";
import DialogHeader from "@/components/atoms/DialogHeader";
import { SearchInput } from "@/components/atoms/Input";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import truncateMiddle from "@/functions/truncateMiddle";
import useCurrentChainId from "@/hooks/useCurrentChainId";

export default function PickAllowedTokenListsDialog({
  setAutoListing,
}: {
  setAutoListing: (autoListing: AutoListing) => void;
}) {
  const { isOpen, setIsOpen } = useAllowedTokenListsDialogOpenedStore();
  const autolistings = useAutoListingContracts();
  const chainId = useCurrentChainId();
  const [searchValue, setSearchValue] = useState("");
  const t = useTranslations("Margin");

  const filteredAutoListing = useMemo(() => {
    if (!searchValue) {
      return autolistings;
    }

    return autolistings?.filter((autolisting) => {
      return (
        autolisting.id.toLowerCase().startsWith(searchValue.toLowerCase()) ||
        autolisting.name.toLowerCase().startsWith(searchValue.toLowerCase())
      );
    });
  }, [searchValue, autolistings]);

  return (
    <Dialog isOpen={isOpen} setIsOpen={setIsOpen}>
      <DialogHeader onClose={() => setIsOpen(false)} title={t("tokens_allowed_trading")} />
      <div className="flex flex-col gap-2 max-h-[640px] pb-5">
        <div className="card-spacing-x ">
          <SearchInput
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={t("search_autolisting")}
          />
        </div>

        {searchValue && !filteredAutoListing?.length && (
          <div className="h-[532px] flex items-center justify-center bg-empty-not-found-list bg-no-repeat bg-right-top -mt-2 flex-shrink-0">
            {t("listing_not_found")}
          </div>
        )}

        {!!filteredAutoListing && filteredAutoListing?.length > 0 && (
          <>
            {filteredAutoListing.map((autolisting) => {
              return (
                <div
                  key={autolisting.id}
                  className="card-spacing-x flex justify-between items-center min-h-[60px] hocus:bg-tertiary-bg duration-200"
                  role="button"
                  onClick={() => {
                    setAutoListing(autolisting);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{autolisting.name}</span>
                    <span className="text-12 text-secondary-text">
                      {t("listing_tokens_count", { count: autolisting.totalTokens })}
                    </span>
                  </div>

                  <span className="flex items-center gap-2">
                    {t("listing_description")}
                    <ExternalTextLink
                      text={truncateMiddle(autolisting.id, { charsFromStart: 6, charsFromEnd: 6 })}
                      href={getExplorerLink(ExplorerLinkType.ADDRESS, autolisting.id, chainId)}
                    />
                  </span>
                </div>
              );
            })}
          </>
        )}
      </div>
    </Dialog>
  );
}
