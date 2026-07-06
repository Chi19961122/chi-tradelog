import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/Modal/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog';
import { Dropdown } from '@/components/Dropdown/Dropdown';
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl';
import { useUiStore } from '@/store/uiStore';
import { useTradeMutations } from '@/features/trades/useTradeMutations';
import { currentMonthIdx } from '@/lib/today';
import type { Trade, TradeSide } from '@/types/trade';
import styles from './AddEditTradeModal.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  /** 編輯模式帶入的交易；null 為新增模式。 */
  editing: Trade | null;
}

export function AddEditTradeModal({ open, onClose, editing }: Props) {
  const { t } = useTranslation();
  const symbolsList = useUiStore((s) => s.symbolsList);
  const tagsList = useUiStore((s) => s.tagsList);
  const activeAccountIds = useUiStore((s) => s.activeAccountIds);
  const { create, update, remove } = useTradeMutations();

  const [sym, setSym] = useState('');
  const [side, setSide] = useState<TradeSide>('Long');
  const [entry, setEntry] = useState('');
  const [exit, setExit] = useState('');
  const [qty, setQty] = useState('');
  const [day, setDay] = useState('');
  const [tag, setTag] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setSym(editing.sym);
      setSide(editing.side);
      setEntry(String(editing.entry));
      setExit(String(editing.exit));
      setQty(String(editing.qty));
      setDay(String(editing.day));
      setTag(editing.tags[0] ?? '');
    } else {
      setSym('');
      setSide('Long');
      setEntry('');
      setExit('');
      setQty('');
      setDay('');
      setTag('');
    }
  }, [open, editing]);

  const canSave =
    sym.trim() !== '' && entry !== '' && exit !== '' && qty !== '' && Number(qty) > 0;

  const handleSave = () => {
    if (!canSave) return;
    const input = {
      sym,
      side,
      entry: parseFloat(entry) || 0,
      exit: parseFloat(exit) || 0,
      qty: parseInt(qty, 10) || 0,
      day: parseInt(day, 10) || 1,
      tags: tag ? [tag] : [],
    };
    if (editing) {
      update.mutate({ id: editing.id, input });
    } else {
      const accountId = activeAccountIds[0];
      if (!accountId) return;
      create.mutate({ accountId, input });
    }
    onClose();
  };

  const handleDelete = () => {
    if (editing) {
      remove.mutate(editing.id);
      setConfirmingDelete(false);
      onClose();
    }
  };

  const footer = (
    <>
      {editing && (
        <button type="button" className={styles.deleteBtn} onClick={() => setConfirmingDelete(true)}>
          {t('tradeForm.delete')}
        </button>
      )}
      <div className={styles.footerSpacer} />
      <button type="button" className={styles.cancelBtn} onClick={onClose}>
        {t('tradeForm.cancel')}
      </button>
      <button type="button" className={styles.saveBtn} disabled={!canSave} onClick={handleSave}>
        {t('tradeForm.save')}
      </button>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? t('tradeForm.editTitle') : t('tradeForm.addTitle')}
      footer={footer}
      width={440}
    >
      <div className={styles.form}>
        <Field label={t('tradeForm.symbol')}>
          <Dropdown options={symbolsList} value={sym} onChange={setSym} placeholder={t('tradeForm.selectSymbol')} />
        </Field>

        <Field label={t('tradeForm.side')}>
          <SegmentedControl
            value={side}
            onChange={(v) => setSide(v)}
            options={[
              { key: 'Long', label: t('side.long') },
              { key: 'Short', label: t('side.short') },
            ]}
          />
        </Field>

        <div className={styles.row}>
          <Field label={t('tradeForm.entry')}>
            <input className={styles.input} type="number" value={entry} onChange={(e) => setEntry(e.target.value)} />
          </Field>
          <Field label={t('tradeForm.exit')}>
            <input className={styles.input} type="number" value={exit} onChange={(e) => setExit(e.target.value)} />
          </Field>
        </div>

        <div className={styles.row}>
          <Field label={t('tradeForm.qty')}>
            <input className={styles.input} type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
          </Field>
          <Field label={t('tradeForm.day', { month: currentMonthIdx() + 1 })}>
            <input className={styles.input} type="number" min={1} max={31} value={day} onChange={(e) => setDay(e.target.value)} />
          </Field>
        </div>

        <Field label={t('tradeForm.tag')}>
          <Dropdown options={tagsList} value={tag} onChange={setTag} placeholder={t('tradeForm.selectTag')} />
        </Field>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title={t('tradeForm.deleteTitle')}
        message={t('tradeForm.deleteConfirm', { sym: editing?.sym ?? '' })}
        confirmLabel={t('tradeForm.delete')}
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      {children}
    </label>
  );
}
