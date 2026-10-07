import { createDialogStateStore } from "@/stores/factories/createDialogStateStore";

// Opened instead of the wallet, network and token list controls while a demo page is open.
export const useDemoWalletDialogStore = createDialogStateStore();
