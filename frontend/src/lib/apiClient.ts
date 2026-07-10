import { API_BASE_URL } from './apiConfig';

export const AUTH_TOKEN_KEY = 'chi_auth_token';
export const AUTH_USER_KEY = 'chi_auth_user';

/** 讀取儲存的 JWT（「記住我」存 localStorage，否則存 sessionStorage）。 */
export function getStoredToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY) ?? sessionStorage.getItem(AUTH_TOKEN_KEY);
}

/** 工作階段失效（帶權杖仍被 401 拒絕）時的回呼，由 authStore 註冊為登出。 */
let unauthorizedHandler: (() => void) | null = null;

/**
 * 註冊工作階段失效的處理函式（避免此模組反向依賴 authStore 造成循環引用）。
 */
export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler;
}

/**
 * 呼叫後端 API：自動加上 base URL 與 Authorization Bearer（若已登入）。
 * 帶權杖仍收到 401 時視為工作階段失效（例如簽章金鑰輪替、使用者被刪除），
 * 通知 authStore 登出；/api/auth/login 的 401 是帳密錯誤，不在此列。
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = getStoredToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (res.status === 401 && token !== null && path !== '/api/auth/login') {
    unauthorizedHandler?.();
  }
  return res;
}
