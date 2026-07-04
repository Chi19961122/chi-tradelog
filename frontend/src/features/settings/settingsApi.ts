import type { Account, Platform } from '@/types/trade';
import { API_BASE_URL } from '@/lib/apiConfig';

export interface SettingsData {
  initialCapital: number;
  platforms: Platform[];
  symbols: string[];
  tags: string[];
}

async function send(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${API_BASE_URL}${path}`, init);
  if (res.ok === false) {
    throw new Error(`設定 API 失敗：${res.status} ${path}`);
  }
  return res;
}

const jsonInit = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export async function apiGetSettings(): Promise<SettingsData> {
  const res = await send('/api/settings');
  return (await res.json()) as SettingsData;
}

export async function apiUpdateCapital(initialCapital: number): Promise<void> {
  await send('/api/settings/capital', jsonInit('PUT', { initialCapital }));
}

export async function apiCreatePlatform(name: string): Promise<Platform> {
  const res = await send('/api/settings/platforms', jsonInit('POST', { name }));
  return (await res.json()) as Platform;
}

export async function apiDeletePlatform(id: string): Promise<void> {
  await send(`/api/settings/platforms/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function apiCreateAccount(platformId: string, name: string): Promise<Account> {
  const res = await send(
    `/api/settings/platforms/${encodeURIComponent(platformId)}/accounts`,
    jsonInit('POST', { name }),
  );
  return (await res.json()) as Account;
}

export async function apiDeleteAccount(id: string): Promise<void> {
  await send(`/api/settings/accounts/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function apiAddSymbol(symbol: string): Promise<void> {
  await send('/api/settings/symbols', jsonInit('POST', { symbol }));
}

export async function apiRemoveSymbol(symbol: string): Promise<void> {
  await send(`/api/settings/symbols/${encodeURIComponent(symbol)}`, { method: 'DELETE' });
}

export async function apiAddTag(tag: string): Promise<void> {
  await send('/api/settings/tags', jsonInit('POST', { tag }));
}

export async function apiRemoveTag(tag: string): Promise<void> {
  await send(`/api/settings/tags/${encodeURIComponent(tag)}`, { method: 'DELETE' });
}
