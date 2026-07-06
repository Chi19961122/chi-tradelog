import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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

/** 管理員：列出/新增使用者、重設密碼。 */
export function UserManagementSection() {
  const { t } = useTranslation();
  const { data: users = [] } = useUsers(true);
  const { createUser, resetPassword } = useUserMutations();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [notice, setNotice] = useState<{ email: string; password: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const add = async () => {
    if (!email || !name) return;
    try {
      const result = await createUser.mutateAsync({ email, name });
      setNotice({ email: result.user.email, password: result.temporaryPassword });
      setEmail('');
      setName('');
      setError(null);
    } catch (e) {
      setError((e as Error).message === 'conflict' ? t('settings.emailExists') : String((e as Error).message));
    }
  };

  const reset = async (user: AdminUser) => {
    const password = await resetPassword.mutateAsync(user.id);
    setNotice({ email: user.email, password });
    setError(null);
  };

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <div className={styles.title}>{t('settings.usersTitle')}</div>
        <div className={styles.subtitle}>{t('settings.usersSubtitle')}</div>
      </div>

      <div className={styles.users}>
        {users.map((u) => (
          <div key={u.id} className={styles.userRow}>
            <div>
              <div className={styles.userName}>
                {u.name}
                {u.isAdmin && <span className={styles.badge}>{t('settings.admin')}</span>}
              </div>
              <div className={styles.userEmail}>{u.email}</div>
            </div>
            {u.isAdmin === false && (
              <button type="button" className={styles.resetBtn} onClick={() => reset(u)} disabled={resetPassword.isPending}>
                {t('settings.resetPassword')}
              </button>
            )}
          </div>
        ))}
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
    </div>
  );
}
