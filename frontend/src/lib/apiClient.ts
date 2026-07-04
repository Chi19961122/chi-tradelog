import { API_BASE_URL } from './apiConfig';

export const AUTH_TOKEN_KEY = 'chi_auth_token';
export const AUTH_USER_KEY = 'chi_auth_user';

/** 讀取儲存的 JWT。 */
export function getStoredToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * 呼叫後端 API：自動加上 base URL 與 Authorization Bearer（若已登入）。
 */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = getStoredToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${API_BASE_URL}${path}`, { ...init, headers });
}
