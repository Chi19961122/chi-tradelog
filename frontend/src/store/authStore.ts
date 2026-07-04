import { create } from 'zustand';
import { API_BASE_URL } from '@/lib/apiConfig';
import { apiFetch, AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/lib/apiClient';

export interface AuthUser {
  name: string;
  email: string;
}

const DEMO_USER: AuthUser = { name: 'Alex Chen', email: 'alex@chitradelog.com' };

function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_USER_KEY);
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

function persist(token: string | null, user: AuthUser | null) {
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
  else localStorage.removeItem(AUTH_TOKEN_KEY);
  if (user) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(AUTH_USER_KEY);
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loginError: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

/**
 * 認證狀態。
 * - API 模式：需登入取得 JWT；已存 token 則視為已登入。
 * - mock 模式：預設已登入（示範使用者），登出後任意帳密可再登入。
 */
function initialState(): { user: AuthUser | null; isAuthenticated: boolean } {
  const storedUser = readStoredUser();
  if (API_BASE_URL) {
    const hasToken = !!localStorage.getItem(AUTH_TOKEN_KEY);
    return { user: hasToken ? storedUser : null, isAuthenticated: hasToken };
  }
  // mock 模式：預設已登入
  return { user: storedUser ?? DEMO_USER, isAuthenticated: true };
}

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState(),
  loginError: null,

  login: async (email, password) => {
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
        persist(data.token, data.user);
        set({ user: data.user, isAuthenticated: true, loginError: null });
        return true;
      } catch {
        set({ loginError: 'network' });
        return false;
      }
    }

    // mock 模式：接受任意帳密
    const user: AuthUser = { name: deriveName(cleanEmail), email: cleanEmail };
    persist(null, user);
    set({ user, isAuthenticated: true, loginError: null });
    return true;
  },

  logout: () => {
    persist(null, null);
    set({ user: null, isAuthenticated: false, loginError: null });
  },
}));
