import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/Icon/Icon';
import { useUiStore } from '@/store/uiStore';
import { JournalEditor } from './JournalEditor';
import type { Trade } from '@/types/trade';
import styles from './JournalPage.module.css';

interface Props {
  trade: Trade;
}

/** 整頁 Journal 編輯：較寬的版面與更高的筆記編輯區，返回鈕回到原分頁。 */
export function JournalPage({ trade }: Props) {
  const { t } = useTranslation();
  const closeJournalPage = useUiStore((s) => s.closeJournalPage);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={closeJournalPage}>
          <Icon name="chevronLeft" size={14} />
          {t('journal.back')}
        </button>
        <div>
          <h1 className={styles.title}>{t('journal.title')}</h1>
          <div className={styles.subtitle}>{t('journal.subtitle')}</div>
        </div>
      </div>

      <div className={styles.card}>
        <JournalEditor trade={trade} variant="page" />
      </div>
    </div>
  );
}
