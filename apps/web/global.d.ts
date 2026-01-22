type Messages = typeof import("./messages/en.json");
declare interface IntlMessages extends Messages {}

interface Window {
  ethereum?: {
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    isMetaMask?: boolean;
  };
}