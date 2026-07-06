import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog';
import { useChangePassword, useUsers, useUserMutations, type AdminUser } from '@/features/users/useUsers';
import styles from './AccountSecuritySections.module.css';

/** 變更自己的密碼（所有登入使用者）。 */
export function ChangePasswordSection() {
  const { t } = useTranslation();
  const change = useChangePassword();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [status, setStatus] = useState<'idle' | 'ok' | 'err'>('idle');

  const submit = async () => {
    if (!current || !next) return;
    const ok = await change.mutateAsync({ currentPassword: current, newPassword: next });
    if (ok) {
      setStatus('ok');
      setCurrent('');
      setNext('');
    } else {
      setStatus('err');
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <div className={styles.title}>{t('settings.passwordTitle')}</div>
        <div className={styles.subtitle}>{t('settings.passwordSubtitle')}</div>
      </div>
      <div className={styles.row2}>
        <label className={styles.field}>
          <span className={styles.label}>{t('settings.currentPassword')}</span>
          <input
            className={styles.input}
            type="password"
            value={current}
            onChange={(e) => {
              setCurrent(e.target.value);
              setStatus('idle');
            }}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>{t('settings.newPassword')}</span>
          <input
            className={styles.input}
            type="password"
            value={next}
            onChange={(e) => {
              setNext(e.target.value);
              setStatus('idle');
            }}
          />
        </label>
      </div>
      {status === 'ok' && <div className={styles.ok}>{t('settings.passwordChanged')}</div>}
      {status === 'err' && <div className={styles.err}>{t('settings.passwordError')}</div>}
      <button type="button" className={styles.primaryBtn} disabled={!current || !next || change.isPending} onClick={submit}>
        {t('settings.changePassword')}
      </button>
    </div>
  );
}

/** 管理員：列出/新增/編輯/刪除使用者、重設密碼。 */
export function UserManagementSection() {
  const { t } = useTranslation();
  const { data: users = [] } = useUsers(true);
  const { createUser, resetPassword, updateUser, deleteUser } = useUserMutations();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [notice, setNotice] = useState<{ email: string; password: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: number; name: string; email: string; isAdmin: boolean } | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);

  /** 將 mutation 錯誤轉為顯示文字。 */
  const errorText = (e: unknown) => {
    const message = (e as Error).message;
    if (message === 'conflict') return t('settings.emailExists');
    if (message === 'lastAdmin') return t('settings.lastAdmin');
    return String(message);
  };

  const add = async () => {
    if (!email || !name) return;
    try {
      const result = await createUser.mutateAsync({ email, name });
      setNotice({ email: result.user.email, password: result.temporaryPassword });
      setEmail('');
      setName('');
      setError(null);
    } catch (e) {
      setError(errorText(e));
    }
  };

  const reset = async (user: AdminUser) => {
    const password = await resetPassword.mutateAsync(user.id);
    setNotice({ email: user.email, password });
    setError(null);
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await updateUser.mutateAsync(editing);
      setEditing(null);
      setError(null);
    } catch (e) {
      setError(errorText(e));
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteUser.mutateAsync(deleting.id);
      setError(null);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <div className={styles.title}>{t('settings.usersTitle')}</div>
        <div className={styles.subtitle}>{t('settings.usersSubtitle')}</div>
      </div>

      <div className={styles.users}>
        {users.map((u) =>
          editing?.id === u.id ? (
            <div key={u.id} className={styles.userRow}>
              <div className={styles.editFields}>
                <input
                  className={styles.input}
                  value={editing.name}
                  placeholder={t('settings.userName')}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
                <input
                  className={styles.input}
                  type="email"
                  value={editing.email}
                  placeholder={t('settings.userEmail')}
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                />
                <label className={styles.adminToggle}>
                  <input
                    type="checkbox"
                    checked={editing.isAdmin}
                    onChange={(e) => setEditing({ ...editing, isAdmin: e.target.checked })}
                  />
                  {t('settings.admin')}
                </label>
              </div>
              <div className={styles.rowActions}>
                <button type="button" className={styles.resetBtn} onClick={() => setEditing(null)}>
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  disabled={!editing.name || !editing.email || updateUser.isPending}
                  onClick={saveEdit}
                >
                  {t('common.save')}
                </button>
              </div>
            </div>
          ) : (
            <div key={u.id} className={styles.userRow}>
              <div>
                <div className={styles.userName}>
                  {u.name}
                  {u.isAdmin && <span className={styles.badge}>{t('settings.admin')}</span>}
                </div>
                <div className={styles.userEmail}>{u.email}</div>
              </div>
              <div className={styles.rowActions}>
                <button
                  type="button"
                  className={styles.resetBtn}
                  onClick={() => setEditing({ id: u.id, name: u.name, email: u.email, isAdmin: u.isAdmin })}
                >
                  {t('common.edit')}
                </button>
                {u.isAdmin === false && (
                  <button type="button" className={styles.resetBtn} onClick={() => reset(u)} disabled={resetPassword.isPending}>
                    {t('settings.resetPassword')}
                  </button>
                )}
                <button type="button" className={styles.dangerBtn} onClick={() => setDeleting(u)} disabled={deleteUser.isPending}>
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ),
        )}
      </div>

      <div className={styles.addRow}>
        <input className={styles.input} placeholder={t('settings.userName')} value={name} onChange={(e) => setName(e.target.value)} />
        <input className={styles.input} type="email" placeholder={t('settings.userEmail')} value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="button" className={styles.primaryBtn} disabled={!email || !name || createUser.isPending} onClick={add}>
          {t('settings.addUser')}
        </button>
      </div>

      {error && <div className={styles.err}>{error}</div>}
      {notice && <div className={styles.notice}>{t('settings.tempPasswordNotice', notice)}</div>}

      <ConfirmDialog
        open={deleting !== null}
        title={t('settings.deleteUserTitle')}
        message={t('settings.deleteUserConfirm', { name: deleting?.name ?? '' })}
        confirmLabel={t('common.delete')}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
