import Preloader from "@repo/ui/preloader";
import { useTranslations } from "next-intl";
import React, { useState } from "react";
import { isAddress } from "viem";
import { useAccount } from "wagmi";

import {
  InactiveMarginPositionCard,
  LendingPositionCard,
} from "@/app/[locale]/margin-trading/components/MarginPositionCard";
import { usePositionsByOwner } from "@/app/[locale]/margin-trading/hooks/useMarginPosition";
import { SearchInput } from "@/components/atoms/Input";
import { HelperText } from "@/components/atoms/TextField";

export default function MarginPositionsTab() {
  const t = useTranslations("Margin");
  const { address, isConnected } = useAccount();
  const [searchValue, setSearchValue] = useState("");

  const { positions, loading } = usePositionsByOwner({
    owner: !!searchValue && isAddress(searchValue) ? searchValue : address,
  });

  return (
    <>
      <div className="flex justify-between my-5 items-center">
        {loading ? (
          <Preloader size={24} />
        ) : (
          <span className="text-20 text-tertiary-text">
            {t("margin_positions_count", { count: positions?.length || 0 })}
          </span>
        )}
        <div className="max-w-[460px] flex-grow">
          <SearchInput
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={t("search_address")}
            className="bg-primary-bg"
            isError={!!searchValue && !isAddress(searchValue)}
          />
          <HelperText error={!!searchValue && !isAddress(searchValue) && t("invalid_address")} />
        </div>
      </div>

      {loading && (
        <div className="flex my-10 justify-center items-center min-h-[340px]">
          <Preloader size={96} />
        </div>
      )}
      {isConnected && !loading && positions?.length > 0 && (
        <div className="flex flex-col gap-5">
          {!!positions?.length &&
            positions.map((position, index) =>
              position.isLiquidated || position.isClosed ? (
                <InactiveMarginPositionCard key={position.id} position={position} />
              ) : (
                <LendingPositionCard key={position.id} position={position} />
              ),
            )}
        </div>
      )}
      {!loading && !positions?.length && !!searchValue && isAddress(searchValue) && (
        <div className="bg-primary-bg rounded-5 h-[340px] bg-empty-no-positions bg-no-repeat bg-right-top max-md:bg-size-180 flex items-center gap-2 justify-center text-secondary-text">
          {t("positions_not_found")}
        </div>
      )}
      {isConnected &&
        !loading &&
        !positions?.length &&
        (!searchValue || !isAddress(searchValue)) && (
          <div className="bg-primary-bg rounded-5 h-[340px] bg-empty-no-positions bg-no-repeat bg-right-top max-md:bg-size-180 flex items-center gap-2 justify-center text-secondary-text">
            {t("positions_here")}
          </div>
        )}
      {!isConnected && !loading && (!searchValue || !isAddress(searchValue)) && (
        <div className="bg-primary-bg rounded-5 h-[340px] bg-empty-wallet bg-no-repeat bg-right-top max-md:bg-size-180 flex items-center gap-2 justify-center text-secondary-text">
          {t("positions_connect")}
        </div>
      )}
    </>
  );
}
