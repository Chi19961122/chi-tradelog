import { useQuery } from '@tanstack/react-query';
import type { JournalEntry } from '@/lib/journal';
import { journalKey } from '@/lib/journal';
import { mockJournalStore } from '@/lib/mockJournalStore';
import { API_BASE_URL } from '@/lib/apiConfig';
import { apiFetch } from '@/lib/apiClient';

async function fetchFromApi(accountId: string, symbol: string, day: number): Promise<JournalEntry | null> {
  const query = `accountId=${encodeURIComponent(accountId)}&symbol=${encodeURIComponent(symbol)}&day=${day}`;
  const res = await apiFetch(`/api/journal?${query}`);
  if (res.status === 404) return null;
  if (res.ok === false) throw new Error(`取得日記失敗：${res.status}`);
  const data = (await res.json()) as JournalEntry;
  return { notes: data.notes, emotions: data.emotions, mistakes: data.mistakes };
}

/**
 * 取得指定交易的日記；無儲存資料時回傳 null（由呼叫端套用預設）。
 * enabled 為 false 時不查詢（modal 關閉時）。
 */
export function useJournal(accountId: string, symbol: string, day: number, enabled: boolean) {
  return useQuery({
    queryKey: ['journal', journalKey(accountId, symbol, day)],
    enabled,
    queryFn: async (): Promise<JournalEntry | null> => {
      if (API_BASE_URL) return fetchFromApi(accountId, symbol, day);
      return mockJournalStore.get(journalKey(accountId, symbol, day));
    },
  });
}
