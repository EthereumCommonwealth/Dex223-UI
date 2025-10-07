import Tooltip from "@repo/ui/tooltip";
import React, { useMemo, useState } from "react";
import SimpleBar from "simplebar-react";
import { formatUnits } from "viem";

import PositionAsset from "@/app/[locale]/margin-trading/components/widgets/PositionAsset";
import { MarginPosition } from "@/app/[locale]/margin-trading/types";
import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import { SearchInput } from "@/components/atoms/Input";
import { TokenPortfolioDialogContent } from "@/components/dialogs/TokenPortfolioDialog";
import { formatFloat } from "@/functions/formatFloat";
import { filterTokens } from "@/functions/searchTokens";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { useTokenLists } from "@/hooks/useTokenLists";
import { Token } from "@/sdk_bi/entities/token";

export default function ActivePositionAssetsBlock({ position }: { position: MarginPosition }) {
  const [searchTradableTokenValue, setSearchTradableTokenValue] = useState("");

  const [filteredTokens, isTokenFilterActive] = useMemo(() => {
    return searchTradableTokenValue
      ? [filterTokens(searchTradableTokenValue, position.order?.allowedTradingAssets || []), true]
      : [position.order?.allowedTradingAssets || [], false];
  }, [searchTradableTokenValue, position.order?.allowedTradingAssets]);

  const [searchAssetValue, setSearchAssetValue] = useState("");

  const [filteredAssetTokens, isAssetFilterActive] = useMemo(() => {
    if (!searchAssetValue) {
      return [position.assetsWithBalances || [], false];
    }

    const filtered = filterTokens(searchAssetValue, position.assets);

    return [
      position.assetsWithBalances.filter(
        (asset) => !!filtered.find((_asset) => asset.asset.equals(_asset)),
      ),
      true,
    ];
  }, [position.assets, position.assetsWithBalances, searchAssetValue]);

  const [tokenForPortfolio, setTokenForPortfolio] = useState<Token | null>(null);
  const chainId = useCurrentChainId();

  const tokenLists = useTokenLists();

  return (
    <div className="bg-primary-bg rounded-5 px-10 pt-4 pb-5 flex flex-col gap-3 mb-5">
      <h3 className="text-20 text-secondary-text font-medium">Assets</h3>

      <div className="bg-tertiary-bg rounded-3 px-5 pb-5 pt-2">
        <div className="flex justify-between mb-3">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-tertiary-text flex items-center gap-1">
              Assets
              <Tooltip text="Tooltip text" />
            </h3>
            <span className="text-20 font-medium text-secondary-text">
              {position.assets.length} / {position.order.currencyLimit} tokens
            </span>
          </div>
          <div>
            <SearchInput
              onChange={(e) => setSearchAssetValue(e.target.value)}
              value={searchAssetValue}
              placeholder="Token name"
              className="bg-primary-bg"
            />
          </div>
        </div>

        <SimpleBar style={{ maxHeight: 216 }}>
          <div className="flex gap-1 flex-wrap">
            {filteredAssetTokens?.map(({ asset, balance }) => (
              <PositionAsset
                key={asset.wrapped.address0}
                amount={formatFloat(formatUnits(balance || BigInt(0), asset.decimals))}
                symbol={asset.symbol || "Unknown"}
              />
            ))}
          </div>
        </SimpleBar>
        {!filteredAssetTokens.length && isAssetFilterActive && (
          <div className="rounded-5 h-[232px] -mt-5 flex items-center justify-center text-secondary-text bg-empty-not-found-token bg-no-repeat bg-right-top bg-[length:212px_212px] -mr-5">
            Token not found
          </div>
        )}
      </div>

      <div className="bg-tertiary-bg rounded-3 px-5 pb-5 pt-2">
        <div className="flex justify-between mb-3">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-tertiary-text flex items-center gap-1">
              Tokens allowed for trading
              <Tooltip text="Tooltip text" />
            </h3>
            <span className="text-20 font-medium">
              {position.order.allowedTradingAssets.length} tokens
            </span>
          </div>
          <div>
            <SearchInput
              value={searchTradableTokenValue}
              onChange={(e) => setSearchTradableTokenValue(e.target.value)}
              placeholder="Token name"
              className="bg-primary-bg"
            />
          </div>
        </div>

        {!!filteredTokens.length && (
          <SimpleBar style={{ maxHeight: 216 }}>
            <div className="flex gap-1 flex-wrap">
              {filteredTokens.map((tradingToken) => {
                return tradingToken.isToken ? (
                  <button
                    key={tradingToken.address0}
                    onClick={() =>
                      setTokenForPortfolio(
                        new Token(
                          chainId,
                          tradingToken.address0,
                          tradingToken.address1,
                          +tradingToken.decimals,
                          tradingToken.symbol,
                          tradingToken.name,
                          "/images/tokens/placeholder.svg",
                          tokenLists
                            ?.filter((tokenList) => {
                              return !!tokenList.list.tokens.find(
                                (t) =>
                                  t.address0.toLowerCase() === tradingToken.address0.toLowerCase(),
                              );
                            })
                            .map((t) => t.id),
                        ),
                      )
                    }
                    className="bg-quaternary-bg text-secondary-text px-2 py-1 rounded-2 hocus:bg-green-bg duration-200"
                  >
                    {tradingToken.symbol}
                  </button>
                ) : (
                  <div
                    key={tradingToken.wrapped.address0}
                    className="rounded-2 text-secondary-text border border-secondary-border px-2 flex items-center py-1"
                  >
                    {tradingToken.symbol}
                  </div>
                );
              })}
            </div>
          </SimpleBar>
        )}
        {!filteredTokens.length && searchTradableTokenValue && (
          <div className="rounded-5 h-[232px] -mt-5 flex items-center justify-center text-secondary-text bg-empty-not-found-token bg-no-repeat bg-right-top bg-[length:212px_212px] -mr-5">
            Token not found
          </div>
        )}
      </div>

      <DrawerDialog isOpen={!!tokenForPortfolio} setIsOpen={() => setTokenForPortfolio(null)}>
        <DialogHeader
          onClose={() => setTokenForPortfolio(null)}
          title={tokenForPortfolio?.name || "Unknown"}
        />
        {tokenForPortfolio ? <TokenPortfolioDialogContent token={tokenForPortfolio} /> : null}
      </DrawerDialog>
    </div>
  );
}
