import Tooltip from "@repo/ui/tooltip";
import React, { ReactNode, useEffect, useMemo, useState } from "react";
import SimpleBar from "simplebar-react";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";

import {
  Field,
  useMarginSwapAmountsStore,
} from "@/app/[locale]/margin-swap/stores/useMarginSwapAmountsStore";
import { useMarginSwapPositionStore } from "@/app/[locale]/margin-swap/stores/useMarginSwapPositionStore";
import { useMarginSwapTokensStore } from "@/app/[locale]/margin-swap/stores/useMarginSwapTokensStore";
import PositionAsset from "@/app/[locale]/margin-trading/components/widgets/PositionAsset";
import PositionDetailCard, {
  PositionDetailCardDialog,
} from "@/app/[locale]/margin-trading/components/widgets/PositionDetailCard";
import useMarginPositionById, {
  usePositionsByOwner,
} from "@/app/[locale]/margin-trading/hooks/useMarginPosition";
import { MarginPosition } from "@/app/[locale]/margin-trading/types";
import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import { SearchInput } from "@/components/atoms/Input";
import Svg from "@/components/atoms/Svg";
import Button, { ButtonColor, ButtonSize } from "@/components/buttons/Button";
import IconButton, {
  IconButtonSize,
  IconButtonVariant,
  IconSize,
} from "@/components/buttons/IconButton";
import { ThemeColors } from "@/config/theme/colors";
import { formatFloat } from "@/functions/formatFloat";
import { Link } from "@/i18n/routing";
import { useGlobalBlockNumber } from "@/shared/hooks/useGlobalBlockNumber";

enum DangerStatus {
  STABLE,
  RISKY,
  DANGEROUS,
}

const dangerIconsMap: Record<Exclude<DangerStatus, DangerStatus.STABLE>, ReactNode> = {
  [DangerStatus.RISKY]: (
    <div className="w-10 h-10 flex justify-center items-center text-yellow-light rounded-2.5 border-yellow-light border relative before:absolute before:w-4 before:h-4 before:rounded-full before:blur-[9px] before:bg-yellow-light">
      <Svg iconName="warning" />
    </div>
  ),
  [DangerStatus.DANGEROUS]: (
    <div className="w-10 h-10 flex justify-center items-center text-red-light rounded-2.5 border-red-light border relative before:absolute before:w-4 before:h-4 before:rounded-full before:blur-[9px] before:bg-red-light">
      <Svg iconName="warning" />
    </div>
  ),
};

function PositionSelectItem({
  position,
  handleSelectedPosition,
  isSelected,
}: {
  handleSelectedPosition: (position: MarginPosition) => void;
  position: MarginPosition;
  isSelected: boolean;
}) {
  return (
    <div className="p-5 rounded-3 bg-tertiary-bg">
      <div className="flex items-center mb-3 gap-3">
        <Link
          target={"_blank"}
          className="flex items-center gap-2 text-secondary-text"
          href={`/margin-trading/position/${position.id}`}
        >
          View position details
          <Svg iconName="next" />
        </Link>
        <div className="w-[178px]">
          <PositionDetailCardDialog title="ID" value={position.id} tooltipText="Tooltip text" />
        </div>
        <PositionDetailCardDialog
          title="Deadline"
          value={new Date(position.deadline * 1000).toLocaleString("en-GB").split("/").join(".")}
          tooltipText="Tooltip text"
        />
        <span className="text-green flex items-center gap-3 min-w-[92px]">
          {dangerIconsMap[DangerStatus.RISKY]}
          {dangerIconsMap[DangerStatus.DANGEROUS]}
        </span>
        <div className="w-[210px]">
          {isSelected ? (
            <div className="flex items-center gap-2 rounded-2 w-full border border-primary-border h-10 justify-center">
              Position selected <Svg className="text-purple" iconName="check" />
            </div>
          ) : (
            <Button
              fullWidth
              size={ButtonSize.MEDIUM}
              colorScheme={ButtonColor.PURPLE}
              className="flex-grow"
              onClick={() => handleSelectedPosition(position)}
            >
              Select position
            </Button>
          )}
        </div>
      </div>

      <div className="bg-primary-bg rounded-3 p-5 flex flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <Tooltip text="Tooltip text" /> Assets {position.assets.length}/
          {position.order.currencyLimit}
        </div>
        {position.assetsWithBalances?.map(({ asset, balance }) => (
          <PositionAsset
            key={asset.wrapped.address0}
            amount={formatFloat(formatUnits(balance || BigInt(0), asset.decimals))}
            symbol={asset.symbol || "Unknown"}
          />
        ))}
      </div>
    </div>
  );
}

