import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Trade } from '@/types/trade';
import type { TradeFormInput } from '@/lib/tradeForm';
import { mockTradeStore } from '@/lib/mockTradeStore';
import { API_BASE_URL } from '@/lib/apiConfig';

interface CreateVars {
  accountId: string;
  input: TradeFormInput;
}

interface UpdateVars {
  id: string;
  input: TradeFormInput;
}

async function apiCreate(baseUrl: string, vars: CreateVars): Promise<Trade> {
  const res = await fetch(`${baseUrl}/api/trades`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId: vars.accountId, ...vars.input }),
  });
  if (res.ok === false) throw new Error(`新增交易失敗：${res.status}`);
  return (await res.json()) as Trade;
}

async function apiUpdate(baseUrl: string, vars: UpdateVars): Promise<Trade> {
  const res = await fetch(`${baseUrl}/api/trades/${vars.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vars.input),
  });
  if (res.ok === false) throw new Error(`更新交易失敗：${res.status}`);
  return (await res.json()) as Trade;
}

async function apiDelete(baseUrl: string, id: string): Promise<void> {
  const res = await fetch(`${baseUrl}/api/trades/${id}`, { method: 'DELETE' });
  if (res.ok === false) throw new Error(`刪除交易失敗：${res.status}`);
}

/**
 * 交易的新增／編輯／刪除。API 模式打後端；mock 模式改本地存放區。
 * 成功後一律 invalidate ['trades'] query 讓各畫面刷新。
 */
export function useTradeMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['trades'] });

  const create = useMutation({
    mutationFn: async (vars: CreateVars) => {
      if (API_BASE_URL) return apiCreate(API_BASE_URL, vars);
      return mockTradeStore.create(vars.accountId, vars.input);
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async (vars: UpdateVars) => {
      if (API_BASE_URL) return apiUpdate(API_BASE_URL, vars);
      return mockTradeStore.update(vars.id, vars.input);
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (API_BASE_URL) return apiDelete(API_BASE_URL, id);
      mockTradeStore.remove(id);
    },
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
