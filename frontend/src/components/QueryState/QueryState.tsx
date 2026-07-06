import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/Icon/Icon';
import styles from './QueryState.module.css';

/** 資料載入中的骨架狀態。 */
export function LoadingState() {
  const { t } = useTranslation();
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <div className={styles.spinner} />
      <span className={styles.text}>{t('state.loading')}</span>
    </div>
  );
}

/** 查詢失敗的錯誤狀態（可重試）。 */
export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <div className={styles.wrap} role="alert">
      <Icon name="close" size={18} />
      <span className={styles.text}>{t('state.error')}</span>
      {onRetry && (
        <button type="button" className={styles.retryBtn} onClick={onRetry}>
          {t('state.retry')}
        </button>
      )}
    </div>
  );
}

/** 無資料的空狀態。 */
export function EmptyState({ message }: { message?: string }) {
  const { t } = useTranslation();
  return (
    <div className={styles.wrap}>
      <span className={styles.text}>{message ?? t('state.empty')}</span>
    </div>
  );
}