export function SelectedPositionInfo() {
  const { marginSwapPositionId } = useMarginSwapPositionStore();

  const {
    loading,
    position: marginSwapPosition,
    refetch,
  } = useMarginPositionById({
    id: marginSwapPositionId?.toString(),
  });

  const { blockNumber } = useGlobalBlockNumber();

  useEffect(() => {
    refetch();
  }, [blockNumber, refetch]);

  if (!marginSwapPosition) {
    return null;
  }

  return (
    <div className="bg-primary-bg p-5 rounded-3">
      <div className="flex justify-between mb-3">
        <Link
          target={"_blank"}
          className="flex items-center gap-2 text-secondary-text"
          href={`/margin-trading/position/${marginSwapPositionId}`}
        >
          View position details
          <Svg iconName="next" />
        </Link>
      </div>
      <div className="grid gap-2.5">
        <PositionDetailCard title="ID" value={marginSwapPosition.id} tooltipText="Tooltip text" />
        <PositionDetailCard
          title="Deadline"
          value={new Date(marginSwapPosition.deadline * 1000)
            .toLocaleString("en-GB")
            .split("/")
            .join(".")}
          tooltipText="Tooltip text"
        />
        <div className="bg-tertiary-bg rounded-3 p-5">
          <div className="flex items-center gap-1 w-full text-tertiary-text mb-2">
            <Tooltip text="Tooltip text" /> <span>Assets:</span>
            <span className="text-secondary-text">
              {marginSwapPosition.assets.length || 0} / {marginSwapPosition.order.currencyLimit}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {marginSwapPosition.assetsWithBalances?.map(({ asset, balance }) => (
              <PositionAsset
                key={asset.wrapped.address0}
                amount={formatFloat(formatUnits(balance || BigInt(0), asset.decimals))}
                symbol={asset.symbol || "Unknown"}
              />
            ))}
          </div>
        </div>{" "}
      </div>
    </div>
  );
}

