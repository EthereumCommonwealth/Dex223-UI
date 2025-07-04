import { useCallback } from "react";
import { parseUnits } from "viem";

import {
  OrderDepositStatus,
  useDepositOrderStatusStore,
} from "@/app/[locale]/margin-trading/lending-order/[id]/stores/useDepositOrderStatusStore";
import sleep from "@/functions/sleep";
import { useStoreAllowance } from "@/hooks/useAllowance";
import useCurrentChainId from "@/hooks/useCurrentChainId";
import { MARGIN_TRADING_ADDRESS } from "@/sdk_bi/addresses";

export default function useOrderDeposit({ orderId }: { orderId: number }) {
  const { setStatus } = useDepositOrderStatusStore();
  const chainId = useCurrentChainId();

  // const {
  //   isAllowed: isAllowedA,
  //   writeTokenApprove: approveA,
  //   updateAllowance,
  // } = useStoreAllowance({
  //   token: params.loanToken,
  //   contractAddress: MARGIN_TRADING_ADDRESS[chainId],
  //   amountToCheck: parseUnits(params.loanAmount, params.loanToken?.decimals ?? 18),
  // });

  const handleOrderDeposit = useCallback(async () => {
    console.log(orderId);
    setStatus(OrderDepositStatus.PENDING_APPROVE);
    await sleep(1000);
    setStatus(OrderDepositStatus.LOADING_APPROVE);
    await sleep(4000);

    setStatus(OrderDepositStatus.PENDING_DEPOSIT);
    await sleep(4000);

    setStatus(OrderDepositStatus.LOADING_DEPOSIT);
    await sleep(4000);

    setStatus(OrderDepositStatus.SUCCESS);

    return;
  }, [orderId, setStatus]);

  return { handleOrderDeposit };
}
