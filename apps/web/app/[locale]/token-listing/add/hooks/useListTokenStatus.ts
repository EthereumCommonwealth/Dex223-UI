import {
  ListTokenStatus,
  useListTokenStatusStore,
} from "@/app/[locale]/token-listing/add/stores/useListTokenStatusStore";

export function useListTokenStatus() {
  const { status } = useListTokenStatusStore();

  return {
    isPendingApprove: status === ListTokenStatus.PENDING_APPROVE,
    isLoadingApprove: status === ListTokenStatus.LOADING_APPROVE,
    isPendingList: status === ListTokenStatus.PENDING,
    isLoadingList: status === ListTokenStatus.LOADING,
    isSuccessList: status === ListTokenStatus.SUCCESS,
    isRevertedList: status === ListTokenStatus.ERROR,
    isSettledList: status === ListTokenStatus.SUCCESS || status === ListTokenStatus.ERROR,
    isRevertedApprove: status === ListTokenStatus.APPROVE_ERROR,
  };
}
