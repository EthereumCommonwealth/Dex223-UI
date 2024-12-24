import Image from "next/image";

import Svg from "@/components/atoms/Svg";
import TokenAddressWithStandard from "@/components/atoms/TokenAddressWithStandard";
import Tooltip from "@/components/atoms/Tooltip";
import TrustBadge from "@/components/badges/TrustBadge";
import IconButton from "@/components/buttons/IconButton";
import { useTokenPortfolioDialogStore } from "@/components/dialogs/stores/useTokenPortfolioDialogStore";
import { Currency } from "@/sdk_hybrid/entities/currency";
import { Token } from "@/sdk_hybrid/entities/token";
import { Standard } from "@/sdk_hybrid/standard";

interface Props {
  tokenA: Currency | undefined;
  tokenB: Currency | undefined;
}
export default function SelectedTokensInfo({ tokenA, tokenB }: Props) {
  if (!tokenA && !tokenB) {
    return null;
  }

  return (
    <div className="w-full bg-primary-bg p-4 md:p-5 grid gap-3 rounded-5">
      {tokenA && <SelectedTokenInfoItem token={tokenA} />}
      {tokenB && <SelectedTokenInfoItem token={tokenB} />}
    </div>
  );
}

function AddressPair({ token }: { token: Token }) {
  return (
    <div className="flex gap-2 flex-col md:flex-row">
      <TokenAddressWithStandard
        tokenAddress={token.address0}
        standard={Standard.ERC20}
        chainId={token?.chainId}
      />
      <TokenAddressWithStandard
        tokenAddress={token.address1}
        standard={Standard.ERC223}
        chainId={token.chainId}
      />
    </div>
  );
}
export function SelectedTokenInfoItem({ token }: { token: Currency }) {
  const { handleOpen } = useTokenPortfolioDialogStore();

  return (
    <div className="bg-tertiary-bg py-2.5 px-5 @container relative z-20 rounded-3 ">
      <div className="flex justify-between gap-x-4">
        <div className="flex items-center justify-between flex-wrap sm:flex-nowrap flex-grow gap-2">
          <div className="flex items-center gap-2">
            <Image
              src={token.logoURI || "/images/tokens/placeholder.svg"}
              alt="Ethereum"
              width={32}
              height={32}
              className="flex-shrink-0"
            />
            <div className="flex flex-col">
              <div className="flex gap-2 items-center">
                <div className="table table-fixed w-full">
                  <span className="table-cell overflow-hidden overflow-ellipsis whitespace-nowrap">
                    {token.name}
                  </span>
                </div>
              </div>
              <div className="text-secondary-text text-12">
                <div className="table table-fixed w-full">
                  <span className="table-cell overflow-hidden overflow-ellipsis whitespace-nowrap">
                    {token.symbol}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {token.isToken && (
            <div className="flex gap-2 items-center flex-shrink-0">
              {token.rate && <TrustBadge rate={token?.rate} />}
            </div>
          )}
        </div>
        {token.isToken && (
          <div className="flex items-start gap-2 flex-shrink-0">
            <Tooltip
              text={`Token belongs to ${token.lists?.length || 1} token lists`}
              renderTrigger={(ref, refProps) => {
                return (
                  <span
                    onClick={(e) => e.stopPropagation()}
                    ref={ref.setReference}
                    {...refProps}
                    className="flex gap-0.5 items-center text-secondary-text text-14 cursor-pointer h-10"
                  >
                    {token.lists?.length || 1}
                    <Svg className="text-tertiary-text" iconName="list" />
                  </span>
                );
              }}
            />

            <Tooltip
              text={"Token details"}
              renderTrigger={(ref, refProps) => {
                return (
                  <div
                    ref={ref.setReference}
                    {...refProps}
                    className="w-10 h-10 flex items-center justify-center"
                  >
                    <IconButton iconName="details" onClick={() => handleOpen(token)} />
                  </div>
                );
              }}
            />
          </div>
        )}
      </div>
      {token.isToken && (
        <div className="w-full mt-3">
          <AddressPair token={token} />
        </div>
      )}
    </div>
  );
}
