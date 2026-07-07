import { describe, expect, it } from 'vitest';
import { makeTrade } from '@/test/factories';
import { nextSort, searchTrades, sortTrades } from './tradeSort';

const trades = [
  makeTrade({ id: 'a', sym: 'TSLA', date: '2026-07-03', pnl: -50, tags: ['reversal'] }),
  makeTrade({ id: 'b', sym: 'AAPL', date: '2026-07-01', pnl: 100, tags: ['breakout'] }),
  makeTrade({ id: 'c', sym: 'NVDA', date: '2026-07-02', pnl: 200, tags: ['trend', 'news'] }),
];

describe('sortTrades', () => {
  it('sorts numerically by pnl in both directions', () => {
    expect(sortTrades(trades, { key: 'pnl', dir: 'asc' }).map((t) => t.id)).toEqual(['a', 'b', 'c']);
    expect(sortTrades(trades, { key: 'pnl', dir: 'desc' }).map((t) => t.id)).toEqual(['c', 'b', 'a']);
  });

  it('sorts alphabetically by symbol', () => {
    expect(sortTrades(trades, { key: 'sym', dir: 'asc' }).map((t) => t.sym)).toEqual(['AAPL', 'NVDA', 'TSLA']);
  });

  it('returns original order when sort is null and does not mutate', () => {
    const result = sortTrades(trades, null);
    expect(result.map((t) => t.id)).toEqual(['a', 'b', 'c']);
    sortTrades(trades, { key: 'date', dir: 'desc' });
    expect(trades[0].id).toBe('a'); // 原陣列未被改動
  });
});

describe('nextSort', () => {
  it('starts ascending on a new column and toggles on the same column', () => {
    expect(nextSort(null, 'pnl')).toEqual({ key: 'pnl', dir: 'asc' });
    expect(nextSort({ key: 'pnl', dir: 'asc' }, 'pnl')).toEqual({ key: 'pnl', dir: 'desc' });
    expect(nextSort({ key: 'pnl', dir: 'desc' }, 'sym')).toEqual({ key: 'sym', dir: 'asc' });
  });
});

describe('searchTrades', () => {
  it('matches symbol and tags case-insensitively', () => {
    expect(searchTrades(trades, 'aapl').map((t) => t.id)).toEqual(['b']);
    expect(searchTrades(trades, 'NEWS').map((t) => t.id)).toEqual(['c']);
    expect(searchTrades(trades, '')).toHaveLength(3);
    expect(searchTrades(trades, 'zzz')).toHaveLength(0);
  });
});
