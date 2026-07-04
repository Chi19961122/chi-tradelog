import { useQuery } from '@tanstack/react-query';
import type { Trade } from '@/types/trade';
import { getTradesForAccounts } from '@/lib/seededTrades';

/**
 * 取得指定帳戶的交易。
 * - 若設定了 VITE_API_BASE_URL：呼叫後端 GET /api/trades。
 * - 否則：使用本地 seeded 假資料（可獨立開發，不需後端）。
 * 後端 ViewModel 欄位與 Trade 型別對齊，故可直接使用。
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;

async function fetchTradesFromApi(baseUrl: string, accountIds: string[]): Promise<Trade[]> {
  const query = accountIds.map((id) => `accountIds=${encodeURIComponent(id)}`).join('&');
  const res = await fetch(`${baseUrl}/api/trades?${query}`);
  if (res.ok === false) {
    throw new Error(`取得交易失敗：${res.status}`);
  }
  return (await res.json()) as Trade[];
}

async function fetchTrades(accountIds: string[]): Promise<Trade[]> {
  if (API_BASE_URL) {
    return fetchTradesFromApi(API_BASE_URL, accountIds);
  }
  return getTradesForAccounts(accountIds);
}

export function useTrades(accountIds: string[]) {
  return useQuery({
    queryKey: ['trades', [...accountIds].sort()],
    queryFn: () => fetchTrades(accountIds),
    staleTime: 5 * 60 * 1000,
  });
}
