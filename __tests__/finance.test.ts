import { 
  calculateNewBalance, 
  calculateTransfer, 
  calculateBudgetProgress, 
  calculateNetWorth 
} from '@/lib/finance';

describe('Financial Engine', () => {
  describe('Account Balance & Transactions', () => {
    it('subtracts expense correctly', () => {
      expect(calculateNewBalance(10000, 1000, 'expense')).toBe(9000);
    });

    it('adds income correctly', () => {
      expect(calculateNewBalance(10000, 3000, 'income')).toBe(13000);
    });

    it('handles decimal precision safely (0.1 + 0.2)', () => {
      expect(calculateNewBalance(0.1, 0.2, 'income')).toBe(0.3);
    });
  });

  describe('Transfers', () => {
    it('transfers money safely between accounts without leaking cash', () => {
      const result = calculateTransfer(10000, 5000, 2000);
      expect(result.newSource).toBe(8000);
      expect(result.newTarget).toBe(7000);
    });
  });

  describe('Budgets', () => {
    it('calculates budget progress accurately', () => {
      const result = calculateBudgetProgress(10000, 7000);
      expect(result.spent).toBe(7000);
      expect(result.remaining).toBe(3000);
      expect(result.usagePercent).toBe(70);
    });

    it('handles overspending', () => {
      const result = calculateBudgetProgress(1000, 1500);
      expect(result.spent).toBe(1500);
      expect(result.remaining).toBe(0);
      expect(result.usagePercent).toBe(100);
    });

    it('handles zero budget', () => {
      const result = calculateBudgetProgress(0, 500);
      expect(result.usagePercent).toBe(100);
      expect(result.remaining).toBe(0);
    });
  });

  describe('Net Worth', () => {
    it('calculates net worth from assets and liabilities', () => {
      // Cash = 50,000, Investment = 100,000 | Debt = 30,000
      const nw = calculateNetWorth([50000, 100000], [30000]);
      expect(nw).toBe(120000);
    });
  });
});
