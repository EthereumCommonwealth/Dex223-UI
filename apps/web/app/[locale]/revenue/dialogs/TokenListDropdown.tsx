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
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMediaQuery } from "react-responsive";

import DialogHeader from "@/components/atoms/DialogHeader";
import DrawerDialog from "@/components/atoms/DrawerDialog";
import { SearchInput } from "@/components/atoms/Input";
import Svg from "@/components/atoms/Svg";
import Button, { ButtonColor, ButtonSize } from "@/components/buttons/Button";
import { db, TokenListId } from "@/db/db";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { useTokenLists } from "@/hooks/useTokenLists";
import addToast from "@/other/toast";
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState<TokenListOption | null>(null);
  const [initialSelection, setInitialSelection] = useState<Set<TokenListId>>(new Set());
  const ref = useRef<HTMLButtonElement>(null);
  const { isOpen, setIsOpen, content, setContent } = useAddNewListDialogStore();
  const { setActiveTab } = useAddNewListDialogStore();

  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
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
    strategy: 'fixed',
    middleware: [offset(8), flip()],
    whileElementsMounted: autoUpdate,
    open: isDropdownOpen,
    onOpenChange: setIsDropdownOpen,
  });

  const click = useClick(context, { enabled: !isMobile });
  const dismiss = useDismiss(context, { enabled: !isMobile });
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

  // Render the dropdown content
  const renderDropdownContent = () => (
    <>
      <div className="px-5 py-5">
        <SearchInput
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-12 text-12 bg-secondary-bg"
          noCloseIcon={searchValue === ""}
        />
      </div>

      <div
        onClick={handleSelectAll}
        className="cursor-pointer h-12 bg-primary-bg flex justify-between items-center px-5 border-b border-secondary-border hover:bg-tertiary-bg transition-colors duration-200"
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
        {filteredOptions.length === 0 ? (
          <div className="flex items-center justify-center py-12 px-5 relative overflow-hidden min-h-[284px]">
            <p className="text-16 text-secondary-text text-center z-10">List not found</p>
            <div className="absolute inset-0 flex items-center justify-end pr-8 pointer-events-none opacity-[0.8]">
              <Image
                src="/images/empty/empty-search-list.svg"
                alt="No results"
                width={200}
                height={200}
                className="object-contain"
              />
            </div>
          </div>
        ) : (
          filteredOptions.map((option) => {
            const isSelected = selectedOptions.has(option.id);
            return (
              <div
                key={option.id}
                onClick={() => handleOptionSelect(option.id)}
                className="cursor-pointer h-12 bg-primary-bg flex items-center gap-3 px-5 group relative hover:bg-tertiary-bg transition-colors duration-200"
              >
                {getOptionIcon(option)}
                <span className="text-primary-text flex-1 truncate text-16">
                  {option.name}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(e);
                    }}
                    className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-red-light/20 rounded-2 flex items-center justify-center"
                    title="Delete"
                  >
                    <Svg
                      iconName="delete"
                      size={16}
                      className="text-tertiary-text hover:text-tertiary-text-hover"
                    />
                  </button>
                  <Checkbox
                    checked={isSelected}
                    handleChange={() => handleOptionSelect(option.id)}
                    id={`token-list-${option.id}`}
                    className="pointer-events-none"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-secondary-border px-4 py-3 bg-primary-bg mt-4">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Button
            colorScheme={ButtonColor.LIGHT_GREEN}
            size={ButtonSize.MEDIUM}
            fullWidth
            onClick={() => setIsDropdownOpen(false)}
          >
            Cancel
          </Button>
          <Button
            colorScheme={ButtonColor.GREEN}
            size={ButtonSize.MEDIUM}
            fullWidth
            onClick={() => setIsDropdownOpen(false)}
          >
            Apply
          </Button>
        </div>
      </div>
      <button
        onClick={() => {
          setIsDropdownOpen(false);
          setIsOpen(true);
          setContent("import-list");
        }}
        className="w-full bg-tertiary-bg p-2 flex items-center justify-center gap-2 text-primary-text text-16 hover:text-green transition-colors duration-200"
      >
        <span className="text-16">Add new list</span>
        <Svg iconName="import-list" size={24} />
      </button>
    </>
  );

  return (
    <>
      <div className={clsx("relative", className)}>
        <div
          {...(!isMobile ? getReferenceProps() : {})}
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

        {/* Desktop dropdown */}
        {!isMobile && isDropdownOpen && (
          <FloatingFocusManager context={context} modal={false} initialFocus={-1}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              className="absolute z-[101] bg-primary-bg overflow-hidden rounded-3 min-w-[400px] shadow-lg border border-secondary-border"
              {...getFloatingProps()}
            >
              {renderDropdownContent()}
            </div>
          </FloatingFocusManager>
        )}
      </div>

      {/* Mobile modal */}
      <DrawerDialog isOpen={isMobile && isDropdownOpen} setIsOpen={setIsDropdownOpen} maxMobileWidth="767px">
        <div className="w-full md:w-[600px] max-md:rounded-t-5 max-md:rounded-b-none">
          <DialogHeader onClose={() => setIsDropdownOpen(false)} title="Token lists" />
          <div className="pb-4">
            {renderDropdownContent()}
          </div>
        </div>
      </DrawerDialog>

      <DrawerDialog isOpen={content === "import-list"} setIsOpen={handleClose} maxMobileWidth="767px">
        <AddNewList setContent={setContent} handleClose={handleClose} />
      </DrawerDialog>

      <DrawerDialog isOpen={deleteDialogOpen} setIsOpen={setDeleteDialogOpen} maxMobileWidth="767px">
        <div className="w-full sm:w-[600px] max-md:rounded-t-5 max-md:rounded-b-none">
          <DialogHeader
            onClose={() => {
              setDeleteDialogOpen(false);
              setListToDelete(null);
            }}
            title="Removing list"
          />
          <div className="px-4 pb-4 md:px-10 md:pb-10">
            {listToDelete?.icon && (
              <Image
                className="mx-auto mt-5 mb-2"
                src={listToDelete.icon}
                alt=""
                width={60}
                height={60}
              />
            )}
            <p className="mb-5 text-center text-primary-text text-16">
              Please confirm that you would like to remove the <b className="whitespace-nowrap">«{listToDelete?.name}»</b> list
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                colorScheme={ButtonColor.LIGHT_GREEN}
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setListToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button colorScheme={ButtonColor.RED} onClick={() => console.log("confirm deleting")}>
                Confirm removing
              </Button>
            </div>
          </div>
        </div>
      </DrawerDialog>
    </>
  );
}
