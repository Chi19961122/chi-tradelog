import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/Modal/Modal';
import { Icon } from '@/components/Icon/Icon';
import { useUiStore } from '@/store/uiStore';
import { JournalEditor } from './JournalEditor';
import type { Trade } from '@/types/trade';
import styles from './JournalModal.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  trade: Trade | null;
}

/**
 * Journal 彈窗：薄殼，內容由共用的 <see>JournalEditor</see> 提供；
 * 標題列的展開鈕可切換到整頁編輯模式。
 */
export function JournalModal({ open, onClose, trade }: Props) {
  const { t } = useTranslation();
  const openJournalPage = useUiStore((s) => s.openJournalPage);

  if (!trade) return null;

  const expand = () => {
    onClose();
    openJournalPage(trade);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <span className={styles.titleRow}>
          {t('journal.title')}
          <button
            type="button"
            className={styles.expandBtn}
            onClick={expand}
            title={t('journal.openFullPage')}
            aria-label={t('journal.openFullPage')}
          >
            <Icon name="expand" size={13} />
          </button>
        </span>
      }
      subtitle={t('journal.subtitle')}
      width={560}
    >
      <JournalEditor trade={trade} />
    </Modal>
  );
}
