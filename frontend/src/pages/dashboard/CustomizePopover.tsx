import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/Icon/Icon';
import { useOutsideClick } from '@/lib/useOutsideClick';
import { useUiStore, type KpiVisibility } from '@/store/uiStore';
import styles from './CustomizePopover.module.css';

const KPI_KEYS: (keyof KpiVisibility)[] = ['netpnl', 'winrate', 'pf', 'avgwl', 'maxdd', 'balance'];

export function CustomizePopover() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const kpiVisible = useUiStore((s) => s.kpiVisible);
  const toggleKpi = useUiStore((s) => s.toggleKpi);
  const ref = useOutsideClick<HTMLDivElement>(open, () => setOpen(false));

  return (
    <div className={styles.root} ref={ref} data-dropdown-root="true">
      <button type="button" className={styles.btn} onClick={() => setOpen((o) => !o)}>
        <Icon name="gear" size={14} />
        {t('dashboard.customize')}
      </button>
      {open && (
        <div className={styles.popover}>
          {KPI_KEYS.map((key) => {
            const on = kpiVisible[key];
            return (
              <button key={key} type="button" className={styles.row} onClick={() => toggleKpi(key)}>
                <span className={styles.rowLabel}>{t(`kpi.${key}`)}</span>
                <span className={`${styles.track} ${on ? styles.trackOn : ''}`}>
                  <span className={styles.knob} />
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
