import useDeepMemo from "@/hooks/useDeepMemo";
import { useGlobalFees } from "@/shared/hooks/useGlobalFees";
import { deadlineSeconds } from "@/stores/settingsValidation";

export default function useTransactionDeadline(userDeadline: number): bigint {
  const ttl = deadlineSeconds(userDeadline);

  const { timestamp } = useGlobalFees();

  return useDeepMemo(() => {
    if (timestamp) {
      return timestamp + BigInt(ttl);
    }

    return BigInt(0);
  }, [timestamp, ttl]);
}
