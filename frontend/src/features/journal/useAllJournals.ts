import { useQuery } from '@tanstack/react-query';
import type { JournalSummary } from '@/lib/behavior';
import { mockJournalStore } from '@/lib/mockJournalStore';
import { API_BASE_URL } from '@/lib/apiConfig';
import { apiFetch } from '@/lib/apiClient';

/** 解析 mock 日記 key（`accountId-symbol-yyyy-MM-dd`）；格式不符回傳 null。 */
function parseMockKey(key: string): { accountId: string; symbol: string; date: string } | null {
  const match = /^(.+)-([^-]+)-(\d{4}-\d{2}-\d{2})$/.exec(key);
  if (match === null) return null;
  return { accountId: match[1], symbol: match[2], date: match[3] };
}

async function fetchAllJournals(): Promise<JournalSummary[]> {
  if (API_BASE_URL) {
    const res = await apiFetch('/api/journal/all');
    if (res.ok === false) throw new Error(`取得日記清單失敗：${res.status}`);
    return (await res.json()) as JournalSummary[];
  }
  return mockJournalStore
    .entries()
    .flatMap(({ key, entry }) => {
      const parsed = parseMockKey(key);
      if (parsed === null) return [];
      return [{ ...parsed, emotions: entry.emotions, mistakes: entry.mistakes }];
    });
}

/** 取得自己的全部日記摘要（行為分析用；API/mock 雙模式）。 */
export function useAllJournals() {
  return useQuery({
    queryKey: ['journalAll'],
    queryFn: fetchAllJournals,
  });
}
