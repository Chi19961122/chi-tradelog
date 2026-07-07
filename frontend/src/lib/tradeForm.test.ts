import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { computeTradeFields } from './tradeForm';
import { setTodayForTesting } from './today';

// 注入固定「今天」（2026-07-04）讓測試具確定性。
beforeAll(() => setTodayForTesting(new Date(2026, 6, 4)));
afterAll(() => setTodayForTesting(null));

describe('computeTradeFields', () => {
  it('computes P&L and R for a winning Long', () => {
    const c = computeTradeFields({ sym: 'aapl', side: 'Long', entry: 100, exit: 110, qty: 10, date: '2026-07-05', tags: [] });
    expect(c.sym).toBe('AAPL');
    expect(c.pnl).toBe(100); // (110 - 100) * 10
    expect(c.r).toBe(1); // 100 / 100
    expect(c.date).toBe('2026-07-05');
    expect(c.tags).toEqual(['manual']); // 空標籤預設 manual
  });

  it('computes negative P&L for a Short when price rises', () => {
    const c = computeTradeFields({ sym: 'TSLA', side: 'Short', entry: 100, exit: 120, qty: 10, date: '2026-07-03', tags: ['news'] });
    expect(c.pnl).toBe(-200); // (100 - 120) * 10
    expect(c.r).toBe(-2);
    expect(c.tags).toEqual(['news']);
  });

  it('defaults missing date to today', () => {
    const c = computeTradeFields({ sym: 'X', side: 'Long', entry: 1, exit: 2, qty: 1, date: '', tags: [] });
    expect(c.date).toBe('2026-07-04');
  });

  it('computes real R from stop loss when provided', () => {
    const c = computeTradeFields({ sym: 'AAPL', side: 'Long', entry: 100, exit: 110, qty: 10, date: '2026-07-05', tags: [], stopLoss: 95 });
    // 風險 = |100-95|×10 = 50；R = 100 / 50 = 2（而非 pnl/100 = 1）
    expect(c.pnl).toBe(100);
    expect(c.r).toBe(2);
  });

  it('falls back to pnl/100 when stop loss equals entry (zero risk)', () => {
    const c = computeTradeFields({ sym: 'AAPL', side: 'Long', entry: 100, exit: 110, qty: 10, date: '2026-07-05', tags: [], stopLoss: 100 });
    expect(c.r).toBe(1); // 風險 0 → 沿用近似值
  });

  it('uses provided pnl and timestamps when given (broker import)', () => {
    const c = computeTradeFields({
      sym: 'YM', side: 'Short', entry: 53287, exit: 53214, qty: 2, date: '2026-07-03', tags: [],
      pnl: 723, openedAt: '2026-07-03T15:24:25', closedAt: '2026-07-03T16:03:21',
    });
    expect(c.pnl).toBe(723); // 帶入值不被重算
    expect(c.holdingMinutes).toBe(39);
  });
});
