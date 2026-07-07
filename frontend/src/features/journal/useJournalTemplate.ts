import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/apiConfig';
import { apiFetch } from '@/lib/apiClient';

// mock 模式的範本存 localStorage（API 模式存後端 app_settings）。
const MOCK_TEMPLATE_KEY = 'chi_journal_template';

/** 取得使用者的日記範本；未設定時為 null。 */
export function useJournalTemplate() {
  return useQuery({
    queryKey: ['journalTemplate'],
    queryFn: async (): Promise<string | null> => {
      if (API_BASE_URL) {
        const res = await apiFetch('/api/journal/template');
        if (res.ok === false) throw new Error(`取得範本失敗：${res.status}`);
        const data = (await res.json()) as { template: string | null };
        return data.template;
      }
      return localStorage.getItem(MOCK_TEMPLATE_KEY);
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** 儲存日記範本（持久化，重新整理不消失）。 */
export function useJournalTemplateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (template: string): Promise<string> => {
      if (API_BASE_URL) {
        const res = await apiFetch('/api/journal/template', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ template }),
        });
        if (res.ok === false) throw new Error(`儲存範本失敗：${res.status}`);
      } else {
        localStorage.setItem(MOCK_TEMPLATE_KEY, template);
      }
      return template;
    },
    onSuccess: (template) => {
      queryClient.setQueryData(['journalTemplate'], template);
    },
  });
}
