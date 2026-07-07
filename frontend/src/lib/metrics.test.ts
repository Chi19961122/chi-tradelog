import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { makeTrade } from '@/test/factories';
import {
  buildCalendar,
  buildEquityData,
  buildRadarAxes,
  computeKpis,
  computeMaxDrawdown,
} from './metrics';
import { setTodayForTesting } from './today';

// 注入固定「今天」（2026-07-04）讓測試具確定性。
beforeAll(() => setTodayForTesting(new Date(2026, 6, 4)));
afterAll(() => setTodayForTesting(null));

const trades = [
  makeTrade({ date: '2026-07-01', pnl: 100, r: 1 }),
  makeTrade({ date: '2026-07-02', pnl: -50, r: -0.5 }),
  makeTrade({ date: '2026-07-03', pnl: 200, r: 2 }),
];

describe('computeKpis', () => {
  it('computes core KPIs from trades', () => {
    const kpis = computeKpis(trades, 10000);
    expect(kpis.netPnl).toBe(250);
    expect(kpis.tradesCount).toBe(3);
    expect(kpis.winsCount).toBe(2);
    expect(kpis.winRate).toBeCloseTo(66.67, 1);
    expect(kpis.profitFactor).toBe(6); // 300 / 50
    expect(kpis.avgWin).toBe(150);
    expect(kpis.avgLoss).toBe(50);
    expect(kpis.avgWL).toBe(3);
    expect(kpis.balance).toBe(10250);
  });

  it('handles empty trades without throwing', () => {
    const kpis = computeKpis([], 10000);
    expect(kpis.tradesCount).toBe(0);
    expect(kpis.netPnl).toBe(0);
    expect(kpis.balance).toBe(10000);
    expect(kpis.expectancy).toBe(0);
    expect(kpis.currentStreak).toBe(0);
    expect(kpis.bestDay).toBeNull();
    expect(kpis.worstDay).toBeNull();
  });

  it('computes expectancy, streaks, and best/worst day', () => {
    // 順序（依日期）：+100、-50、+200 → 目前連勝 1、最長連勝 1、最長連敗 1
    const kpis = computeKpis(trades, 10000);
    // 期望值 = 2/3×150 − 1/3×50 = 83.33
    expect(kpis.expectancy).toBeCloseTo(83.33, 1);
    expect(kpis.currentStreak).toBe(1);
    expect(kpis.maxWinStreak).toBe(1);
    expect(kpis.maxLossStreak).toBe(1);
    expect(kpis.bestDay).toEqual({ date: '2026-07-03', pnl: 200 });
    expect(kpis.worstDay).toEqual({ date: '2026-07-02', pnl: -50 });
  });

  it('tracks streaks across dates in chronological order', () => {
    const seq = [
      makeTrade({ date: '2026-07-05', pnl: -10 }), // 亂序輸入：排序後為 1,2,3,4,5
      makeTrade({ date: '2026-07-01', pnl: 10 }),
      makeTrade({ date: '2026-07-02', pnl: 20 }),
      makeTrade({ date: '2026-07-03', pnl: 30 }),
      makeTrade({ date: '2026-07-04', pnl: -5 }),
    ];
    const kpis = computeKpis(seq, 10000);
    expect(kpis.maxWinStreak).toBe(3); // 7/1–7/3
    expect(kpis.maxLossStreak).toBe(2); // 7/4–7/5
    expect(kpis.currentStreak).toBe(-2); // 目前連敗 2
  });
});

describe('computeMaxDrawdown', () => {
  it('returns the peak-to-trough drawdown (negative)', () => {
    // 累積：+100（peak 100）、50（dd -50）、250
    expect(computeMaxDrawdown(trades)).toBe(-50);
  });

  it('is 0 when equity only rises', () => {
    expect(computeMaxDrawdown([makeTrade({ date: '2026-07-01', pnl: 10 }), makeTrade({ date: '2026-07-02', pnl: 20 })])).toBe(0);
  });
});

describe('buildEquityData', () => {
  it('builds a cumulative curve starting at 0 for the month range', () => {
    const { points, current, high, low } = buildEquityData(trades, 'month', 'en');
    expect(points[0].value).toBe(0);
    expect(points.map((p) => p.value)).toEqual([0, 100, 50, 250]);
    expect(current).toBe(250);
    expect(high).toBe(250);
    expect(low).toBe(0);
  });
});

describe('buildRadarAxes', () => {
  it('produces 6 axes with scores clamped to 0–100', () => {
    const axes = buildRadarAxes(computeKpis(trades, 10000), 'en');
    expect(axes.map((a) => a.label)).toEqual([
      'Win Rate',
      'Profit Factor',
      'Consistency',
      'Max DD',
      'Avg W/L',
      'Recovery',
    ]);
    for (const axis of axes) {
      expect(axis.score).toBeGreaterThanOrEqual(0);
      expect(axis.score).toBeLessThanOrEqual(100);
    }
  });
});

describe('buildCalendar', () => {
  it('builds July 2026 (Sunday-first, 5 weeks)', () => {
    const cal = buildCalendar(0, trades);
    expect(cal.year).toBe(2026);
    expect(cal.monthIdx).toBe(6);
    expect(cal.weeks).toHaveLength(5);
    expect(cal.cells).toHaveLength(35);
  });

  it('aggregates real trades by day for the current month', () => {
    const cal = buildCalendar(0, [
      makeTrade({ date: '2026-07-03', pnl: 100 }),
      makeTrade({ date: '2026-07-03', pnl: -30 }),
      makeTrade({ date: '2026-07-10', pnl: 50 }),
    ]);
    const day3 = cal.cells.find((c) => c.day === 3)!;
    expect(day3.hasData).toBe(true);
    expect(day3.pnl).toBe(70);
    expect(day3.tradesCount).toBe(2);
    expect(day3.wins).toBe(1);
    // 沒有交易的日子不應有資料
    const day4 = cal.cells.find((c) => c.day === 4)!;
    expect(day4.hasData).toBe(false);
    expect(day4.pnl).toBeNull();
  });

  it('aggregates each month independently (cross-month works)', () => {
    const mixed = [...trades, makeTrade({ date: '2026-06-15', pnl: 500 })];
    const june = buildCalendar(-1, mixed);
    expect(june.monthIdx).toBe(5); // June
    const june15 = june.cells.find((c) => c.day === 15)!;
    expect(june15.hasData).toBe(true);
    expect(june15.pnl).toBe(500);
    // 7 月的交易不出現在 6 月月曆
    expect(june.cells.filter((c) => c.hasData)).toHaveLength(1);
  });
});
