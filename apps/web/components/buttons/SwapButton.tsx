import clsx from "clsx";
import React, { ButtonHTMLAttributes, useState } from "react";

import { Field } from "@/app/[locale]/swap/stores/useSwapAmountsStore";
import Svg from "@/components/atoms/Svg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  onClick: () => void;
}
export default function SwapButton({ onClick, ...props }: Props) {
  const [effect, setEffect] = useState(false);

  return (
    <button
      onClick={() => {
        setEffect(true);
        onClick();
      }}
      {...props}
      className="group border-[3px] text-green border-primary-bg !outline hover:!outline !outline-primary-bg w-10 h-10 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-secondary-bg rounded-full flex items-center justify-center duration-200 hover:!outline-green hover:shadow hover:shadow-green/60 before:opacity-0 before:duration-200 hover:before:opacity-60 before:absolute before:w-4 before:h-4 before:rounded-full before:bg-green-hover-icon before:blur-[20px]"
    >
      <Svg
        className={clsx(
          effect ? "animate-swap" : "",
          "relative group-hocus:text-green-hover-icon duration-200",
        )}
        onAnimationEnd={() => setEffect(false)}
        iconName="swap"
      />
    </button>
  );
}
