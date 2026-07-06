import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/Modal/Modal';
import { Icon } from '@/components/Icon/Icon';
import { parsePastedTrades } from '@/lib/pasteImport';
import { fmtMoney } from '@/lib/format';
import type { TradeFormInput } from '@/lib/tradeForm';
import styles from './PasteImportModal.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  /** 確認匯入（清單為預覽中未被移除的列）。 */
  onImport: (rows: TradeFormInput[]) => void;
}

/**
 * 貼上智慧匯入：貼上券商報表文字 → 即時解析預覽（可刪列）→ 確認匯入。
 * 期貨等有合約乘數的商品，淨損益直接採用報表值。
 */
export function PasteImportModal({ open, onClose, onImport }: Props) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [removed, setRemoved] = useState<Set<number>>(new Set());

  const parsed = useMemo(() => parsePastedTrades(text), [text]);
  const rows = parsed.filter((_, i) => removed.has(i) === false);

  const reset = () => {
    setText('');
    setRemoved(new Set());
  };

  const close = () => {
    reset();
    onClose();
  };

  const removeRow = (index: number) => {
    setRemoved((prev) => new Set(prev).add(index));
  };

  const confirm = () => {
    if (rows.length === 0) return;
    onImport(rows);
    close();
  };

  const footer = (
    <>
      <span className={styles.parsedCount}>
        {text.trim() && (parsed.length === 0
          ? t('pasteImport.empty')
          : t('pasteImport.parsed', { count: rows.length }))}
      </span>
      <div className={styles.footerSpacer} />
      <button type="button" className={styles.cancelBtn} onClick={close}>
        {t('common.cancel')}
      </button>
      <button type="button" className={styles.importBtn} disabled={rows.length === 0} onClick={confirm}>
        {t('pasteImport.confirm', { count: rows.length })}
      </button>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={close}
      title={t('pasteImport.title')}
      subtitle={t('pasteImport.subtitle')}
      footer={footer}
      width={680}
    >
      <textarea
        className={styles.textarea}
        value={text}
        placeholder={t('pasteImport.placeholder')}
        onChange={(e) => {
          setText(e.target.value);
          setRemoved(new Set());
        }}
      />

      {parsed.length > 0 && (
        <div className={styles.preview}>
          <div className={styles.previewLabel}>{t('pasteImport.preview')}</div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">{t('tradelog.colDate')}</th>
                <th scope="col">{t('tradelog.colSymbol')}</th>
                <th scope="col">{t('tradelog.colSide')}</th>
                <th scope="col" className={styles.num}>{t('tradelog.colQty')}</th>
                <th scope="col" className={styles.num}>{t('tradelog.colEntry')} → {t('tradelog.colExit')}</th>
                <th scope="col" className={styles.num}>{t('tradelog.colPnl')}</th>
                <th scope="col">{t('tradelog.colTags')}</th>
                <th scope="col" aria-label="remove" />
              </tr>
            </thead>
            <tbody>
              {parsed.map((row, i) =>
                removed.has(i) ? null : (
                  <tr key={i}>
                    <td className={styles.mono}>{row.day}</td>
                    <td className={styles.sym}>{row.sym}</td>
                    <td>{row.side === 'Long' ? t('side.long') : t('side.short')}</td>
                    <td className={styles.mono}>{row.qty}</td>
                    <td className={styles.mono}>
                      {row.entry.toFixed(2)} → {row.exit.toFixed(2)}
                    </td>
                    <td className={styles.mono} style={{ color: (row.pnl ?? 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {fmtMoney(row.pnl ?? 0)}
                    </td>
                    <td>{row.tags.join(', ')}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => removeRow(i)}
                        aria-label="Remove row"
                      >
                        <Icon name="close" size={12} />
                      </button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
