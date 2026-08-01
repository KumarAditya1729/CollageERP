export interface LateFeePolicy {
  type: "fixed" | "percentage";
  amount: number;
  grace_period_days: number;
}

/**
 * Calculates the late fee based on the policy, due date, and current date.
 */
export function calculateLateFee(
  dueDateStr: string,
  baseAmount: number,
  policy: LateFeePolicy | null,
): number {
  if (!policy) return 0;

  const dueDate = new Date(dueDateStr);
  const now = new Date();

  // Reset times to compare just the dates
  dueDate.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const graceDate = new Date(dueDate);
  graceDate.setDate(dueDate.getDate() + policy.grace_period_days);

  if (now <= graceDate) {
    return 0; // Within grace period or not late yet
  }

  if (policy.type === "fixed") {
    return policy.amount;
  } else if (policy.type === "percentage") {
    return (baseAmount * policy.amount) / 100;
  }

  return 0;
}

/**
 * Applies tax to a base amount given a tax percentage.
 */
export function applyTax(baseAmount: number, taxPercent: number): number {
  if (taxPercent <= 0) return 0;
  return (baseAmount * taxPercent) / 100;
}

/**
 * Calculates the running balance for a ledger given a list of entries.
 * Normal balances:
 * - Asset: Debit increases, Credit decreases (Balance = Sum(Debit) - Sum(Credit))
 * - Expense: Debit increases, Credit decreases (Balance = Sum(Debit) - Sum(Credit))
 * - Liability: Credit increases, Debit decreases (Balance = Sum(Credit) - Sum(Debit))
 * - Equity: Credit increases, Debit decreases (Balance = Sum(Credit) - Sum(Debit))
 * - Revenue: Credit increases, Debit decreases (Balance = Sum(Credit) - Sum(Debit))
 */
export function calculateLedgerBalance(
  accountType: "asset" | "liability" | "equity" | "revenue" | "expense",
  entries: { debit_amount: number; credit_amount: number }[],
): number {
  let totalDebit = 0;
  let totalCredit = 0;

  for (const entry of entries) {
    totalDebit += entry.debit_amount;
    totalCredit += entry.credit_amount;
  }

  if (accountType === "asset" || accountType === "expense") {
    return totalDebit - totalCredit;
  } else {
    // liability, equity, revenue
    return totalCredit - totalDebit;
  }
}
