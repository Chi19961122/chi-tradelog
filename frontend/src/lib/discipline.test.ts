import { describe, expect, it } from 'vitest';
import { makeTrade } from '@/test/factories';
import { detectViolations, parseDisciplineRules, violationDates } from './discipline';

describe('parseDisciplineRules', () => {
  it('parses valid rules and nulls out invalid values', () => {
    expect(parseDisciplineRules('{"maxTradesPerDay":5,"revengeMinutes":30}')).toEqual({
      maxTradesPerDay: 5,
      revengeMinutes: 30,
    });
    expect(parseDisciplineRules('{"maxTradesPerDay":0,"revengeMinutes":-1}')).toEqual({
      maxTradesPerDay: null,
      revengeMinutes: null,
    });
    expect(parseDisciplineRules(null)).toEqual({ maxTradesPerDay: null, revengeMinutes: null });
    expect(parseDisciplineRules('not json')).toEqual({ maxTradesPerDay: null, revengeMinutes: null });
  });
});

describe('detectViolations — overtrade', () => {
  it('flags days exceeding maxTradesPerDay', () => {
    const trades = [
      makeTrade({ date: '2026-07-01' }),
      makeTrade({ date: '2026-07-01' }),
      makeTrade({ date: '2026-07-01' }),
      makeTrade({ date: '2026-07-02' }),
    ];
    const violations = detectViolations(trades, { maxTradesPerDay: 2, revengeMinutes: null });
    expect(violations).toEqual([{ date: '2026-07-01', rule: 'overtrade', detail: '3' }]);
  });

  it('does not flag when rule disabled', () => {
    const trades = [makeTrade({ date: '2026-07-01' }), makeTrade({ date: '2026-07-01' })];
    expect(detectViolations(trades, { maxTradesPerDay: null, revengeMinutes: null })).toEqual([]);
  });
});

describe('detectViolations — revenge', () => {
  const loser = makeTrade({
    sym: 'YM', pnl: -100, date: '2026-07-03',
    openedAt: '2026-07-03T09:00:00', closedAt: '2026-07-03T09:30:00',
  });

  it('flags a new entry within M minutes after a losing close', () => {
    const next = makeTrade({
      sym: 'MNQ', pnl: 50, date: '2026-07-03',
      openedAt: '2026-07-03T09:45:00', closedAt: '2026-07-03T10:00:00', // 虧損平倉後 15 分進場
    });
    const violations = detectViolations([loser, next], { maxTradesPerDay: null, revengeMinutes: 30 });
    expect(violations).toEqual([{ date: '2026-07-03', rule: 'revenge', detail: 'MNQ' }]);
  });

  it('does not flag beyond the window or after a winning close', () => {
    const late = makeTrade({
      sym: 'MNQ', pnl: 50, date: '2026-07-03',
      openedAt: '2026-07-03T10:01:00', closedAt: '2026-07-03T10:30:00', // 31 分後 → 不違規
    });
    expect(detectViolations([loser, late], { maxTradesPerDay: null, revengeMinutes: 30 })).toEqual([]);

    const winner = { ...loser, pnl: 100 };
    const next = makeTrade({
      sym: 'MNQ', pnl: 50, date: '2026-07-03',
      openedAt: '2026-07-03T09:45:00', closedAt: '2026-07-03T10:00:00',
    });
    expect(detectViolations([winner, next], { maxTradesPerDay: null, revengeMinutes: 30 })).toEqual([]);
  });

  it('ignores trades without timestamps', () => {
    const untimestamped = makeTrade({ sym: 'AAPL', pnl: 50, date: '2026-07-03' });
    expect(detectViolations([loser, untimestamped], { maxTradesPerDay: null, revengeMinutes: 30 })).toEqual([]);
  });
});

describe('violationDates', () => {
  it('collects unique dates', () => {
    const dates = violationDates([
      { date: '2026-07-01', rule: 'overtrade', detail: '3' },
      { date: '2026-07-01', rule: 'revenge', detail: 'YM' },
      { date: '2026-07-02', rule: 'revenge', detail: 'MNQ' },
    ]);
    expect([...dates].sort()).toEqual(['2026-07-01', '2026-07-02']);
  });
});
