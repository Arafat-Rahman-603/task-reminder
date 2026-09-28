/**
 * Core Financial Engine for Manageo
 * Provides pure, testable utilities for monetary calculations.
 * Avoids floating point inaccuracies by strictly using integer cents or big decimal logic where needed.
 * 
 * For this application, all inputs are assumed to be standard decimal values (e.g., 10000.50).
 * We will calculate using fixed point precision internally to avoid 0.1 + 0.2 === 0.30000000000000004 issues.
 */

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function toDecimal(cents: number): number {
  return cents / 100;
}

export function calculateNewBalance(
  currentBalance: number,
  transactionAmount: number,
  type: 'income' | 'expense'
): number {
  const currentCents = toCents(currentBalance);
  const amountCents = toCents(transactionAmount);

  if (type === 'income') {
    return toDecimal(currentCents + amountCents);
  } else if (type === 'expense') {
    return toDecimal(currentCents - amountCents);
  }
  return currentBalance;
}

export function calculateTransfer(
  sourceBalance: number,
  targetBalance: number,
  amount: number
): { newSource: number; newTarget: number } {
  const sourceCents = toCents(sourceBalance);
  const targetCents = toCents(targetBalance);
  const amountCents = toCents(amount);

  return {
    newSource: toDecimal(sourceCents - amountCents),
    newTarget: toDecimal(targetCents + amountCents),
  };
}

export function calculateBudgetProgress(
  budgetAmount: number,
  spentAmount: number
): { spent: number; remaining: number; usagePercent: number } {
  const budgetCents = toCents(budgetAmount);
  const spentCents = toCents(spentAmount);
  
  if (budgetCents === 0) {
    return {
      spent: spentAmount,
      remaining: 0,
      usagePercent: spentCents > 0 ? 100 : 0
    };
  }

  const remainingCents = Math.max(0, budgetCents - spentCents);
  const usagePercent = Math.min(100, Math.round((spentCents / budgetCents) * 100));

  return {
    spent: spentAmount,
    remaining: toDecimal(remainingCents),
    usagePercent
  };
}

export function calculateNetWorth(
  assets: number[],
  liabilities: number[]
): number {
  const totalAssetsCents = assets.reduce((sum, val) => sum + toCents(val), 0);
  const totalLiabilitiesCents = liabilities.reduce((sum, val) => sum + toCents(val), 0);
  return toDecimal(totalAssetsCents - totalLiabilitiesCents);
}
