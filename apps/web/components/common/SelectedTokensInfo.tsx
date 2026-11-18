import Tooltip from "@repo/ui/tooltip";
import Image from "next/image";

import Svg from "@/components/atoms/Svg";
import TokenAddressWithStandard from "@/components/atoms/TokenAddressWithStandard";
import Badge, { BadgeVariant } from "@/components/badges/Badge";
import TrustBadge from "@/components/badges/TrustBadge";
import IconButton from "@/components/buttons/IconButton";
import { useTokenPortfolioDialogStore } from "@/components/dialogs/stores/useTokenPortfolioDialogStore";
import { useTokenTrust } from "@/hooks/useTokenLists";
import { Currency } from "@/sdk_bi/entities/currency";
import { Token } from "@/sdk_bi/entities/token";
import { Standard } from "@/sdk_bi/standard";

interface Props {
  tokenA: Currency | undefined;
  tokenB: Currency | undefined;
}
export default function SelectedTokensInfo({ tokenA, tokenB }: Props) {
  if (!tokenA && !tokenB) {
    return null;
  }

  if (tokenA && tokenB && tokenA.equals(tokenB)) {
    return (
      <div className="w-full bg-primary-bg p-4 sm:p-6 grid gap-3 rounded-5">
        <SelectedTokenInfoItem token={tokenA} />
      </div>
    );
  }

  return (
    <div className="w-full bg-primary-bg p-4 sm:p-6 grid gap-3 rounded-5">
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
  const trust = useTokenTrust(token);

  return (
    <div className="bg-tertiary-bg pt-2.5 pb-3.5 px-5 @container relative z-20 rounded-3">
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
                {token.isToken ? (
                  <div className="table table-fixed w-full">
                    <span className="table-cell overflow-hidden overflow-ellipsis whitespace-nowrap">
                      {token.name}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>{token.name}</span>
                    {token.isNative && (
                      <Badge
                        variant={BadgeVariant.COLORED}
                        color="green"
                        text="Native"
                        className="text-10 lg:text-12 lg:py-px"
                      />
                    )}
                  </div>
                )}
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
              <TrustBadge token={token} trust={trust} />
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
        <div className="w-full mt-2">
          <AddressPair token={token} />
        </div>
      )}
    </div>
  );
}