export default function SelectPositionDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const { setMarginSwapPositionId, marginSwapPositionId } = useMarginSwapPositionStore();

  const { address } = useAccount();
  const { loading, positions } = usePositionsByOwner({ owner: address });
  const { setTypedValue, typedValue } = useMarginSwapAmountsStore();

  const { tokenA, tokenB, setTokenA, setTokenB } = useMarginSwapTokensStore();

  const openedPositions = useMemo(() => {
    return positions?.filter((position) => !position.isLiquidated && !position.isClosed);
  }, [positions]);

  const [matchingPositions, otherPositions] = useMemo(() => {
    if (!tokenA && !tokenB) {
      return [openedPositions, openedPositions];
    }

    const matching: MarginPosition[] = [];
    const other: MarginPosition[] = [];
    if(openedPositions && openedPositions?.length){
    for (const position of openedPositions) {
      const hasA = tokenA && position.assets.some((asset) => asset.equals(tokenA));

      const hasB =
        tokenB && position.order.allowedTradingAssets.some((asset) => asset.equals(tokenB));

      // If tokenA is provided → must match assets
      // If tokenB is provided → must match allowedTradingAssets
      // If both are provided → both must match
      const matches = (!tokenA || hasA) && (!tokenB || hasB);

      if (matches) {
        matching.push(position);
      } else {
        other.push(position);
      }
    }
  }
    return [matching, other];
  }, [openedPositions, tokenA, tokenB]);

  const positionFromSearch = useMemo(() => {
    return openedPositions?.find((position) => position.id.toString() === searchValue);
  }, [openedPositions, searchValue]);

  if (loading || !openedPositions) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <DrawerDialog isOpen={isOpen} setIsOpen={setIsOpen}>
        <DialogHeader onClose={() => setIsOpen(false)} title="Select position" />
        <div className="w-[1200px] card-spacing-x card-spacing-b">
          <SearchInput
            placeholder="Search position ID"
            colorScheme={ThemeColors.PURPLE}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />

          {searchValue ? (
            <div className="max-h-[670px] pt-5">
              {positionFromSearch ? (
                <PositionSelectItem
                  handleSelectedPosition={(position) => {
                    setMarginSwapPositionId(position.id);
                    setIsOpen(false);
                  }}
                  position={positionFromSearch}
                  isSelected={marginSwapPositionId === positionFromSearch.id}
                />
              ) : (
                <div className="h-[112px] flex items-center justify-center bg-empty-not-found-lending-position-purple bg-[length:112px_112px] bg-right-top bg-no-repeat text-secondary-text">
                  There are no matching positions
                </div>
              )}
            </div>
          ) : (
            <>
              {!!tokenA || !!tokenB ? (
                <SimpleBar style={{ maxHeight: 670, paddingRight: 20, marginRight: -20 }}>
                  <div>
                    <div className="mt-3 flex items-center gap-3">
                      <h2 className="text-18 font-bold mr-2">Matching positions</h2>
                      {!!tokenA && (
                        <div className="text-secondary-text pl-3 pr-2 py-1 flex items-center gap-1 rounded-2 bg-tertiary-bg">
                          You pay: {tokenA.symbol}
                          <IconButton
                            variant={IconButtonVariant.CLOSE}
                            iconSize={IconSize.REGULAR}
                            buttonSize={IconButtonSize.EXTRA_SMALL}
                            handleClose={() => setTokenA(undefined)}
                          />
                        </div>
                      )}
                      {!!tokenB && (
                        <div className="text-secondary-text pl-3 pr-2 py-1 flex items-center gap-1 rounded-2 bg-tertiary-bg">
                          You buy: {tokenB.symbol}
                          <IconButton
                            variant={IconButtonVariant.CLOSE}
                            iconSize={IconSize.REGULAR}
                            buttonSize={IconButtonSize.EXTRA_SMALL}
                            handleClose={() => setTokenB(undefined)}
                          />
                        </div>
                      )}
                    </div>

                    {matchingPositions?.length ? (
                      <div className="grid gap-5 mt-5">
                        {matchingPositions.map((position) => (
                          <PositionSelectItem
                            key={position.id}
                            handleSelectedPosition={(position) => {
                              setMarginSwapPositionId(position.id);
                              setIsOpen(false);
                            }}
                            position={position}
                            isSelected={marginSwapPositionId === position.id}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="h-[112px] flex items-center justify-center bg-empty-not-found-lending-position-purple bg-[length:112px_112px] bg-right-top bg-no-repeat text-secondary-text">
                        There are no matching positions
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-18 font-bold mt-3 border-t border-primary-border py-3.5">
                      Positions without selected tokens
                    </h2>
                    {otherPositions?.length ? (
                      <div className="grid gap-5">
                        {otherPositions.map((position) => (
                          <PositionSelectItem
                            key={position.id}
                            handleSelectedPosition={(position) => {
                              setMarginSwapPositionId(position.id);
                              setIsOpen(false);
                              setTokenA(undefined);
                              setTokenB(undefined);
                              setTypedValue({ typedValue: "", field: Field.CURRENCY_A });
                            }}
                            position={position}
                            isSelected={marginSwapPositionId === position.id}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="h-[112px] flex items-center justify-center bg-empty-no-position-purple bg-[length:112px_112px] bg-right-top bg-no-repeat text-secondary-text">
                        There are no matching positions
                      </div>
                    )}
                  </div>
                </SimpleBar>
              ) : (
                <SimpleBar style={{ maxHeight: 670, paddingRight: 20, marginRight: -20 }}>
                  <div className="grid gap-5 mt-5">
                    {openedPositions.map((position) => (
                      <PositionSelectItem
                        key={position.id}
                        handleSelectedPosition={(position) => {
                          setMarginSwapPositionId(position.id);
                          setIsOpen(false);
                        }}
                        position={position}
                        isSelected={marginSwapPositionId === position.id}
                      />
                    ))}
                  </div>
                </SimpleBar>
              )}
            </>
          )}
        </div>
      </DrawerDialog>
      {!openedPositions?.length ? (
        <Link href="/margin-trading">
          <Button size={ButtonSize.MEDIUM} colorScheme={ButtonColor.PURPLE}>
            Borrow now
          </Button>
        </Link>
      ) : (
        <Button
          size={ButtonSize.MEDIUM}
          onClick={() => setIsOpen(true)}
          colorScheme={!marginSwapPositionId ? ButtonColor.PURPLE : ButtonColor.LIGHT_PURPLE}
        >
          {marginSwapPositionId ? "Change position" : "Select position"}
        </Button>
      )}
    </>
  );
}
