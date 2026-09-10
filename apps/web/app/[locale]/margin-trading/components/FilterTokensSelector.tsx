import { flip } from "@floating-ui/core";
import {
  autoUpdate,
  FloatingFocusManager,
  offset,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import Checkbox from "@repo/ui/checkbox";
import { useVirtualizer } from "@tanstack/react-virtual";
import clsx from "clsx";
import React, { useCallback, useMemo, useRef, useState } from "react";

import { AssetsPreview } from "@/app/[locale]/margin-trading/lending-order/create/components/AssetsPreview";
import { SearchInput } from "@/components/atoms/Input";
import ScrollbarContainer from "@/components/atoms/ScrollbarContainer";
import Svg from "@/components/atoms/Svg";
import TextButton from "@/components/buttons/TextButton";
import { filterTokens } from "@/functions/searchTokens";
import { useTokens } from "@/hooks/useTokenLists";
import addToast from "@/other/toast";
import { Currency } from "@/sdk_bi/entities/currency";

interface Props {
  selectedCurrencies: Currency[];
  handleToggleCurrency: (value: Currency) => void;
  placeholder?: string;
  extendWidth?: boolean;
  resetCurrencies: () => void;
  selectOptionId: string;
}

export default function FilterTokensSelector({
  selectedCurrencies,
  handleToggleCurrency,
  placeholder,
  extendWidth,
  selectOptionId,
  resetCurrencies,
}: Props) {
  const tokens = useTokens();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  const [tokensSearchValue, setTokensSearchValue] = useState("");

  const [filteredTokens, isTokenFilterActive] = useMemo(() => {
    return tokensSearchValue ? [filterTokens(tokensSearchValue, tokens), true] : [tokens, false];
  }, [tokens, tokensSearchValue]);

  const parentRef = React.useRef(null);

  const virtualizer = useVirtualizer({
    count: filteredTokens.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
  });

  const items = virtualizer.getVirtualItems();

  const { refs, floatingStyles, context } = useFloating({
    elements: {
      reference: ref.current,
    },
    placement: "bottom-start",
    middleware: [offset(12), flip()],
    whileElementsMounted: autoUpdate,
    open: isOpen,
    onOpenChange: setIsOpen,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);

  const [paddingTop, paddingBottom] = useMemo(() => {
    return items.length > 0
      ? [
          Math.max(0, items[0].start),
          Math.max(8, virtualizer.getTotalSize() - items[items.length - 1].end),
        ]
      : [0, 8];
  }, [items, virtualizer]);

  const renderOptions = useCallback(() => {
    return (
      <>
        {items.map((item) => {
          const currency = filteredTokens[item.index];

          return (
            <div
              key={currency.wrapped.address0}
              onClick={() => {
                if (
                  selectedCurrencies.length >= 10 &&
                  !Boolean(selectedCurrencies.find((curr) => curr.equals(currency)))
                ) {
                  addToast("Selection limit reached: 10 tokens", "info");
                } else {
                  handleToggleCurrency(currency);
                }
                // onChange(option.value);
                // setIsOpen(false);
              }}
              className={clsx(
                "cursor-pointer duration-200 gap-3 whitespace-nowrap h-10 md:h-12 bg-tertiary-bg hocus:bg-quaternary-bg flex justify-between items-center pl-4 md:pl-5 pr-3.5",
              )}
            >
              {currency.symbol}

              <Checkbox
                checked={Boolean(selectedCurrencies.find((curr) => curr.equals(currency)))}
                handleChange={() => null}
                id={`${currency.wrapped.address0}-${selectOptionId}`}
              />
            </div>
          );
        })}
      </>
    );
  }, [filteredTokens, handleToggleCurrency, items, selectOptionId, selectedCurrencies]);

  return (
    <div className="relative w-full">
      {/* Trigger Button */}
      <button
        {...getReferenceProps()}
        ref={refs.setReference}
        onClick={() => setIsOpen((prev) => !prev)}
        className={clsx(
          "duration-200 whitespace-nowrap border w-full rounded-2 md:rounded-3 h-10 md:h-12 pl-4 md:pl-5 flex  justify-between gap-3 items-center pr-3",
          isOpen
            ? "border-green bg-green-bg shadow shadow-green/60"
            : "border-primary-bg bg-primary-bg hocus:border-green-bg hocus:bg-green-bg",
        )}
      >
        {selectedCurrencies.length ? <AssetsPreview assets={selectedCurrencies} /> : placeholder}
        <Svg
          iconName="small-expand-arrow"
          className={clsx("duration-200", isOpen ? "-rotate-180" : "")}
        />
      </button>

      {/* Options Container */}
      {isOpen && (
        <FloatingFocusManager context={context} modal={false} initialFocus={-1}>
          <div
            ref={refs.setFloating}
            style={{
              ...floatingStyles,
              minWidth: extendWidth ? ref.current?.offsetWidth : undefined,
            }}
            className={clsx(
              "absolute z-[101] border border-secondary-border bg-tertiary-bg overflow-hidden rounded-3",
              extendWidth && "min-w-full",
            )}
            {...getFloatingProps()}
          >
            <div className="px-5 pt-5">
              <SearchInput
                placeholder="Search"
                value={tokensSearchValue}
                onChange={(e) => setTokensSearchValue(e.target.value)}
              />

              <div className="py-1 flex items-center justify-between h-12 border-b border-secondary-border">
                <span className="text-secondary-text">
                  Selected: {selectedCurrencies.length} token(s)
                </span>
                {selectedCurrencies.length > 0 && (
                  <TextButton className="p-0" endIcon="reset" onClick={resetCurrencies}>
                    Reset selection
                  </TextButton>
                )}
              </div>
            </div>
            {Boolean(filteredTokens.length) && (
              <ScrollbarContainer
                scrollableNodeProps={{
                  ref: parentRef,
                }}
                height={284}
              >
                <div
                  className={clsx(
                    "flex flex-col gap-2 md:gap-0 pl-4 md:pl-0 pr-4 md:pr-[11px] pb-2 pt-3 ",
                  )}
                  style={{
                    paddingTop,
                    paddingBottom,
                  }}
                >
                  {items.length && renderOptions()}
                </div>
              </ScrollbarContainer>
            )}
            {isTokenFilterActive && !items.length && (
              <div className="bg-empty-not-found-token h-[284px] bg-no-repeat bg-right-top bg-size-180 flex items-center justify-center text-secondary-text">
                Token not found
              </div>
            )}
          </div>
        </FloatingFocusManager>
      )}
    </div>
  );
}
