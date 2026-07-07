import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { JournalEntry } from '@/lib/journal';
import { journalKey } from '@/lib/journal';
import { mockJournalStore } from '@/lib/mockJournalStore';
import { API_BASE_URL } from '@/lib/apiConfig';
import { apiFetch } from '@/lib/apiClient';

export interface SaveJournalVars {
  accountId: string;
  symbol: string;
  date: string;
  entry: JournalEntry;
}

async function saveToApi(vars: SaveJournalVars): Promise<void> {
  const res = await apiFetch('/api/journal', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accountId: vars.accountId,
      symbol: vars.symbol,
      date: vars.date,
      notes: vars.entry.notes,
      emotions: vars.entry.emotions,
      mistakes: vars.entry.mistakes,
    }),
  });
  if (res.ok === false) throw new Error(`儲存日記失敗：${res.status}`);
}

/**
 * 儲存日記。API 模式打後端 PUT，mock 模式寫本地存放區。
 * 成功後更新該筆的 query cache。
 */
export function useJournalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: SaveJournalVars) => {
      if (API_BASE_URL) {
        await saveToApi(vars);
      } else {
        mockJournalStore.save(journalKey(vars.accountId, vars.symbol, vars.date), vars.entry);
      }
      return vars;
    },
    onSuccess: (vars) => {
      queryClient.setQueryData(
        ['journal', journalKey(vars.accountId, vars.symbol, vars.date)],
        vars.entry,
      );
    },
  });
}
