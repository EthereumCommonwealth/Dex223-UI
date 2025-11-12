"use client";

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
import clsx from "clsx";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import DrawerDialog from "@/components/atoms/DrawerDialog";
import { SearchInput } from "@/components/atoms/Input";
import Svg from "@/components/atoms/Svg";
import { TokenListId } from "@/db/db";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { useTokenLists } from "@/hooks/useTokenLists";
import { CORE_AUTO_LISTING_ADDRESS, FREE_AUTO_LISTING_ADDRESS } from "@/sdk_bi/addresses";

import { useAddNewListDialogStore } from "../stores/useAddNewListDialogStore";
import AddNewList from "./AddNewList";

export interface TokenListOption {
  id: TokenListId;
  name: string;
  icon?: string;
  isDefault?: boolean;
  isPaid?: boolean;
  isFree?: boolean;
  enabled?: boolean;
}

interface TokenListDropdownProps {
  selectedOptions: Set<TokenListId>;
  onSelectionChange: (selectedIds: Set<TokenListId>) => void;
  placeholder?: string;
  className?: string;
  searchPlaceholder?: string;
}

export default function TokenListDropdown({
  selectedOptions,
  onSelectionChange,
  placeholder = "Select lists",
  className,
  searchPlaceholder = "Search list name",
}: TokenListDropdownProps) {
  const [searchValue, setSearchValue] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const { isOpen, setIsOpen, content, setContent } = useAddNewListDialogStore();
  const { setActiveTab } = useAddNewListDialogStore();

  const tokenLists = useTokenLists();
  const chainId = useCurrentChainId();

  const options = useMemo<TokenListOption[]>(() => {
    if (!tokenLists) return [];

    return tokenLists.map((list) => {
      const isDefault = list.id === `default-${chainId}`;
      const isPaid =
        list.autoListingContract?.toLowerCase() ===
        CORE_AUTO_LISTING_ADDRESS[chainId]?.toLowerCase();
      const isFree =
        list.autoListingContract?.toLowerCase() ===
        FREE_AUTO_LISTING_ADDRESS[chainId]?.toLowerCase();

      return {
        id: list.id,
        name: list.list.name,
        icon: list.list.logoURI,
        isDefault,
        isPaid,
        isFree,
        enabled: list.enabled,
      };
    });
  }, [tokenLists, chainId]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      setContent("default");
      setActiveTab(0);
    }, 400);
  }, [setIsOpen, setContent, setActiveTab]);

  const { refs, floatingStyles, context } = useFloating({
    elements: {
      reference: ref.current,
    },
    middleware: [offset(8), flip()],
    whileElementsMounted: autoUpdate,
    open: isDropdownOpen,
    onOpenChange: setIsDropdownOpen,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);

  const filteredOptions = options.filter((option) =>
    option.name.toLowerCase().includes(searchValue.toLowerCase()),
  );

  const handleSelectAll = () => {
    if (selectedOptions.size === filteredOptions.length) {
      const newSelection = new Set(selectedOptions);
      filteredOptions.forEach((option) => option.id && newSelection.delete(option.id));
      onSelectionChange(newSelection);
    } else {
      const newSelection = new Set(selectedOptions);
      filteredOptions.forEach((option) => option.id && newSelection.add(option.id));
      onSelectionChange(newSelection);
    }
  };

  const handleOptionSelect = (optionId: TokenListId) => {
    if (!optionId) return;
    const newSelection = new Set(selectedOptions);
    if (newSelection.has(optionId)) {
      newSelection.delete(optionId);
    } else {
      newSelection.add(optionId);
    }
    onSelectionChange(newSelection);
  };

  const allFilteredSelected = filteredOptions.every(
    (option) => option.id && selectedOptions.has(option.id),
  );

  const getSelectedOptions = () => {
    return options.filter((option) => option.id && selectedOptions.has(option.id));
  };

  const getOptionIcon = (option: TokenListOption) => {
    if (option.icon) {
      return (
        <Image
          src={option.icon}
          alt={option.name}
          width={24}
          height={24}
          className="w-6 h-6 rounded"
        />
      );
    }
  };

  const selectedOptionsList = getSelectedOptions();
  const maxVisibleTags = 2;
  const visibleTags = selectedOptionsList.slice(0, maxVisibleTags);
  const remainingCount = selectedOptionsList.length - maxVisibleTags;

  return (
    <>
      <div className={clsx("relative", className)}>
        <div
          {...getReferenceProps()}
          ref={refs.setReference}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={clsx(
            "duration-200 border-none rounded-3 h-10 md:h-12 px-3 flex items-center justify-between gap-2 cursor-pointer w-full min-w-[200px]",
            "bg-primary-bg text-primary-text",
            "hocus:shadow hocus:shadow-green/60 focus:shadow focus:shadow-green focus:border-green",
            isDropdownOpen && "border-green bg-green-bg shadow shadow-green/60",
          )}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selectedOptionsList.length === 0 ? (
              <span className="text-secondary-text text-16">{placeholder}</span>
            ) : (
              <>
                {visibleTags.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-center gap-1 bg-tertiary-bg border border-secondary-border rounded-2 px-2 py-1 text-16 text-secondary-text"
                  >
                    <span className="truncate max-w-[100px]">{option.name}</span>
                  </div>
                ))}

                {remainingCount > 0 && <span className="text-secondary-text text-16">...</span>}

                <div className="flex items-center gap-1 bg-tertiary-bg border border-secondary-border rounded-2 px-2 py-1 text-16 text-primary-text">
                  <span>{selectedOptionsList.length}</span>
                </div>
              </>
            )}
          </div>
          <Svg
            iconName="small-expand-arrow"
            className={clsx("duration-200 flex-shrink-0", isDropdownOpen && "-rotate-180")}
          />
        </div>

        {isDropdownOpen && (
          <FloatingFocusManager context={context} modal={false} initialFocus={-1}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              className="absolute z-[101] bg-primary-bg overflow-hidden rounded-3 min-w-[450px] shadow-lg border border-secondary-border"
              {...getFloatingProps()}
            >
              <div className="px-3 py-3 border-b border-secondary-border">
                <SearchInput
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-9 text-12 bg-secondary-bg"
                  noCloseIcon={searchValue === ""}
                />
              </div>

              <div
                onClick={handleSelectAll}
                className="cursor-pointer h-12 bg-primary-bg flex justify-between items-center px-4 border-b border-secondary-border"
              >
                <span className="text-primary-text text-16">Select all</span>
                <Checkbox
                  checked={allFilteredSelected}
                  handleChange={handleSelectAll}
                  id="select-all-token-lists"
                  className="pointer-events-none"
                />
              </div>

              <div className="max-h-60 overflow-y-auto">
                {filteredOptions.map((option) => {
                  const isSelected = selectedOptions.has(option.id);
                  return (
                    <div
                      key={option.id}
                      onClick={() => handleOptionSelect(option.id)}
                      className="cursor-pointer h-12 bg-primary-bg flex items-center gap-3 px-4"
                    >
                      {getOptionIcon(option)}
                      <span className="text-primary-text flex-1 truncate text-16">
                        {option.name}
                      </span>
                      <Checkbox
                        checked={isSelected}
                        handleChange={() => handleOptionSelect(option.id)}
                        id={`token-list-${option.id}`}
                        className="pointer-events-none"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-secondary-border px-4 py-3 bg-tertiary-bg">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsOpen(true);
                    setContent("import-list");
                  }}
                  className="w-full flex items-center justify-center gap-2 text-primary-text text-16 hover:text-green transition-colors duration-200"
                >
                  <span className="text-primary-text text-16">Add new list</span>
                  <Svg iconName="import-list" size={24} />
                </button>
              </div>
            </div>
          </FloatingFocusManager>
        )}
      </div>

      <DrawerDialog isOpen={content === "import-list"} setIsOpen={handleClose}>
        <AddNewList setContent={setContent} handleClose={handleClose} />
      </DrawerDialog>
    </>
  );
}
