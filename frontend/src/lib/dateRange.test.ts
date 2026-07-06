import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildMonthGrid, isoInRange, quickRanges } from './dateRange';
import { setTodayForTesting } from './today';

// 注入固定「今天」（2026-07-04）讓測試具確定性。
beforeAll(() => setTodayForTesting(new Date(2026, 6, 4)));
afterAll(() => setTodayForTesting(null));

describe('buildMonthGrid', () => {
  it('builds July 2026 with 31 in-month days, Sunday-first', () => {
    const cells = buildMonthGrid(2026, 6);
    expect(cells.length % 7).toBe(0);
    const inMonth = cells.filter((c) => c.iso !== null);
    expect(inMonth).toHaveLength(31);
    // 2026-07-01 是星期三（index 3）
    const firstIdx = cells.findIndex((c) => c.dayNum === 1);
    expect(firstIdx).toBe(new Date(2026, 6, 1).getDay());
    expect(cells[firstIdx].iso).toBe('2026-07-01');
  });
});

describe('quickRanges', () => {
  it('returns today/week/month/quarter ranges around 2026-07-04', () => {
    const ranges = quickRanges();
    expect(ranges.map((r) => r.key)).toEqual(['today', 'week', 'month', 'quarter']);
    const month = ranges.find((r) => r.key === 'month')!;
    expect(month.from).toBe('2026-07-01');
    expect(month.to).toBe('2026-07-31');
    const quarter = ranges.find((r) => r.key === 'quarter')!;
    expect(quarter.from).toBe('2026-07-01');
    expect(quarter.to).toBe('2026-09-30');
  });
});

describe('isoInRange', () => {
  it('respects inclusive bounds and empty (unbounded) sides', () => {
    expect(isoInRange('2026-07-10', { from: '2026-07-05', to: '2026-07-15' })).toBe(true);
    expect(isoInRange('2026-07-20', { from: '2026-07-05', to: '2026-07-15' })).toBe(false);
    expect(isoInRange('2026-07-05', { from: '2026-07-05', to: '2026-07-15' })).toBe(true);
    expect(isoInRange('2026-07-20', { from: '', to: '' })).toBe(true);
  });
});
