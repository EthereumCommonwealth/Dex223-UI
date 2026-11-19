import Image from "next/image";

import Badge, { BadgeVariant } from "@/components/badges/Badge";
import { Currency } from "@/sdk_bi/entities/currency";
import { Standard } from "@/sdk_bi/standard";

export default function PositionLiquidityCard({
  token,
  amount,
  percentage,
  standards,
}: {
  token: Currency | undefined;
  amount: string;
  percentage?: number | string;
  standards?: Standard[] | "native";
}) {
  return (
    <div className="flex lg:flex-row flex-col gap-1 lg:gap-0 justify-between items-center">
      <div className="flex items-center gap-2 md:max-w-[100%] flex-shrink max-w-[15rem] pr-5">
        <Image
          src={token?.logoURI || "/images/tokens/placeholder.svg"}
          alt={token?.symbol || ""}
          width={24}
          height={24}
        />
        <span
          className="text-secondary-text whitespace-nowrap overflow-hidden text-ellipsis "
          title={token?.symbol}
        >
          {token?.symbol}
        </span>
        {Array.isArray(standards) ? (
          standards?.map((standard) => {
            return <Badge key={standard} variant={BadgeVariant.STANDARD} standard={standard} />;
          })
        ) : (
          <Badge text={"Native"} />
        )}
      </div>
      <div className="flex items-center gap-1">
        <span className="text-16 font-medium">{amount}</span>
        {percentage !== undefined && percentage !== "" && (
          <span className="text-secondary-text">({percentage}%)</span>
        )}
      </div>
    </div>
  );
}
