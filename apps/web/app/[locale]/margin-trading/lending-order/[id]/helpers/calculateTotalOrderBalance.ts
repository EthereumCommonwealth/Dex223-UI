import { LendingOrder } from "@/app/[locale]/margin-trading/types";

export default function calculateTotalOrderBalance(order: LendingOrder) {
  const now = Date.now();
  const FIXED_POINT = 1_000_000n; // 6 decimal precision


  const repayableFromPositions = order.positions
    .filter((p) => !p.isClosed && !p.isLiquidated)
    .map((position) => {
      const msPassed = BigInt(now - position.createdAt * 1000);
      const msInMonth = 30n * 24n * 60n * 60n * 1000n;

      const loanAmount = position.loanAmount;

      // interestRate = 1500 means 15.00%, we convert to fixed point 0.15 × 1_000_000 = 150_000
      const interestRateFixed = (BigInt(order.interestRate) * FIXED_POINT) / 10000n;

      // months passed in fixed point
      const monthsPassedFixed = (msPassed * FIXED_POINT) / msInMonth;

      // interest = loanAmount * rate * months / 1_000_000^2
      const interest =
        (loanAmount * interestRateFixed * monthsPassedFixed) / (FIXED_POINT * FIXED_POINT);

      return loanAmount + interest;
    });

  const repayableSum = repayableFromPositions.reduce((acc, x) => acc + x, 0n);

  return order.balance + repayableSum;
}
