import type { Trade } from '@/types/trade';

/** 建立測試用交易，可覆寫部分欄位。 */
export function makeTrade(overrides: Partial<Trade> = {}): Trade {
  return {
    id: 'a1#0',
    accountId: 'a1',
    sym: 'AAPL',
    side: 'Long',
    r: 0,
    pnl: 0,
    entry: 100,
    exit: 100,
    qty: 1,
    day: 1,
    tags: [],
    holdingMinutes: 30,
    ...overrides,
  };
}
