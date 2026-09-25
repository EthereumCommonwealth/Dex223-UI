import { flip } from "@floating-ui/core";
import {
  autoUpdate,
  FloatingFocusManager,
  offset,
  OpenChangeReason,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import clsx from "clsx";
import { ReactNode, useCallback, useRef, useState } from "react";

import ScrollbarContainer from "@/components/atoms/ScrollbarContainer";
import Svg from "@/components/atoms/Svg";

type SelectOption = {
  label: string | ReactNode;
  value: string;
};

interface Props {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  extendWidth?: boolean;
  optionsHeight?: number;
}

export default function Select({
  options,
  value,
  onChange,
  placeholder,
  extendWidth,
  optionsHeight,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

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

  const selectedOption = options.find((opt) => opt.value === value);

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);

  const renderOptions = useCallback(() => {
    return (
      <>
        {options.map((option) => (
          <div
            key={option.value}
            onClick={() => {
              onChange(option.value);
              setIsOpen(false);
            }}
            className={clsx(
              "cursor-pointer duration-200 gap-3 whitespace-nowrap h-11 md:h-12 bg-tertiary-bg hocus:bg-quaternary-bg flex justify-between items-center pl-4 md:pl-5 pr-3.5",
            )}
          >
            {option.label}
            {value === option.value ? (
              <Svg size={20} iconName="check" className="text-green" />
            ) : (
              <span className="w-5 h-5 block flex-shrink-0" />
            )}
          </div>
        ))}
      </>
    );
  }, [onChange, options, value]);

  return (
    <div className="relative w-full">
      {/* Trigger Button */}
      <button
        {...getReferenceProps()}
        ref={refs.setReference}
        onClick={() => setIsOpen((prev) => !prev)}
        className={clsx(
          "duration-200 whitespace-nowrap border w-full rounded-2 md:rounded-3 h-11 md:h-12 pl-4 md:pl-5 flex  justify-between gap-3 items-center pr-3",
          isOpen
            ? "border-green bg-green-bg shadow shadow-green/60"
            : "border-primary-bg bg-primary-bg hocus:border-green-bg hocus:bg-green-bg",
        )}
      >
        {selectedOption?.label || placeholder}
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
              "absolute z-20 border border-secondary-border bg-tertiary-bg overflow-hidden rounded-3",
              extendWidth && "min-w-full",
            )}
            {...getFloatingProps()}
          >
            {optionsHeight ? (
              <ScrollbarContainer height={optionsHeight} className="bg-tertiary-bg rounded-3 py-1">
                {renderOptions()}
              </ScrollbarContainer>
            ) : (
              <div className="bg-tertiary-bg rounded-3 py-2">{renderOptions()}</div>
            )}
          </div>
        </FloatingFocusManager>
      )}
    </div>
  );
}
