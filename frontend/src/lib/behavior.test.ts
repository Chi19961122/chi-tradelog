import { describe, expect, it } from 'vitest';
import { makeTrade } from '@/test/factories';
import { buildEmotionStats, buildMistakeCosts, type JournalSummary } from './behavior';

function makeJournal(overrides: Partial<JournalSummary> = {}): JournalSummary {
  return {
    accountId: 'a1',
    symbol: 'AAPL',
    date: '2026-07-01',
    emotions: [],
    mistakes: [],
    ...overrides,
  };
}

const trades = [
  makeTrade({ accountId: 'a1', sym: 'AAPL', date: '2026-07-01', pnl: 100 }),
  makeTrade({ accountId: 'a1', sym: 'AAPL', date: '2026-07-01', pnl: 20 }), // 同日同商品 → 損益合併 120
  makeTrade({ accountId: 'a1', sym: 'TSLA', date: '2026-07-02', pnl: -80 }),
];

describe('buildEmotionStats', () => {
  it('aggregates linked trade-day pnl per emotion', () => {
    const journals = [
      makeJournal({ date: '2026-07-01', emotions: ['FOMO', 'Anxious'] }),
      makeJournal({ symbol: 'TSLA', date: '2026-07-02', emotions: ['FOMO'] }),
    ];
    const stats = buildEmotionStats(trades, journals);
    expect(stats).toEqual([
      { emotion: 'FOMO', count: 2, totalPnl: 40, avgPnl: 20 }, // 120 + (-80)
      { emotion: 'Anxious', count: 1, totalPnl: 120, avgPnl: 120 },
    ]);
  });

  it('excludes orphan journals with no matching trades', () => {
    const journals = [makeJournal({ symbol: 'NVDA', date: '2026-07-09', emotions: ['Calm'] })];
    expect(buildEmotionStats(trades, journals)).toEqual([]);
  });
});

describe('buildMistakeCosts', () => {
  it('sums cost per checked mistake only, most costly first', () => {
    const journals = [
      makeJournal({
        date: '2026-07-01',
        mistakes: [
          { label: 'Chased entry', checked: true },
          { label: 'Moved stop loss', checked: false }, // 未勾選 → 不計
        ],
      }),
      makeJournal({
        symbol: 'TSLA',
        date: '2026-07-02',
        mistakes: [{ label: 'Chased entry', checked: true }, { label: 'Revenge trade', checked: true }],
      }),
    ];
    const costs = buildMistakeCosts(trades, journals);
    expect(costs).toEqual([
      { label: 'Revenge trade', count: 1, totalPnl: -80 },
      { label: 'Chased entry', count: 2, totalPnl: 40 }, // 120 - 80
    ]);
  });
});
