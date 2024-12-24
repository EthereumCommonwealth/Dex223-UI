import clsx from "clsx";
import { ChangeEvent, forwardRef, InputHTMLAttributes, useRef } from "react";

import Svg from "@/components/atoms/Svg";
import IconButton, { IconButtonVariant } from "@/components/buttons/IconButton";
import { clsxMerge } from "@/functions/clsxMerge";

export enum InputSize {
  DEFAULT = 40,
  LARGE = 48,
}
interface Props extends InputHTMLAttributes<HTMLInputElement> {
  isError?: boolean;
  isWarning?: boolean;
  inputSize?: InputSize;
  noCloseIcon?: boolean;
}

const inputSizeMap: Record<InputSize, string> = {
  [InputSize.DEFAULT]: "h-10 text-14 rounded-2",
  [InputSize.LARGE]: "h-12 text-16 rounded-3",
};

const Input = forwardRef<HTMLInputElement | null, Props>(function Input(
  { isError = false, isWarning = false, className, inputSize = InputSize.LARGE, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={clsxMerge(
        "duration-200 focus:outline-0 pl-5 placeholder:text-tertiary-text w-full bg-secondary-bg border text-primary-text",
        inputSizeMap[inputSize],
        !isError &&
          !isWarning &&
          "border-transparent hocus:shadow hocus:shadow-green/60 focus:shadow focus:shadow-green focus:border-green",
        isError &&
          "border-red-light hocus:shadow hocus:shadow-red-light-shadow/60 focus:shadow focus:shadow-red-light-shadow/60",
        isWarning &&
          "border-orange hocus:shadow hocus:shadow-yellow/60 focus:shadow focus:shadow-yellow/60",
        props.disabled && "opacity-50 pointer-events-none",
        props.readOnly && "pointer-events-none bg-primary-bg border-secondary-border",
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

export default Input;

export function SearchInput(props: Props) {
  const ref = useRef<HTMLInputElement | null>(null);

  const handleClear = () => {
    if (props.onChange) {
      props.onChange({ target: { value: "" } } as ChangeEvent<HTMLInputElement>);
    }
  };

  return (
    <div className="relative w-full">
      <Input
        className={clsxMerge("pr-12", props.className)}
        style={props.style ? props.style : { paddingRight: "2.5rem" }}
        ref={ref}
        {...props}
      />
      <span
        className={clsx(
          "absolute right-2 flex items-center justify-center h-full w-10 top-0",
          props.value === "" && "pointer-events-none",
        )}
      >
        {props.value === "" || ref.current?.value === "" || !!props.noCloseIcon ? (
          <Svg className="text-secondary-text" iconName="search" />
        ) : (
          <IconButton
            variant={IconButtonVariant.CLOSE}
            className="text-tertiary-text"
            handleClose={() => {
              handleClear();
              ref.current?.focus();
            }}
          />
        )}
      </span>
    </div>
  );
}
