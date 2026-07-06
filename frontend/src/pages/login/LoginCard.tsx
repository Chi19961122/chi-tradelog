import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/Icon/Icon';
import { useAuthStore } from '@/store/authStore';
import { API_BASE_URL } from '@/lib/apiConfig';
import styles from './LoginCard.module.css';

export function LoginCard() {
  const { t } = useTranslation();
  const login = useAuthStore((s) => s.login);
  const loginError = useAuthStore((s) => s.loginError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    await login(email, password, rememberMe);
    setSubmitting(false);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.head}>
          <div className={styles.wordmark}>Chi.TradeLog</div>
          <div className={styles.subtitle}>{t('login.subtitle')}</div>
        </div>

        <div className={styles.fields}>
          <label className={styles.field}>
            <span className={styles.label}>{t('login.email')}</span>
            <input
              className={styles.input}
              type="email"
              placeholder={t('login.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>{t('login.password')}</span>
            <input
              className={styles.input}
              type="password"
              placeholder={t('login.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void submit();
              }}
            />
          </label>
        </div>

        <button type="button" className={styles.remember} onClick={() => setRememberMe((r) => !r)}>
          <span className={`${styles.checkbox} ${rememberMe ? styles.checkboxOn : ''}`}>
            {rememberMe && <Icon name="check" size={12} />}
          </span>
          {t('login.rememberMe')}
        </button>

        {loginError && <div className={styles.error}>{t('login.error')}</div>}

        <button type="button" className={styles.submit} disabled={submitting} onClick={() => void submit()}>
          {t('login.logIn')}
        </button>

        <div className={styles.hint}>{API_BASE_URL ? t('login.hintApi') : t('login.hintMock')}</div>
      </div>
    </div>
  );
}
