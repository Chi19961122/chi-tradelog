import { useQuery } from '@tanstack/react-query';
import type { Trade } from '@/types/trade';
import { todayISO } from '@/lib/today';
import { fetchJournal } from './useJournal';

/**
 * 日記提醒：檢查「今天」的交易中有幾個（帳戶×商品）組合還沒寫日記。
 * 只查今天（請求數少）；回傳缺日記的數量，0 代表都寫了。
 */
export function useJournalReminder(trades: Trade[]) {
  const iso = todayISO();
  // 今天的交易依日記 key（帳戶×商品×日期）去重。
  const keys = [
    ...new Map(
      trades
        .filter((tr) => tr.date === iso)
        .map((tr) => [`${tr.accountId}|${tr.sym}`, { accountId: tr.accountId, symbol: tr.sym }]),
    ).values(),
  ];

  return useQuery({
    queryKey: ['journalReminder', iso, keys.map((k) => `${k.accountId}|${k.symbol}`).sort()],
    enabled: keys.length > 0,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<number> => {
      let missing = 0;
      for (const key of keys) {
        const entry = await fetchJournal(key.accountId, key.symbol, iso);
        if (entry === null) missing += 1;
      }
      return missing;
    },
  });
}
