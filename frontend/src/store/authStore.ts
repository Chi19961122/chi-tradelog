import { create } from 'zustand';
import { API_BASE_URL } from '@/lib/apiConfig';
import { apiFetch, AUTH_TOKEN_KEY, AUTH_USER_KEY, getStoredToken } from '@/lib/apiClient';

export interface AuthUser {
  name: string;
  email: string;
  isAdmin?: boolean;
}

const DEMO_USER: AuthUser = { name: 'Alex Chen', email: 'alex@chitradelog.com' };

// 於權杖到期前這麼久先換發（需小於後端的 12 小時效期）。
const REFRESH_BUFFER_MS = 5 * 60 * 1000;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

/** 解析 JWT 的 exp（毫秒）；失敗回傳 null。 */
function jwtExpMs(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof json.exp === 'number' ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_USER_KEY) ?? sessionStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

/** 由 email 推導顯示名稱（mock 模式用）。 */
function deriveName(email: string): string {
  const local = email.split('@')[0] ?? '';
  if (!local) return 'Trader';
  return local.charAt(0).toUpperCase() + local.slice(1);
}

/**
 * 儲存工作階段。「記住我」存 localStorage（跨瀏覽器工作階段保留），
 * 否則存 sessionStorage（關閉瀏覽器即登出）；另一個儲存區一律清除。
 */
function persist(token: string | null, user: AuthUser | null, remember = true) {
  const target = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  other.removeItem(AUTH_TOKEN_KEY);
  other.removeItem(AUTH_USER_KEY);
  if (token) target.setItem(AUTH_TOKEN_KEY, token);
  else target.removeItem(AUTH_TOKEN_KEY);
  if (user) target.setItem(AUTH_USER_KEY, JSON.stringify(user));
  else target.removeItem(AUTH_USER_KEY);
}

/** 目前工作階段是否存在 localStorage（即登入時勾了「記住我」；mock 模式看 user key）。 */
function isRemembered(): boolean {
  return localStorage.getItem(AUTH_TOKEN_KEY) !== null || localStorage.getItem(AUTH_USER_KEY) !== null;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loginError: string | null;
  login: (email: string, password: string, remember?: boolean) => Promise<boolean>;
  logout: () => void;
  /** 更新自己的個人檔案（API 模式成功會換發新權杖）。 */
  updateProfile: (name: string, email: string) => Promise<'ok' | 'conflict' | 'error'>;
}

/**
 * 認證狀態。
 * - API 模式：需登入取得 JWT（效期 12 小時）；已存且未過期則視為已登入，並於到期前自動換發。
 * - mock 模式：預設已登入（示範使用者），登出後任意帳密可再登入。
 */
function initialState(): { user: AuthUser | null; isAuthenticated: boolean } {
  const storedUser = readStoredUser();
  if (API_BASE_URL) {
    const token = getStoredToken();
    const exp = token ? jwtExpMs(token) : null;
    const valid = !!token && exp !== null && exp > Date.now();
    if (!valid && token) {
      // 清除兩個儲存區的過期權杖
      persist(null, null, true);
      persist(null, null, false);
    }
    return { user: valid ? storedUser : null, isAuthenticated: valid };
  }
  // mock 模式：預設已登入
  return { user: storedUser ?? DEMO_USER, isAuthenticated: true };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ...initialState(),
  loginError: null,

  login: async (email, password, remember = true) => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      set({ loginError: 'invalid' });
      return false;
    }

    if (API_BASE_URL) {
      try {
        const res = await apiFetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password }),
        });
        if (res.ok === false) {
          set({ loginError: 'unauthorized' });
          return false;
        }
        const data = (await res.json()) as { token: string; user: AuthUser };
        persist(data.token, data.user, remember);
        set({ user: data.user, isAuthenticated: true, loginError: null });
        scheduleRefresh(data.token);
        return true;
      } catch {
        set({ loginError: 'network' });
        return false;
      }
    }

    // mock 模式：接受任意帳密
    const user: AuthUser = { name: deriveName(cleanEmail), email: cleanEmail };
    persist(null, user, remember);
    set({ user, isAuthenticated: true, loginError: null });
    return true;
  },

  logout: () => {
    clearRefreshTimer();
    persist(null, null, true);
    persist(null, null, false);
    set({ user: null, isAuthenticated: false, loginError: null });
  },

  updateProfile: async (name, email) => {
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    if (!cleanName || !cleanEmail) return 'error';

    if (API_BASE_URL) {
      try {
        const res = await apiFetch('/api/auth/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: cleanName, email: cleanEmail }),
        });
        if (res.status === 409) return 'conflict';
        if (res.ok === false) return 'error';
        // email 是權杖身分鍵：改完後端回發新權杖，沿用原儲存區。
        const data = (await res.json()) as { token: string; user: AuthUser };
        persist(data.token, data.user, isRemembered());
        set({ user: data.user });
        scheduleRefresh(data.token);
        return 'ok';
      } catch {
        return 'error';
      }
    }

    // mock 模式：本地更新
    const user: AuthUser = { ...get().user, name: cleanName, email: cleanEmail };
    persist(null, user, isRemembered());
    set({ user });
    return 'ok';
  },
}));

function clearRefreshTimer() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

/** 依權杖到期時間排定下一次換發（僅 API 模式）。 */
function scheduleRefresh(token: string) {
  if (!API_BASE_URL) return;
  clearRefreshTimer();
  const exp = jwtExpMs(token);
  if (exp === null) return;
  const delay = Math.max(1000, exp - Date.now() - REFRESH_BUFFER_MS);
  refreshTimer = setTimeout(() => void doRefresh(), delay);
}

/** 以現有有效權杖換發新權杖；失敗（未授權）則登出，網路錯誤則稍後重試。 */
async function doRefresh() {
  try {
    const res = await apiFetch('/api/auth/refresh', { method: 'POST' });
    if (res.ok === false) {
      useAuthStore.getState().logout();
      return;
    }
    const data = (await res.json()) as { token: string; user: AuthUser };
    // 換發沿用原本的儲存區（記住我 → localStorage）。
    persist(data.token, data.user, isRemembered());
    useAuthStore.setState({ user: data.user, isAuthenticated: true });
    scheduleRefresh(data.token);
  } catch {
    // 網路錯誤：30 秒後重試（不立即登出）
    refreshTimer = setTimeout(() => void doRefresh(), 30_000);
  }
}

// 載入時若已有有效工作階段，排定自動換發。
if (API_BASE_URL && useAuthStore.getState().isAuthenticated) {
  const token = getStoredToken();
  if (token) scheduleRefresh(token);
}
