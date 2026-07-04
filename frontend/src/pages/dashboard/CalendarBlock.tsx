import { useTranslation } from 'react-i18next';
import type { CalendarCell, CalendarWeek } from '@/lib/metrics';
import { fmtMoney } from '@/lib/format';
import { toMetricsLang } from '@/i18n';
import styles from './CalendarBlock.module.css';

const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_ZH = ['日', '一', '二', '三', '四', '五', '六'];
const CN_NUM = ['一', '二', '三', '四', '五', '六'];

interface Props {
  weeks: CalendarWeek[];
  onDayClick: (day: number, cell: CalendarCell) => void;
}

/** 日曆格子的語意色淡填充。 */
function cellStyle(cell: CalendarCell): React.CSSProperties {
  if (!cell.hasData) {
    if (cell.day === '') return { background: 'transparent', border: '1px solid transparent' };
    return { background: 'var(--pill)', border: '1px solid var(--line)' };
  }
  const pos = (cell.pnl ?? 0) >= 0;
  const rgb = pos ? 'var(--green-rgb)' : 'var(--red-rgb)';
  return {
    background: `rgb(${rgb} / 0.14)`,
    border: `1px solid rgb(${rgb} / 0.32)`,
  };
}

function statStyle(stat: CalendarWeek['stat']): React.CSSProperties {
  if (!stat.hasData) return { background: 'var(--pill)', border: '1px solid var(--line)' };
  const pos = stat.pnl >= 0;
  const rgb = pos ? 'var(--green-rgb)' : 'var(--red-rgb)';
  return { background: `rgb(${rgb} / 0.18)`, border: `1px solid rgb(${rgb} / 0.38)` };
}

export function CalendarBlock({ weeks, onDayClick }: Props) {
  const { t, i18n } = useTranslation();
  const isZh = toMetricsLang(i18n.language) === 'zh';
  const weekdays = isZh ? WEEKDAYS_ZH : WEEKDAYS_EN;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>{t('dashboard.calendar')}</div>
          <div className={styles.subtitle}>{t('dashboard.calendarSubtitle')}</div>
        </div>
      </div>

      <div className={styles.grid}>
        {weekdays.map((d) => (
          <div key={d} className={styles.weekdayLabel}>
            {d}
          </div>
        ))}
        <div className={styles.weekdayLabel} />

        {weeks.map((week, wi) => (
          <div key={wi} className={styles.weekRow}>
            {week.cells.map((cell, ci) => {
              const pos = (cell.pnl ?? 0) >= 0;
              return (
                <button
                  key={ci}
                  type="button"
                  className={styles.cell}
                  style={{ ...cellStyle(cell), cursor: cell.hasData ? 'pointer' : 'default' }}
                  disabled={!cell.hasData}
                  onClick={() => cell.hasData && typeof cell.day === 'number' && onDayClick(cell.day, cell)}
                >
                  <span
                    className={styles.dayNum}
                    style={{ color: cell.hasData ? 'var(--ink)' : 'var(--faint)' }}
                  >
                    {cell.day}
                  </span>
                  {cell.hasData && (
                    <>
                      <span
                        className={styles.cellPnl}
                        style={{ color: pos ? 'var(--green)' : 'var(--red)' }}
                      >
                        {fmtMoney(cell.pnl ?? 0)}
                      </span>
                      <span className={styles.cellSub}>
                        {Math.round((cell.wins / cell.tradesCount) * 100)}% · {cell.tradesCount}
                      </span>
                    </>
                  )}
                </button>
              );
            })}

            {/* 第 8 欄：週統計 */}
            <div className={styles.statCell} style={statStyle(week.stat)}>
              <span className={styles.statLabel}>
                {isZh ? `第${CN_NUM[wi]}週` : `Week ${wi + 1}`}
              </span>
              <span
                className={styles.statPnl}
                style={{ color: week.stat.pnl >= 0 ? 'var(--green)' : 'var(--red)' }}
              >
                {week.stat.hasData ? fmtMoney(week.stat.pnl) : '—'}
              </span>
              {week.stat.hasData && (
                <span className={styles.statSub}>
                  {week.stat.winRate}% {t('dashboard.win')}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
