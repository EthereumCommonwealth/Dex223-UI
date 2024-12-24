import clsx from "clsx";
import Image from "next/image";

import { Currency } from "@/sdk_hybrid/entities/currency";

type TokensPairVariant = "medium-primary" | "bold-secondary";

const variantClassNameMap: Record<TokensPairVariant, string> = {
  "medium-primary": "font-medium text-primary-text",
  "bold-secondary": "font-bold text-secondary-text",
};

export default function TokensPair({
  tokenA,
  tokenB,
  variant = "bold-secondary",
}: {
  tokenA?: Currency | undefined;
  tokenB?: Currency | undefined;
  variant?: TokensPairVariant;
}) {
  return (
    <div className="flex items-start  gap-2.5">
      <div className="flex items-center ">
        <span className="w-[26px] h-[26px] md:w-[34px] md:h-[34px] rounded-full bg-primary-bg flex items-center justify-center">
          <Image
            src={tokenA?.logoURI || "/images/tokens/placeholder.svg"}
            alt="Ethereum"
            width={32}
            height={32}
            className="h-[24px] w-[24px] md:h-[32px] md:w-[32px]"
          />
        </span>
        <span className="w-[26px] h-[26px]  md:w-[34px] md:h-[34px] rounded-full bg-primary-bg flex items-center justify-center -ml-3.5">
          <Image
            src={tokenB?.logoURI || "/images/tokens/placeholder.svg"}
            alt="Ethereum"
            width={32}
            height={32}
            className="h-[24px] w-[24px] md:h-[32px] md:w-[32px]"
          />
        </span>
      </div>
      <span className={clsx("text-16 block mt-[1px] md:mt-1", variantClassNameMap[variant])}>
        {tokenA?.symbol} / {tokenB?.symbol}
      </span>
    </div>
  );
}
