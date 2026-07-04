import { useTranslation } from 'react-i18next';
import type { Trade } from '@/types/trade';
import { fmtMoney } from '@/lib/format';
import styles from './RecentTrades.module.css';

export function RecentTrades({ trades }: { trades: Trade[] }) {
  const { t } = useTranslation();
  const recent = trades.slice(0, 6);

  return (
    <div className={styles.card}>
      <div className={styles.title}>{t('dashboard.recentTrades')}</div>
      <div className={styles.list}>
        {recent.map((tr, i) => (
          <div key={tr.id} className={styles.row} style={{ borderTop: i ? '1px solid var(--line)' : 'none' }}>
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
            <span className={styles.r}>{tr.r.toFixed(1)}R</span>
            <span className={styles.pnl} style={{ color: tr.pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {fmtMoney(tr.pnl)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
