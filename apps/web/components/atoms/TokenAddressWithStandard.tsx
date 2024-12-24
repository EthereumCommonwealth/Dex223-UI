import { useTranslations } from "next-intl";
import { Address } from "viem";

import Svg from "@/components/atoms/Svg";
import Tooltip from "@/components/atoms/Tooltip";
import getExplorerLink, { ExplorerLinkType } from "@/functions/getExplorerLink";
import { DexChainId } from "@/sdk_hybrid/chains";
import { Standard } from "@/sdk_hybrid/standard";

export default function TokenAddressWithStandard({
  tokenAddress,
  standard,
  chainId,
}: {
  tokenAddress: Address;
  standard: Standard;
  chainId: DexChainId;
}) {
  const t = useTranslations("Swap");

  return (
    <div className="flex text-10">
      <Tooltip
        renderTrigger={(ref, refProps) => (
          <div
            onClick={(e) => e.stopPropagation()}
            ref={ref.setReference}
            {...refProps}
            className="whitespace-nowrap border rounded-l-2 border-secondary-border bg-quaternary-bg px-2 flex items-center text-secondary-text cursor-pointer"
          >
            {standard}
          </div>
        )}
        iconSize={16}
        text={standard === Standard.ERC20 ? t("erc20_tooltip") : t("erc223_tooltip")}
      />

      <a
        href={getExplorerLink(ExplorerLinkType.ADDRESS, tokenAddress, chainId)}
        target="_blank"
        className="bg-quaternary-bg pl-2 pr-1 flex gap-1 py-px text-secondary-text hocus:text-primary-text
         hocus:bg-green-bg duration-200 border border-secondary-border rounded-r-2 items-center border-l-0"
      >
        {tokenAddress && `${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-6)}`}
        <Svg size={16} iconName="forward" />
      </a>
    </div>
  );
}
