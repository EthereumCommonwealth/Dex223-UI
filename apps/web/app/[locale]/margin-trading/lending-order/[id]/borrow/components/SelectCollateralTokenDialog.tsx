import { useState } from "react";
import { useReadContract } from "wagmi";

import DrawerDialog from "@/components/atoms/DrawerDialog";
import Button from "@/components/buttons/Button";
import { MARGIN_MODULE_ABI } from "@/config/abis/marginModule";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { MARGIN_TRADING_ADDRESS } from "@/sdk_bi/addresses";

export default function SelectCollateralTokenDialog({
  collateralAsset,
  setCollateralAsset,
  orderId,
}: {
  orderId: number;
  collateralAsset: number;
  setCollateralAsset: (assetId: number) => void;
}) {
  const chainId = useCurrentChainId();
  const [isOpen, setIsOpen] = useState(false);
  const { data } = useReadContract({
    abi: MARGIN_MODULE_ABI,
    address: MARGIN_TRADING_ADDRESS[chainId],
    functionName: "getOrderCollateralAssets",
    args: [BigInt(orderId)],
  });

  console.log(data);

  return (
    <>
      <Button type="button" onClick={() => setIsOpen(true)}>
        {data?.[collateralAsset] || "Choose collateral asset"}
      </Button>
      <DrawerDialog isOpen={isOpen} setIsOpen={setIsOpen}>
        {!data ? (
          "Loading..."
        ) : (
          <div className="flex flex-col gap-3">
            {data.map((address, index) => {
              return (
                <button
                  key={address}
                  onClick={() => {
                    setCollateralAsset(index);
                    setIsOpen(false);
                  }}
                >
                  {address}
                </button>
              );
            })}
          </div>
        )}
      </DrawerDialog>
    </>
  );
}
