import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/Modal/Modal';
import { DonutRing } from '@/components/DonutRing/DonutRing';
import { buildDayTrades, type CalendarCell } from '@/lib/metrics';
import { fmtMoney } from '@/lib/format';
import { SYMBOLS_LIST } from '@/lib/seededTrades';
import styles from './DayDetailModal.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  day: number | null;
  cell: CalendarCell | null;
  monthLabel: string;
}

export function DayDetailModal({ open, onClose, day, cell, monthLabel }: Props) {
  const { t } = useTranslation();

  const dayTrades = useMemo(
    () => (day != null && cell ? buildDayTrades(day, cell, SYMBOLS_LIST) : []),
    [day, cell],
  );

  if (!cell || day == null) return null;

  const winRate = cell.tradesCount ? (cell.wins / cell.tradesCount) * 100 : 0;

  return (
    <Modal open={open} onClose={onClose} title={`${monthLabel} ${day}`} subtitle={t('dayDetail.hint')} width={480}>
      <div className={styles.summary}>
        <DonutRing fraction={winRate / 100} size={56} />
        <div className={styles.summaryStats}>
          <Stat label={t('dayDetail.netPnl')} value={fmtMoney(cell.pnl ?? 0)} color={(cell.pnl ?? 0) >= 0 ? 'var(--green)' : 'var(--red)'} />
          <Stat label={t('dayDetail.winRate')} value={`${Math.round(winRate)}%`} color="var(--ink)" />
          <Stat label={t('dayDetail.trades')} value={String(cell.tradesCount)} color="var(--ink)" />
        </div>
      </div>

      <div className={styles.list}>
        {dayTrades.map((tr, i) => (
          <div key={i} className={styles.row}>
            <span
              className={styles.badge}
              style={{
                background: tr.side === 'Long' ? 'var(--long-badge-bg)' : 'var(--short-badge-bg)',
                color: tr.side === 'Long' ? 'var(--blue)' : 'var(--purple)',
              }}
            >
              {tr.side === 'Long' ? 'L' : 'S'}
            </span>
            <span className={styles.sym}>{tr.sym}</span>
            <span className={styles.meta}>
              {t(`side.${tr.side === 'Long' ? 'long' : 'short'}`)} · {tr.qty}
            </span>
            <span className={styles.mono}>
              {tr.entry.toFixed(2)} → {tr.exit.toFixed(2)}
            </span>
            <span className={styles.r}>{tr.r.toFixed(1)}R</span>
            <span className={styles.pnl} style={{ color: tr.pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {fmtMoney(tr.pnl)}
            </span>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue} style={{ color }}>
        {value}
      </div>
    </div>
  );
}
