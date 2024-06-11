import Image from "next/image";
import { Address } from "viem";

import Svg from "@/components/atoms/Svg";
import TokenAddressWithStandard from "@/components/atoms/TokenAddressWithStandard";
import TrustBadge from "@/components/badges/TrustBadge";
import IconButton from "@/components/buttons/IconButton";
import { useTokenPortfolioDialogStore } from "@/components/dialogs/stores/useTokenPortfolioDialogStore";
import { Token } from "@/sdk_hybrid/entities/token";

interface Props {
  tokenA: Token | undefined;
  tokenB: Token | undefined;
}
export default function SelectedTokensInfo({ tokenA, tokenB }: Props) {
  if (!tokenA && !tokenB) {
    return null;
  }

  return (
    <div className="w-full bg-primary-bg p-4 md:p-10 grid gap-3 rounded-5">
      {tokenA && <SelectedTokenInfoItem token={tokenA} />}
      {tokenB && <SelectedTokenInfoItem token={tokenB} />}
    </div>
  );
}

function AddressPair({ token }: { token: Token }) {
  return (
    <div className="flex gap-2 flex-col min-[450px]:flex-row">
      <TokenAddressWithStandard
        tokenAddress={token.address0}
        standard="ERC-20"
        chainId={token?.chainId}
      />
      <TokenAddressWithStandard
        tokenAddress={token.address1}
        standard="ERC-223"
        chainId={token.chainId}
      />
    </div>
  );
}
export function SelectedTokenInfoItem({ token }: { token: Token }) {
  const { handleOpen } = useTokenPortfolioDialogStore();

  return (
    <div className="bg-tertiary-bg rounded-3 py-2.5 px-5 flex flex-wrap justify-between items-center @container relative z-20">
      <div className="flex items-center gap-2">
        <Image src={token.logoURI || ""} alt="Ethereum" width={32} height={32} />
        <div className="flex flex-col">
          <div className="flex gap-2 items-center">
            {token.name}
            <div className="hidden @[620px]:block">
              <AddressPair token={token} />
            </div>
          </div>
          <div className="text-secondary-text text-12">{token.symbol}</div>
        </div>
      </div>
      <div className="flex gap-2 items-center">
        {token.rate && <TrustBadge rate={token?.rate} />}
        <span className="flex gap-0.5 items-center text-secondary-text text-14">
          {token.lists?.length || 1}
          <Svg className="text-tertiary-text" iconName="list" />
        </span>

        <div className="w-10 h-10 flex items-center justify-center">
          <IconButton iconName="details" onClick={() => handleOpen(token)} />
        </div>
      </div>
      <div className="@[620px]:hidden w-full mt-3">
        <AddressPair token={token} />
      </div>
    </div>
  );
}
