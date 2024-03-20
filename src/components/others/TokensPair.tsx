import Image from "next/image";

import { WrappedToken } from "@/config/types/WrappedToken";

export default function TokensPair({
  tokenA,
  tokenB,
}: {
  tokenA?: WrappedToken | undefined;
  tokenB?: WrappedToken | undefined;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center">
        <span className="w-[34px] h-[34px] rounded-full bg-primary-bg flex items-center justify-center">
          <Image src={tokenA?.logoURI || ""} alt="Ethereum" width={32} height={32} />
        </span>
        <span className="w-[34px] h-[34px] rounded-full bg-primary-bg flex items-center justify-center -ml-3.5">
          <Image src={tokenB?.logoURI || ""} alt="Ethereum" width={32} height={32} />
        </span>
      </div>
      <span className="font-bold block">
        {tokenA?.symbol} / {tokenB?.symbol}
      </span>
    </div>
  );
}
