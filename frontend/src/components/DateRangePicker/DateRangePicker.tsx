import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/Icon/Icon';
import { useOutsideClick } from '@/lib/useOutsideClick';
import { buildMonthGrid, quickRanges, type DateRange } from '@/lib/dateRange';
import { toMetricsLang } from '@/i18n';
import styles from './DateRangePicker.module.css';

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS_EN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface Props {
  value: DateRange;
  onApply: (range: DateRange) => void;
  onClear: () => void;
}

/** 短標籤：2026-07-05 → 7/5。 */
function shortLabel(isoDate: string): string {
  const [, m, d] = isoDate.split('-');
  return `${Number(m)}/${Number(d)}`;
}

export function DateRangePicker({ value, onApply, onClear }: Props) {
  const { t, i18n } = useTranslation();
  const isZh = toMetricsLang(i18n.language) === 'zh';
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(6); // July
  const [tempFrom, setTempFrom] = useState('');
  const [tempTo, setTempTo] = useState('');
  const ref = useOutsideClick<HTMLDivElement>(open, () => setOpen(false));

  const openPicker = () => {
    setTempFrom(value.from);
    setTempTo(value.to);
    setViewYear(2026);
    setViewMonth(6);
    setOpen(true);
  };

  const pickDay = (dayIso: string) => {
    if (!tempFrom || (tempFrom && tempTo)) {
      setTempFrom(dayIso);
      setTempTo('');
    } else if (dayIso < tempFrom) {
      setTempTo(tempFrom);
      setTempFrom(dayIso);
    } else {
      setTempTo(dayIso);
    }
  };

  const done = () => {
    onApply({ from: tempFrom, to: tempTo || tempFrom });
    setOpen(false);
  };
  const clear = () => {
    onClear();
    setOpen(false);
  };

  const cells = buildMonthGrid(viewYear, viewMonth);
  const monthLabel = isZh ? `${viewYear} 年 ${viewMonth + 1} 月` : `${MONTHS_EN[viewMonth]} ${viewYear}`;
  const rangeStart = tempFrom;
  const rangeEnd = tempTo || tempFrom;

  const buttonLabel = value.from
    ? `${shortLabel(value.from)} – ${shortLabel(value.to || value.from)}`
    : t('tradelog.dateRange');

  return (
    <div className={styles.root} ref={ref} data-dropdown-root="true">
      <button type="button" className={styles.trigger} onClick={() => (open ? setOpen(false) : openPicker())}>
        <Icon name="chevronDown" size={11} />
        <span className={value.from ? styles.hasValue : ''}>{buttonLabel}</span>
      </button>

      {open && (
        <div className={styles.popover}>
          <div className={styles.header}>
            <button type="button" className={styles.navBtn} onClick={() => shiftMonth(-1)} aria-label="Prev month">
              <Icon name="chevronLeft" size={14} />
            </button>
            <span className={styles.monthLabel}>{monthLabel}</span>
            <button type="button" className={styles.navBtn} onClick={() => shiftMonth(1)} aria-label="Next month">
              <Icon name="chevronRight" size={14} />
            </button>
          </div>

          <div className={styles.grid}>
            {WEEKDAYS_EN.map((d, i) => (
              <div key={i} className={styles.weekday}>
                {d}
              </div>
            ))}
            {cells.map((cell, i) => {
              if (cell.iso === null) return <div key={i} />;
              const selected =
                cell.iso === rangeStart || cell.iso === rangeEnd || (rangeStart && rangeEnd && cell.iso > rangeStart && cell.iso < rangeEnd);
              const isEnd = cell.iso === rangeStart || cell.iso === rangeEnd;
              return (
                <button
                  key={i}
                  type="button"
                  className={`${styles.day} ${selected ? styles.daySelected : ''} ${isEnd ? styles.dayEnd : ''}`}
                  onClick={() => pickDay(cell.iso!)}
                >
                  {cell.dayNum}
                </button>
              );
            })}
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.clearBtn} onClick={clear}>
              {t('tradelog.clearDate')}
            </button>
            <div className={styles.footerRight}>
              <button type="button" className={styles.cancelBtn} onClick={() => setOpen(false)}>
                {t('tradeForm.cancel')}
              </button>
              <button type="button" className={styles.doneBtn} onClick={done}>
                {t('tradelog.done')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function shiftMonth(delta: number) {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }
}

/** 快速區間膠囊。 */
export function QuickRangePills({ onApply }: { onApply: (range: DateRange) => void }) {
  const { t } = useTranslation();
  return (
    <div className={styles.quickPills}>
      {quickRanges().map((qr) => (
        <button key={qr.key} type="button" className={styles.quickPill} onClick={() => onApply({ from: qr.from, to: qr.to })}>
          {t(`tradelog.q_${qr.key}`)}
        </button>
      ))}
    </div>
  );
}
