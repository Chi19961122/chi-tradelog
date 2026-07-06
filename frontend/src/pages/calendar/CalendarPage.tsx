import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/Icon/Icon';
import { CalendarBlock } from '@/pages/dashboard/CalendarBlock';
import { DayDetailModal } from '@/pages/dashboard/DayDetailModal';
import { JournalModal } from '@/pages/journal/JournalModal';
import { buildCalendar, type CalendarCell } from '@/lib/metrics';
import { ErrorState, LoadingState } from '@/components/QueryState/QueryState';
import { useTrades } from '@/features/trades/useTrades';
import { useUiStore } from '@/store/uiStore';
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

  const [dayDetail, setDayDetail] = useState<{ open: boolean; day: number | null; cell: CalendarCell | null }>({
    open: false,
    day: null,
    cell: null,
  });
  const [journal, setJournal] = useState<{ open: boolean; trade: Trade | null }>({ open: false, trade: null });

  const calendar = useMemo(() => buildCalendar(monthOffset, trades), [monthOffset, trades]);
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
        onDayClick={(day, cell) => setDayDetail({ open: true, day, cell })}
      />

      <DayDetailModal
        open={dayDetail.open}
        onClose={() => setDayDetail((d) => ({ ...d, open: false }))}
        day={dayDetail.day}
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
