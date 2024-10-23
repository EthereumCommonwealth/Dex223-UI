import { Address } from "viem";

import Svg from "@/components/atoms/Svg";
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
  return (
    <div className="flex text-10">
      <div className="border rounded-l-2 border-primary-bg bg-quaternary-bg px-2 flex items-center text-secondary-text">
        {standard}
      </div>
      <a
        href={getExplorerLink(ExplorerLinkType.ADDRESS, tokenAddress, chainId)}
        target="_blank"
        className="bg-secondary-bg pl-2 pr-1 flex gap-1 py-px text-secondary-text hocus:text-primary-text
         hocus:bg-green-bg duration-200 border border-primary-bg rounded-r-2 items-center border-l-0"
      >
        {tokenAddress && `${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-6)}`}
        <Svg size={16} iconName="forward" />
      </a>
    </div>
  );
}
