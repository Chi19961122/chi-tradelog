import { DonutRing } from '@/components/DonutRing/DonutRing';
import styles from './KpiCard.module.css';

export interface KpiCardVM {
  key: string;
  label: string;
  value: string;
  valueColor: 'ink' | 'green' | 'red';
  ringFraction?: number;
  avgWinText?: string;
  avgLossText?: string;
}

export function KpiCard({ vm }: { vm: KpiCardVM }) {
  const valueColorVar =
    vm.valueColor === 'green' ? 'var(--green)' : vm.valueColor === 'red' ? 'var(--red)' : 'var(--ink)';

  return (
    <div className={styles.card}>
      <div className={styles.label}>{vm.label}</div>

      <div className={styles.valueRow}>
        <div className={styles.value} style={{ color: valueColorVar }}>
          {vm.value}
        </div>
        {vm.ringFraction != null && <DonutRing fraction={vm.ringFraction} />}
      </div>

      {vm.avgWinText && (
        <div className={styles.avgWl}>
          <span style={{ color: 'var(--green)' }}>{vm.avgWinText}</span>
          <span className={styles.avgSep}>/</span>
          <span style={{ color: 'var(--red)' }}>{vm.avgLossText}</span>
        </div>
      )}
    </div>
  );
}
