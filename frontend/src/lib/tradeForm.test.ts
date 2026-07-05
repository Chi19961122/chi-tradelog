import { describe, expect, it } from 'vitest';
import { computeTradeFields } from './tradeForm';

describe('computeTradeFields', () => {
  it('computes P&L and R for a winning Long', () => {
    const c = computeTradeFields({ sym: 'aapl', side: 'Long', entry: 100, exit: 110, qty: 10, day: 5, tags: [] });
    expect(c.sym).toBe('AAPL');
    expect(c.pnl).toBe(100); // (110 - 100) * 10
    expect(c.r).toBe(1); // 100 / 100
    expect(c.tags).toEqual(['manual']); // 空標籤預設 manual
  });

  it('computes negative P&L for a Short when price rises', () => {
    const c = computeTradeFields({ sym: 'TSLA', side: 'Short', entry: 100, exit: 120, qty: 10, day: 3, tags: ['news'] });
    expect(c.pnl).toBe(-200); // (100 - 120) * 10
    expect(c.r).toBe(-2);
    expect(c.tags).toEqual(['news']);
  });

  it('clamps day to 1–31', () => {
    expect(computeTradeFields({ sym: 'X', side: 'Long', entry: 1, exit: 2, qty: 1, day: 99, tags: [] }).day).toBe(31);
    expect(computeTradeFields({ sym: 'X', side: 'Long', entry: 1, exit: 2, qty: 1, day: 0, tags: [] }).day).toBe(1);
  });
});
