import { Address, parseUnits } from "viem";

import { LendingOrder } from "@/app/[locale]/margin-trading/types";
import { ZERO_ADDRESS } from "@/sdk_bi/addresses";
import { Currency } from "@/sdk_bi/entities/currency";
import { getTokenAddressForStandard, Standard } from "@/sdk_bi/standard";

export function getMarginAssetAddress(currency: Currency, standard: Standard): Address {
  return currency.isNative ? ZERO_ADDRESS : getTokenAddressForStandard(currency, standard);
}

export function getBorrowFunding(
  order: LendingOrder,
  values: {
    collateralToken: Currency | undefined;
    collateralTokenStandard: Standard;
    collateralAmount: string;
    borrowAmount: string;
  },
) {
  if (!values.collateralToken) throw new Error("Collateral token is required");
  const collateralAddress = getMarginAssetAddress(
    values.collateralToken,
    values.collateralTokenStandard,
  );
  const collateralIndex = order.collateralAddresses.findIndex(
    (address) => address.toLowerCase() === collateralAddress.toLowerCase(),
  );
  if (collateralIndex < 0) throw new Error("Collateral is not allowed by this order");

  const collateralAmount = parseUnits(values.collateralAmount, values.collateralToken.decimals);
  const borrowAmount = parseUnits(values.borrowAmount, order.baseAsset.decimals);
  if (collateralAmount <= 0n || borrowAmount <= 0n) {
    throw new Error("Borrow and collateral amounts must exceed zero");
  }

  const feeAddress = getMarginAssetAddress(
    order.liquidationRewardAsset,
    order.liquidationRewardAssetStandard,
  );
  const collateralIsNative = collateralAddress.toLowerCase() === ZERO_ADDRESS;
  const feeIsNative = feeAddress.toLowerCase() === ZERO_ADDRESS;
  const combinedApproval =
    !collateralIsNative &&
    values.collateralTokenStandard === Standard.ERC20 &&
    order.liquidationRewardAssetStandard === Standard.ERC20 &&
    collateralAddress.toLowerCase() === feeAddress.toLowerCase();

  return {
    collateralAddress,
    collateralIndex,
    collateralAmount,
    borrowAmount,
    collateralIsNative,
    feeAddress,
    feeIsNative,
    combinedApproval,
    collateralApprovalAmount:
      collateralAmount + (combinedApproval ? order.liquidationRewardAmount.value : 0n),
    nativeValue:
      (collateralIsNative ? collateralAmount : 0n) +
      (feeIsNative ? order.liquidationRewardAmount.value : 0n),
  };
}
