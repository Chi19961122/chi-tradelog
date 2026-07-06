import { useQuery } from '@tanstack/react-query';
import type { Trade } from '@/types/trade';
import { mockTradeStore } from '@/lib/mockTradeStore';
import { API_BASE_URL } from '@/lib/apiConfig';
import { apiFetch } from '@/lib/apiClient';

/**
 * 取得指定帳戶的交易。
 * - 若設定了 VITE_API_BASE_URL：呼叫後端 GET /api/trades。
 * - 否則：使用 mock 交易存放區（可獨立開發，支援新增/編輯/刪除）。
 * 後端 ViewModel 欄位與 Trade 型別對齊，故可直接使用。
 */

async function fetchTradesFromApi(accountIds: string[]): Promise<Trade[]> {
  const query = accountIds.map((id) => `accountIds=${encodeURIComponent(id)}`).join('&');
  const res = await apiFetch(`/api/trades?${query}`);
  if (res.ok === false) {
    throw new Error(`取得交易失敗：${res.status}`);
  }
  return (await res.json()) as Trade[];
}

async function fetchTrades(accountIds: string[]): Promise<Trade[]> {
  if (API_BASE_URL) {
    return fetchTradesFromApi(accountIds);
  }
  return mockTradeStore.getByAccounts(accountIds);
}

export function useTrades(accountIds: string[]) {
  return useQuery({
    queryKey: ['trades', [...accountIds].sort()],
    queryFn: () => fetchTrades(accountIds),
    staleTime: 5 * 60 * 1000,
    // 尚無帳戶（新使用者）時跳過查詢，避免打出無帳戶參數的請求。
    enabled: accountIds.length > 0,
  });
}
