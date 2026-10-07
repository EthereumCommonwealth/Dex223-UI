import { DemoBalances } from "../stores/useDemoStore";

export type StageStatus = "idle" | "signing" | "done";

export type StageProps = {
  stepKey: string;
  stepNumber: number;
  // State of the current step: waiting for the highlighted click, pretend signing, or done.
  status: StageStatus;
  // True for a moment after a wrong click, so the highlighted control pulses.
  pulse: boolean;
  balances: DemoBalances;
  amount: string;
  setAmount: (amount: string) => void;
  // Set when the typed amount is above the demo balance it is spent from.
  overBalance: { balance: number; symbol: string } | null;
  amountInvalid: boolean;
  // True once the given step has been completed in this run.
  passed: (stepKey: string) => boolean;
  onAction: (delta?: Partial<DemoBalances>) => void;
};
