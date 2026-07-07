import { useQuery } from '@tanstack/react-query';
import type { Trade } from '@/types/trade';
import { todayISO } from '@/lib/today';
import { fetchJournal } from './useJournal';

export interface JournalReminderResult {
  /** 還沒寫日記的（帳戶×商品）組合數。 */
  missingCount: number;
  /** 缺日記的交易（每個 key 取今天第一筆），供點擊提醒時直接開啟日記。 */
  missingTrades: Trade[];
}

/**
 * 日記提醒：檢查「今天」的交易中有幾個（帳戶×商品）組合還沒寫日記。
 * 只查今天（請求數少）；回傳缺日記的數量與可直接開啟的交易清單。
 */
export function useJournalReminder(trades: Trade[]) {
  const iso = todayISO();
  // 今天的交易依日記 key（帳戶×商品×日期）去重，保留代表交易供直接開啟日記。
  const keyed = [
    ...new Map(
      trades
        .filter((tr) => tr.date === iso)
        .map((tr) => [`${tr.accountId}|${tr.sym}`, { accountId: tr.accountId, symbol: tr.sym, trade: tr }]),
    ).values(),
  ];

  return useQuery({
    queryKey: ['journalReminder', iso, keyed.map((k) => `${k.accountId}|${k.symbol}`).sort()],
    enabled: keyed.length > 0,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<JournalReminderResult> => {
      const missingTrades: Trade[] = [];
      for (const key of keyed) {
        const entry = await fetchJournal(key.accountId, key.symbol, iso);
        if (entry === null) missingTrades.push(key.trade);
      }
      return { missingCount: missingTrades.length, missingTrades };
    },
  });
}
