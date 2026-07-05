import { describe, expect, it } from 'vitest';
import { getTradesForAccount, getTradesForAccounts, seededRand } from './seededTrades';

describe('seededRand', () => {
  it('is deterministic and within [0, 1)', () => {
    expect(seededRand(5)).toBe(seededRand(5));
    for (const seed of [1, 2.5, 41.7, 100]) {
      const v = seededRand(seed);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('getTradesForAccount', () => {
  it('produces 24 deterministic trades tagged to the account', () => {
    const a = getTradesForAccount('a1');
    const b = getTradesForAccount('a1');
    expect(a).toHaveLength(24);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    for (const trade of a) {
      expect(trade.accountId).toBe('a1');
      expect(trade.id.startsWith('a1#')).toBe(true);
      expect(['Long', 'Short']).toContain(trade.side);
    }
  });

  it('differs between accounts', () => {
    expect(getTradesForAccount('a1')[0].sym === getTradesForAccount('a3')[0].sym && getTradesForAccount('a1')[0].pnl === getTradesForAccount('a3')[0].pnl).toBe(false);
  });
});

describe('getTradesForAccounts', () => {
  it('merges trades across accounts', () => {
    expect(getTradesForAccounts(['a1', 'a3'])).toHaveLength(48);
  });
});
