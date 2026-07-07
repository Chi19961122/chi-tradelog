import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/Icon/Icon';
import { CalendarBlock } from '@/pages/dashboard/CalendarBlock';
import { DayDetailModal } from '@/pages/dashboard/DayDetailModal';
import { JournalModal } from '@/pages/journal/JournalModal';
import { buildCalendar, type CalendarCell } from '@/lib/metrics';
import { detectViolations, violationDates } from '@/lib/discipline';
import { ErrorState, LoadingState } from '@/components/QueryState/QueryState';
import { useTrades } from '@/features/trades/useTrades';
import { useDisciplineRules } from '@/features/settings/useDisciplineRules';
import { useUiStore } from '@/store/uiStore';
import { toISODate } from '@/lib/today';
import { toMetricsLang } from '@/i18n';
import type { Trade } from '@/types/trade';
import styles from './CalendarPage.module.css';

const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function CalendarPage() {
  const { t, i18n } = useTranslation();
  const isZh = toMetricsLang(i18n.language) === 'zh';
  const monthOffset = useUiStore((s) => s.monthOffset);
  const setMonthOffset = useUiStore((s) => s.setMonthOffset);
  const activeAccountIds = useUiStore((s) => s.activeAccountIds);
  const { data: trades = [], isLoading, isError, refetch } = useTrades(activeAccountIds);

  const [dayDetail, setDayDetail] = useState<{ open: boolean; date: string | null; cell: CalendarCell | null }>({
    open: false,
    date: null,
    cell: null,
  });
  const [journal, setJournal] = useState<{ open: boolean; trade: Trade | null }>({ open: false, trade: null });

  const calendar = useMemo(() => buildCalendar(monthOffset, trades), [monthOffset, trades]);

  // 紀律違規：顯示中月份的違規日 → day 數字集合（供格子警示 icon）。
  const { data: rules } = useDisciplineRules();
  const violationDays = useMemo(() => {
    if (!rules) return undefined;
    const monthPrefix = `${calendar.year}-${String(calendar.monthIdx + 1).padStart(2, '0')}-`;
    const dates = violationDates(detectViolations(trades, rules));
    return new Set(
      [...dates].filter((d) => d.startsWith(monthPrefix)).map((d) => Number(d.slice(8, 10))),
    );
  }, [rules, trades, calendar.year, calendar.monthIdx]);
  const monthLabel = isZh
    ? `${calendar.year} 年 ${calendar.monthIdx + 1} 月`
    : `${MONTHS_EN[calendar.monthIdx]} ${calendar.year}`;
  const shortMonth = isZh ? `${calendar.monthIdx + 1}月` : MONTHS_EN[calendar.monthIdx].slice(0, 3);

  const monthNav = (
    <div className={styles.monthNav}>
      <button type="button" className={styles.navBtn} onClick={() => setMonthOffset(monthOffset - 1)} aria-label="Previous month">
        <Icon name="chevronLeft" size={16} />
      </button>
      <span className={styles.monthLabel}>{monthLabel}</span>
      <button type="button" className={styles.navBtn} onClick={() => setMonthOffset(monthOffset + 1)} aria-label="Next month">
        <Icon name="chevronRight" size={16} />
      </button>
    </div>
  );

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('calendar.title')}</h1>
        <div className={styles.subtitle}>{t('calendar.subtitle')}</div>
      </div>

      <CalendarBlock
        weeks={calendar.weeks}
        title={monthLabel}
        subtitle={t('calendar.subtitle')}
        headerRight={monthNav}
        cellMinHeight={112}
        violationDays={violationDays}
        onDayClick={(day, cell) =>
          setDayDetail({ open: true, date: toISODate(new Date(calendar.year, calendar.monthIdx, day)), cell })
        }
      />

      <DayDetailModal
        open={dayDetail.open}
        onClose={() => setDayDetail((d) => ({ ...d, open: false }))}
        date={dayDetail.date}
        cell={dayDetail.cell}
        monthLabel={shortMonth}
        trades={trades}
        onTradeClick={(trade) => {
          setDayDetail((d) => ({ ...d, open: false }));
          setJournal({ open: true, trade });
        }}
      />

      <JournalModal
        open={journal.open}
        onClose={() => setJournal((j) => ({ ...j, open: false }))}
        trade={journal.trade}
      />
    </div>
  );
}
