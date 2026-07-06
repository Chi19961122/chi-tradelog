import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/Modal/Modal';
import styles from './ConfirmDialog.module.css';

interface Props {
  open: boolean;
  title: string;
  /** 說明文字（危險操作的後果）。 */
  message: string;
  /** 確認鈕文字；未指定時用共用「確認」。 */
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** 破壞性操作的確認對話框（reuse 共用 Modal）。 */
export function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel }: Props) {
  const { t } = useTranslation();
  return (
    <Modal open={open} onClose={onCancel} title={title} width={400}>
      <div className={styles.message}>{message}</div>
      <div className={styles.actions}>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          {t('common.cancel')}
        </button>
        <button type="button" className={styles.confirmBtn} onClick={onConfirm}>
          {confirmLabel ?? t('common.confirm')}
        </button>
      </div>
    </Modal>
  );
}
