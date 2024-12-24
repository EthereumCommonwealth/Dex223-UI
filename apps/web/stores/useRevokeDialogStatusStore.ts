import { Address } from "viem";
import { create } from "zustand";

import { ZERO_ADDRESS } from "@/hooks/useCollectFees";
import { Token } from "@/sdk_hybrid/entities/token";
import { Standard } from "@/sdk_hybrid/standard";

type RevokeDialogStatusStore = {
  isOpenedRevokeDialog: boolean;
  setIsOpenedRevokeDialog: (newStatus: boolean) => void;
  setDialogParams: (token: Token | undefined, contractAddress: Address, standard: Standard) => void;
  standard: Standard;
  token: Token | undefined;
  contractAddress: Address;
};

export const useRevokeDialogStatusStore = create<RevokeDialogStatusStore>((set) => ({
  isOpenedRevokeDialog: false,
  standard: Standard.ERC20,
  token: undefined,
  contractAddress: ZERO_ADDRESS,
  setIsOpenedRevokeDialog: (newStatus) => set({ isOpenedRevokeDialog: newStatus }),
  setDialogParams: (token, contractAddress, standard) => set({ token, contractAddress, standard }),
}));
