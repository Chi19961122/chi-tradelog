import { useQuery } from '@tanstack/react-query';
import type { JournalEntry } from '@/lib/journal';
import { journalKey } from '@/lib/journal';
import { mockJournalStore } from '@/lib/mockJournalStore';
import { API_BASE_URL } from '@/lib/apiConfig';
import { apiFetch } from '@/lib/apiClient';

async function fetchFromApi(accountId: string, symbol: string, date: string): Promise<JournalEntry | null> {
  const query = `accountId=${encodeURIComponent(accountId)}&symbol=${encodeURIComponent(symbol)}&date=${encodeURIComponent(date)}`;
  const res = await apiFetch(`/api/journal?${query}`);
  if (res.status === 404) return null;
  if (res.ok === false) throw new Error(`取得日記失敗：${res.status}`);
  const data = (await res.json()) as JournalEntry;
  return { notes: data.notes, emotions: data.emotions, mistakes: data.mistakes };
}

/** 取得單篇日記（API/mock 雙模式；無資料回傳 null）。供 hook 與日記提醒共用。 */
export async function fetchJournal(accountId: string, symbol: string, date: string): Promise<JournalEntry | null> {
  if (API_BASE_URL) return fetchFromApi(accountId, symbol, date);
  return mockJournalStore.get(journalKey(accountId, symbol, date));
}

/**
 * 取得指定交易的日記；無儲存資料時回傳 null（由呼叫端套用預設）。
 * enabled 為 false 時不查詢（modal 關閉時）。
 */
export function useJournal(accountId: string, symbol: string, date: string, enabled: boolean) {
  return useQuery({
    queryKey: ['journal', journalKey(accountId, symbol, date)],
    enabled,
    queryFn: () => fetchJournal(accountId, symbol, date),
  });
}
