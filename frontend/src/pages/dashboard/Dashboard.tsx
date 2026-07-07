import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTrades } from '@/features/trades/useTrades';
import { useKpiCards } from '@/features/kpi/useKpiCards';
import { useUiStore } from '@/store/uiStore';
import { currentMonthIdx, currentYear, toISODate } from '@/lib/today';
import { isoInRange } from '@/lib/dateRange';
import { weekRange, WEEKLY_READ_KEY } from '@/lib/weeklyReport';
import { toMetricsLang } from '@/i18n';
import { buildCalendar, computeKpis, type CalendarCell, type EquityRange } from '@/lib/metrics';
import { CustomizePopover } from './CustomizePopover';
import { KpiCard } from './KpiCard';
import { EquityCurveCard } from './EquityCurveCard';
import { TradeScoreCard } from './TradeScoreCard';
import { CalendarBlock } from './CalendarBlock';
import { DayDetailModal } from './DayDetailModal';
import { RecentTrades } from './RecentTrades';
import { JournalModal } from '@/pages/journal/JournalModal';
import { ErrorState, LoadingState } from '@/components/QueryState/QueryState';
import type { Trade } from '@/types/trade';
import styles from './Dashboard.module.css';

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_ZH = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

export function Dashboard() {
  const { t, i18n } = useTranslation();
  const activeAccountIds = useUiStore((s) => s.activeAccountIds);
  const initialCapital = useUiStore((s) => s.initialCapital);
  const kpiVisible = useUiStore((s) => s.kpiVisible);
  const monthOffset = useUiStore((s) => s.monthOffset);
  const setTab = useUiStore((s) => s.setTab);

  const [equityRange, setEquityRange] = useState<EquityRange>('all');
  const [dayDetail, setDayDetail] = useState<{ open: boolean; date: string | null; cell: CalendarCell | null }>({
    open: false,
    date: null,
    cell: null,
  });
  const [journal, setJournal] = useState<{ open: boolean; trade: Trade | null }>({ open: false, trade: null });

  const { data: trades = [], isLoading, isError, refetch } = useTrades(activeAccountIds);

  const kpis = useMemo(() => computeKpis(trades, initialCapital), [trades, initialCapital]);
  const calendar = useMemo(() => buildCalendar(monthOffset, trades), [monthOffset, trades]);

  const kpiCards = useKpiCards(kpis);
  const visibleKpis = kpiCards.filter((k) => kpiVisible[k.key as keyof typeof kpiVisible]);

  // 週報提示：上週有交易且尚未在 Reports 看過上週回顧 → 顯示提示。
  const lastWeek = useMemo(() => weekRange(-1), []);
  const [weeklyRead, setWeeklyRead] = useState(() => localStorage.getItem(WEEKLY_READ_KEY) === lastWeek.from);
  const weeklyHintVisible = weeklyRead === false && trades.some((tr) => isoInRange(tr.date, lastWeek));
  const dismissWeeklyHint = () => {
    localStorage.setItem(WEEKLY_READ_KEY, lastWeek.from);
    setWeeklyRead(true);
  };

  const isZh = toMetricsLang(i18n.language) === 'zh';
  const months = isZh ? MONTHS_ZH : MONTHS_EN;
  const monthLabel = months[calendar.monthIdx];
  // 副標題以「今天」為準（不受月曆切換影響）。
  const subtitleLabel = isZh
    ? `${currentYear()} 年 ${currentMonthIdx() + 1} 月`
    : `${MONTHS_EN[currentMonthIdx()]} ${currentYear()}`;

  if (isLoading) {
    return <LoadingState />;
  }
  if (isError) {
    return <ErrorState onRetry={() => void refetch()} />;
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('dashboard.title')}</h1>
          <div className={styles.subtitle}>{t('dashboard.subtitle', { label: subtitleLabel })}</div>
        </div>
        <CustomizePopover />
      </div>

      {/* 週報未讀提示（上週有交易且未讀過上週回顧） */}
      {weeklyHintVisible && (
        <div className={styles.weeklyHint}>
          <span>{t('dashboard.weeklyHint')}</span>
          <div className={styles.weeklyHintActions}>
            <button
              type="button"
              className={styles.weeklyHintView}
              onClick={() => {
                dismissWeeklyHint();
                setTab('reports');
              }}
            >
              {t('dashboard.weeklyHintView')}
            </button>
            <button type="button" className={styles.weeklyHintDismiss} onClick={dismissWeeklyHint}>
              {t('dashboard.weeklyHintDismiss')}
            </button>
          </div>
        </div>
      )}

      {/* KPI row — repeat(N,1fr) 讓隱藏卡片自動補滿 */}
      <div className={styles.kpiRow} style={{ gridTemplateColumns: `repeat(${Math.max(1, visibleKpis.length)}, 1fr)` }}>
        {visibleKpis.map((vm) => (
          <KpiCard key={vm.key} vm={vm} />
        ))}
      </div>

      {/* Equity Curve + Trade Score */}
      <div className={styles.chartsRow}>
        <EquityCurveCard trades={trades} range={equityRange} onRangeChange={setEquityRange} />
        <TradeScoreCard kpis={kpis} />
      </div>

      {/* Calendar */}
      <CalendarBlock
        weeks={calendar.weeks}
        cellMinHeight={96}
        onDayClick={(day, cell) =>
          setDayDetail({ open: true, date: toISODate(new Date(calendar.year, calendar.monthIdx, day)), cell })
        }
      />

      {/* Recent trades */}
      <RecentTrades trades={trades} />

      <DayDetailModal
        open={dayDetail.open}
        onClose={() => setDayDetail((d) => ({ ...d, open: false }))}
        date={dayDetail.date}
        cell={dayDetail.cell}
        monthLabel={monthLabel}
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
