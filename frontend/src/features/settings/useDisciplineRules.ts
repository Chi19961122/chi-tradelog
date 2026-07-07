import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { parseDisciplineRules, type DisciplineRules } from '@/lib/discipline';
import { API_BASE_URL } from '@/lib/apiConfig';
import { apiFetch } from '@/lib/apiClient';

const MOCK_RULES_KEY = 'chi_discipline_rules';

async function fetchRules(): Promise<DisciplineRules> {
  if (API_BASE_URL) {
    const res = await apiFetch('/api/settings/discipline');
    if (res.ok === false) throw new Error(`取得紀律規則失敗：${res.status}`);
    const data = (await res.json()) as { rules: string | null };
    return parseDisciplineRules(data.rules);
  }
  return parseDisciplineRules(localStorage.getItem(MOCK_RULES_KEY));
}

async function saveRules(rules: DisciplineRules): Promise<void> {
  const json = JSON.stringify(rules);
  if (API_BASE_URL) {
    const res = await apiFetch('/api/settings/discipline', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rules: json }),
    });
    if (res.ok === false) throw new Error(`儲存紀律規則失敗：${res.status}`);
    return;
  }
  localStorage.setItem(MOCK_RULES_KEY, json);
}

/** 取得自己的紀律規則（API/mock 雙模式；未設定時全部停用）。 */
export function useDisciplineRules() {
  return useQuery({
    queryKey: ['disciplineRules'],
    queryFn: fetchRules,
  });
}

/** 儲存紀律規則，成功後更新 query cache。 */
export function useDisciplineRulesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveRules,
    onSuccess: (_, rules) => {
      queryClient.setQueryData(['disciplineRules'], rules);
    },
  });
}
