import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { makeTrade } from '@/test/factories';
import {
  buildHoldingDistribution,
  buildHourlyStats,
  buildMonthlyPerformance,
  buildRDistribution,
  buildStrategyStats,
  buildSymbolPnl,
  buildWeekdayWinRate,
} from './reports';
import { setTodayForTesting } from './today';

// 注入固定「今天」（2026-07-04）讓測試具確定性。
beforeAll(() => setTodayForTesting(new Date(2026, 6, 4)));
afterAll(() => setTodayForTesting(null));

const trades = [
  makeTrade({ sym: 'AAPL', pnl: 100, r: 1, tags: ['breakout'], holdingMinutes: 10 }),
  makeTrade({ sym: 'AAPL', pnl: -50, r: -0.5, tags: ['breakout'], holdingMinutes: 120 }),
  makeTrade({ sym: 'TSLA', pnl: 200, r: 2, tags: ['trend'], holdingMinutes: 600 }),
];

describe('buildSymbolPnl', () => {
  it('sums P&L per symbol and sorts by absolute value', () => {
    const result = buildSymbolPnl(trades);
    expect(result).toEqual([
      { sym: 'TSLA', pnl: 200 },
      { sym: 'AAPL', pnl: 50 },
    ]);
  });
});

describe('buildRDistribution', () => {
  it('bucket counts sum to the number of trades', () => {
    const buckets = buildRDistribution(trades);
    const total = buckets.reduce((s, b) => s + b.count, 0);
    expect(total).toBe(trades.length);
  });
});

describe('buildHourlyStats', () => {
  it('buckets only timestamped trades by entry hour and excludes the rest', () => {
    const mixed = [
      makeTrade({ pnl: 100, openedAt: '2026-07-03T09:15:00' }),
      makeTrade({ pnl: -40, openedAt: '2026-07-03T09:45:00' }),
      makeTrade({ pnl: 60, openedAt: '2026-07-03T14:05:00' }),
      makeTrade({ pnl: 999 }), // 無時間戳 → 排除
    ];
    const stats = buildHourlyStats(mixed);
    expect(stats.sampleCount).toBe(3);
    expect(stats.totalCount).toBe(4);
    expect(stats.buckets).toEqual([
      { hour: 9, count: 2, winRate: 50, pnl: 60 }, // 100 - 40
      { hour: 14, count: 1, winRate: 100, pnl: 60 },
    ]);
  });

  it('returns empty buckets when no trades have timestamps', () => {
    const stats = buildHourlyStats(trades);
    expect(stats.sampleCount).toBe(0);
    expect(stats.buckets).toEqual([]);
  });
});

describe('buildHoldingDistribution', () => {
  it('produces 5 buckets summing to trade count and an average label', () => {
    const { buckets, avgText } = buildHoldingDistribution(trades, 'en');
    expect(buckets).toHaveLength(5);
    expect(buckets.reduce((s, b) => s + b.count, 0)).toBe(trades.length);
    expect(avgText).toMatch(/\d/);
  });
});

describe('buildStrategyStats', () => {
  it('groups by tag with win rate and avg P&L', () => {
    const stats = buildStrategyStats(trades);
    const breakout = stats.find((s) => s.tag === 'breakout');
    expect(breakout?.count).toBe(2);
    expect(breakout?.winRate).toBe(50); // 1 of 2 profitable
    expect(breakout?.avgPnl).toBe(25); // (100 + -50) / 2
    expect(stats.find((s) => s.tag === 'trend')?.count).toBe(1);
  });
});

describe('buildWeekdayWinRate', () => {
  it('returns 7 weekday entries', () => {
    expect(buildWeekdayWinRate(trades)).toHaveLength(7);
  });
});

describe('buildMonthlyPerformance', () => {
  it('returns only real months (current) with pnl equal to net P&L', () => {
    const perf = buildMonthlyPerformance(trades, 'en');
    expect(perf).toHaveLength(1); // 不再合成歷史假月份
    expect(perf[0].label).toBe('Jul');
    expect(perf[0].pnl).toBe(250); // 100 - 50 + 200
  });
});
