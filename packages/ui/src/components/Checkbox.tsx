import { InputHTMLAttributes } from "react";

import { clsxMerge } from "../functions/clsxMerge";
import CheckIcon from "../icons/СheckIcon";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  checked: boolean;
  handleChange: (event?: any) => void; // InputHTMLAttributes<HTMLInputElement>["onChange"]
  id: string;
  label?: string;
  labelClassName?: string;
}

export default function Checkbox({
  checked,
  handleChange,
  id,
  label,
  labelClassName,
  className,
}: Props) {
  return (
    <div className="flex">
      <input
        id={id}
        className={clsxMerge(
          "appearance-none peer shrink-0 w-6 h-6 border border-secondary-border bg-secondary-bg rounded-2 hocus:border-green hocus:bg-primary-bg checked:hocus:shadow checked:hocus:shadow-green/60 checked:bg-green checked:hocus:bg-green checked:border-green checked:hocus:border-green cursor-pointer relative duration-200",
          className,
        )}
        type="checkbox"
        onChange={handleChange}
        checked={checked}
      />
      {label ? (
        <label className={clsxMerge("pl-2 cursor-pointer", labelClassName)} htmlFor={id}>
          {label}
        </label>
      ) : null}
      <CheckIcon
        className="duration-200 absolute opacity-0 peer-checked:opacity-100 text-secondary-bg pointer-events-none"
      />
    </div>
  );
}

export function CheckboxButton({ checked, handleChange, id, label }: Props) {
  return (
    <button
      type="button"
      className="w-full p-3 rounded-3 hocus:bg-green-bg duration-200 bg-tertiary-bg group"
      onClick={handleChange}
    >
      <Checkbox
        labelClassName="pointer-events-none"
        className="group-hocus:border-green pointer-events-none"
        checked={checked}
        handleChange={handleChange}
        id={id}
        label={label}
      />
    </button>
  );
}
