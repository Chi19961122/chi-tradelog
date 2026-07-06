import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/apiConfig';
import { apiFetch } from '@/lib/apiClient';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
}

export interface CreateUserResult {
  user: AdminUser;
  temporaryPassword: string;
}

/** 取得所有使用者（僅管理員；enabled 由呼叫端控制）。 */
export function useUsers(enabled: boolean) {
  return useQuery({
    queryKey: ['users'],
    enabled: enabled && !!API_BASE_URL,
    queryFn: async (): Promise<AdminUser[]> => {
      const res = await apiFetch('/api/users');
      if (res.ok === false) throw new Error(`取得使用者失敗：${res.status}`);
      return (await res.json()) as AdminUser[];
    },
  });
}

/** 管理員：建立使用者、重設密碼。 */
export function useUserMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] });

  const createUser = useMutation({
    mutationFn: async (vars: { email: string; name: string }): Promise<CreateUserResult> => {
      const res = await apiFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vars),
      });
      if (res.status === 409) throw new Error('conflict');
      if (res.ok === false) throw new Error(`建立使用者失敗：${res.status}`);
      return (await res.json()) as CreateUserResult;
    },
    onSuccess: invalidate,
  });

  const resetPassword = useMutation({
    mutationFn: async (id: number): Promise<string> => {
      const res = await apiFetch(`/api/users/${id}/reset-password`, { method: 'POST' });
      if (res.ok === false) throw new Error(`重設密碼失敗：${res.status}`);
      const data = (await res.json()) as { temporaryPassword: string };
      return data.temporaryPassword;
    },
  });

  return { createUser, resetPassword };
}

/** 由本人變更密碼。回傳 true 表示成功。 */
export function useChangePassword() {
  return useMutation({
    mutationFn: async (vars: { currentPassword: string; newPassword: string }): Promise<boolean> => {
      const res = await apiFetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vars),
      });
      return res.ok;
    },
  });
}
