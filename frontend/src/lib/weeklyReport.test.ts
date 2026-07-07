import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { makeTrade } from '@/test/factories';
import type { JournalSummary } from './behavior';
import { buildWeeklyReport, weekRange, weeklyReportMarkdown } from './weeklyReport';
import { setTodayForTesting } from './today';

// 固定「今天」= 2026-07-04（週六）：本週一 = 6/29、上週 = 6/22–6/28。
beforeAll(() => setTodayForTesting(new Date(2026, 6, 4)));
afterAll(() => setTodayForTesting(null));

describe('weekRange', () => {
  it('computes Monday–Sunday for this week and last week', () => {
    expect(weekRange(0)).toEqual({ from: '2026-06-29', to: '2026-07-05' });
    expect(weekRange(-1)).toEqual({ from: '2026-06-22', to: '2026-06-28' });
  });
});

describe('buildWeeklyReport', () => {
  const range = { from: '2026-06-29', to: '2026-07-05' };
  const trades = [
    makeTrade({ sym: 'AAPL', date: '2026-06-30', pnl: 200 }),
    makeTrade({ sym: 'TSLA', date: '2026-07-02', pnl: -120 }),
    makeTrade({ sym: 'NVDA', date: '2026-07-03', pnl: 50 }),
    makeTrade({ sym: 'SPY', date: '2026-07-08', pnl: 999 }), // 下週 → 排除
  ];
  const journals: JournalSummary[] = [
    {
      accountId: 'a1', symbol: 'AAPL', date: '2026-06-30',
      emotions: ['FOMO', 'Calm'],
      mistakes: [{ label: 'Chased entry', checked: true }, { label: 'No plan', checked: false }],
    },
    {
      accountId: 'a1', symbol: 'TSLA', date: '2026-07-02',
      emotions: ['FOMO'],
      mistakes: [{ label: 'Chased entry', checked: true }],
    },
    { accountId: 'a1', symbol: 'SPY', date: '2026-07-08', emotions: ['Greedy'], mistakes: [] }, // 下週 → 排除
  ];
  const violations = [
    { date: '2026-07-02', rule: 'overtrade' as const, detail: '3' },
    { date: '2026-07-08', rule: 'revenge' as const, detail: 'SPY' }, // 下週 → 排除
  ];

  it('aggregates trades, journals, and violations within the week', () => {
    const report = buildWeeklyReport(trades, journals, violations, range);
    expect(report.tradesCount).toBe(3);
    expect(report.netPnl).toBe(130); // 200 - 120 + 50
    expect(report.winRate).toBe(67); // 2/3
    expect(report.bestTrade?.sym).toBe('AAPL');
    expect(report.worstTrade?.sym).toBe('TSLA');
    expect(report.mistakes).toEqual([{ label: 'Chased entry', count: 2 }]); // 未勾選不計
    expect(report.emotions).toEqual([
      { emotion: 'FOMO', count: 2 },
      { emotion: 'Calm', count: 1 },
    ]);
    expect(report.violationsCount).toBe(1);
  });

  it('handles an empty week without throwing', () => {
    const report = buildWeeklyReport([], [], [], range);
    expect(report.tradesCount).toBe(0);
    expect(report.winRate).toBe(0);
    expect(report.bestTrade).toBeNull();
  });
});

describe('weeklyReportMarkdown', () => {
  it('renders key lines in Markdown', () => {
    const range = { from: '2026-06-29', to: '2026-07-05' };
    const report = buildWeeklyReport(
      [makeTrade({ sym: 'AAPL', date: '2026-06-30', pnl: 200 })],
      [],
      [],
      range,
    );
    const md = weeklyReportMarkdown(report, 'en');
    expect(md).toContain('# Weekly Review 2026-06-29 – 2026-07-05');
    expect(md).toContain('Trades: 1 | Net P&L: +$200 | Win rate: 100%');
    expect(md).toContain('Best trade: AAPL +$200 (2026-06-30)');
    expect(md).toContain('Discipline violations: 0');
  });
});
