import clsx from "clsx";
import { ChangeEvent } from "react";

interface Props {
  checked: boolean;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  small?: boolean;
  disabled?: boolean;
}

export default function Switch({ checked, handleChange, small = false, disabled = false }: Props) {
  return (
    <label className={clsx("relative inline-block w-12 h-6")}>
      <input
        className="peer appearance-none"
        disabled={disabled}
        checked={checked}
        onChange={handleChange}
        type="checkbox"
      />
      <span
        className={clsx(
          `
          bg-secondary-bg
                      absolute
                      cursor-pointer
                      w-full
                      h-full
                      top-0
                      bottom-0
                      right-0
                      left-0
                      duration-200
                      peer-checked:border-green
                      peer-checked:bg-green-bg
                      peer-checked:hocus:shadow
                      peer-checked:hocus:shadow-green/60
                      border-primary-border
                      border
                      rounded-5
                      peer-hocus:before:bg-green
                      peer-hocus:border-green
                      peer-checked:before:bg-green
                      peer-checked:before:translate-x-6
                      before:content-['']
                      before:absolute
                      before:top-[2px]
                      before:left-[2px]
                      before:h-[18px]
                      before:w-[18px]
                      before:bg-primary-border
                      before:rounded-full
                      before:duration-200
                  `,
        )}
      />
    </label>
  );
}
