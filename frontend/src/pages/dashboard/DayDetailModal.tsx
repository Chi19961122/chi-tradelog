import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/Modal/Modal';
import { DonutRing } from '@/components/DonutRing/DonutRing';
import type { CalendarCell } from '@/lib/metrics';
import { fmtMoney } from '@/lib/format';
import type { Trade } from '@/types/trade';
import styles from './DayDetailModal.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  /** 當日完整日期（ISO <c>yyyy-MM-dd</c>）。 */
  date: string | null;
  cell: CalendarCell | null;
  monthLabel: string;
  /** 真實交易清單（依日期過濾出當日交易）。 */
  trades: Trade[];
  /** 點擊單筆交易列時觸發（跳到該筆日記）。 */
  onTradeClick?: (trade: Trade) => void;
}

export function DayDetailModal({ open, onClose, date, cell, monthLabel, trades, onTradeClick }: Props) {
  const { t } = useTranslation();

  // 由真實交易過濾出當日明細。
  const dayTrades = useMemo(
    () => (date ? trades.filter((tr) => tr.date === date) : []),
    [date, trades],
  );

  if (!cell || !date) return null;

  const dayNum = Number(date.slice(8, 10));
  const winRate = cell.tradesCount ? (cell.wins / cell.tradesCount) * 100 : 0;

  return (
    <Modal open={open} onClose={onClose} title={`${monthLabel} ${dayNum}`} subtitle={t('dayDetail.hint')} width={480}>
      <div className={styles.summary}>
        <DonutRing fraction={winRate / 100} size={56} />
        <div className={styles.summaryStats}>
          <Stat label={t('dayDetail.netPnl')} value={fmtMoney(cell.pnl ?? 0)} color={(cell.pnl ?? 0) >= 0 ? 'var(--green)' : 'var(--red)'} />
          <Stat label={t('dayDetail.winRate')} value={`${Math.round(winRate)}%`} color="var(--ink)" />
          <Stat label={t('dayDetail.trades')} value={String(cell.tradesCount)} color="var(--ink)" />
        </div>
      </div>

      <div className={styles.list}>
        {dayTrades.map((tr) => (
          <div
            key={tr.id}
            className={`${styles.row} ${onTradeClick ? styles.rowClickable : ''}`}
            onClick={onTradeClick ? () => onTradeClick(tr) : undefined}
          >
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
