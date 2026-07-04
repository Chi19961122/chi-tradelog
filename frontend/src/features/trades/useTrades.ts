import { useQuery } from '@tanstack/react-query';
import type { Trade } from '@/types/trade';
import { getTradesForAccounts } from '@/lib/seededTrades';

/**
 * 取得指定帳戶的交易。
 * 目前以本地 seeded 假資料模擬；之後改成呼叫後端 GET /api/trades?accountIds=...，
 * 此 hook 對外介面不變，Dashboard 無需改動。
 */
async function fetchTrades(accountIds: string[]): Promise<Trade[]> {
  // 模擬非同步資料層邊界
  return Promise.resolve(getTradesForAccounts(accountIds));
}

export function useTrades(accountIds: string[]) {
  return useQuery({
    queryKey: ['trades', [...accountIds].sort()],
    queryFn: () => fetchTrades(accountIds),
    staleTime: 5 * 60 * 1000,
  });
}
