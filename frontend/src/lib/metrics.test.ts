import { describe, expect, it } from 'vitest';
import { makeTrade } from '@/test/factories';
import {
  buildCalendar,
  buildEquityData,
  buildRadarAxes,
  computeKpis,
  computeMaxDrawdown,
  deltaFor,
} from './metrics';

const trades = [
  makeTrade({ day: 1, pnl: 100, r: 1 }),
  makeTrade({ day: 2, pnl: -50, r: -0.5 }),
  makeTrade({ day: 3, pnl: 200, r: 2 }),
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
  });
});

describe('computeMaxDrawdown', () => {
  it('returns the peak-to-trough drawdown (negative)', () => {
    // 累積：+100（peak 100）、50（dd -50）、250
    expect(computeMaxDrawdown(trades)).toBe(-50);
  });

  it('is 0 when equity only rises', () => {
    expect(computeMaxDrawdown([makeTrade({ day: 1, pnl: 10 }), makeTrade({ day: 2, pnl: 20 })])).toBe(0);
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
    const cal = buildCalendar(0);
    expect(cal.year).toBe(2026);
    expect(cal.monthIdx).toBe(6);
    expect(cal.weeks).toHaveLength(5);
    expect(cal.cells).toHaveLength(35);
  });
});

describe('deltaFor', () => {
  it('is deterministic for the same seed', () => {
    expect(deltaFor(1.1, true)).toEqual(deltaFor(1.1, true));
  });
});
