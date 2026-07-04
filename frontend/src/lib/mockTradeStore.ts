import type { Trade } from '@/types/trade';
import { getTradesForAccount } from './seededTrades';
import { buildMockTrade, type TradeFormInput } from './tradeForm';

/**
 * 記憶體內的 mock 交易存放區（單一 session）。
 * 未設定 VITE_API_BASE_URL 時使用，讓新增/編輯/刪除可在前端獨立運作。
 * 各帳戶首次存取時以 seeded 假資料延遲初始化。
 */
const storeByAccount = new Map<string, Trade[]>();
let counter = 0;

function ensureAccount(accountId: string): Trade[] {
  let list = storeByAccount.get(accountId);
  if (!list) {
    list = getTradesForAccount(accountId);
    storeByAccount.set(accountId, list);
  }
  return list;
}

function sortByDayDesc(trades: Trade[]): Trade[] {
  return [...trades].sort((a, b) => b.day - a.day);
}

export const mockTradeStore = {
  getByAccounts(accountIds: string[]): Trade[] {
    return accountIds.flatMap((id) => ensureAccount(id));
  },

  create(accountId: string, input: TradeFormInput): Trade {
    const list = ensureAccount(accountId);
    const trade = buildMockTrade(accountId, input, `${accountId}#new${counter++}`);
    storeByAccount.set(accountId, sortByDayDesc([trade, ...list]));
    return trade;
  },

  update(id: string, input: TradeFormInput): Trade | null {
    for (const [accountId, list] of storeByAccount) {
      const existing = list.find((t) => t.id === id);
      if (existing) {
        const updated = buildMockTrade(accountId, input, id);
        storeByAccount.set(
          accountId,
          sortByDayDesc(list.map((t) => (t.id === id ? updated : t))),
        );
        return updated;
      }
    }
    return null;
  },

  remove(id: string): boolean {
    for (const [accountId, list] of storeByAccount) {
      if (list.some((t) => t.id === id)) {
        storeByAccount.set(accountId, list.filter((t) => t.id !== id));
        return true;
      }
    }
    return false;
  },
};
