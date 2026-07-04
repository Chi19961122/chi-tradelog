import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTrades } from '@/features/trades/useTrades';
import { useUiStore } from '@/store/uiStore';
import { toMetricsLang } from '@/i18n';
import {
  buildCalendar,
  computeKpis,
  deltaFor,
  type CalendarCell,
  type EquityRange,
} from '@/lib/metrics';
import { fmtMoney } from '@/lib/format';
import { CustomizePopover } from './CustomizePopover';
import { KpiCard, type KpiCardVM } from './KpiCard';
import { EquityCurveCard } from './EquityCurveCard';
import { TradeScoreCard } from './TradeScoreCard';
import { CalendarBlock } from './CalendarBlock';
import { DayDetailModal } from './DayDetailModal';
import { RecentTrades } from './RecentTrades';
import styles from './Dashboard.module.css';

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_ZH = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

export function Dashboard() {
  const { t, i18n } = useTranslation();
  const activeAccountIds = useUiStore((s) => s.activeAccountIds);
  const initialCapital = useUiStore((s) => s.initialCapital);
  const kpiVisible = useUiStore((s) => s.kpiVisible);
  const monthOffset = useUiStore((s) => s.monthOffset);

  const [equityRange, setEquityRange] = useState<EquityRange>('all');
  const [dayDetail, setDayDetail] = useState<{ open: boolean; day: number | null; cell: CalendarCell | null }>({
    open: false,
    day: null,
    cell: null,
  });

  const { data: trades = [], isLoading } = useTrades(activeAccountIds);

  const kpis = useMemo(() => computeKpis(trades, initialCapital), [trades, initialCapital]);
  const calendar = useMemo(() => buildCalendar(monthOffset), [monthOffset]);

  const kpiCards = useMemo<KpiCardVM[]>(() => {
    const { netPnl, winRate, profitFactor, avgWin, avgLoss, avgWL, maxDrawdown, balance } = kpis;
    const wlTotal = Math.max(0.01, avgWin + avgLoss);
    const d1 = deltaFor(1.1, true);
    return [
      { key: 'netpnl', label: t('kpi.netpnl'), value: fmtMoney(netPnl), valueColor: netPnl >= 0 ? 'green' : 'red', delta: d1 },
      { key: 'winrate', label: t('kpi.winrate'), value: winRate.toFixed(1) + '%', valueColor: 'ink', delta: deltaFor(2.2, true), ringFraction: Math.max(0, Math.min(100, winRate)) / 100 },
      { key: 'pf', label: t('kpi.pf'), value: profitFactor.toFixed(2), valueColor: 'ink', delta: deltaFor(3.3, true) },
      { key: 'avgwl', label: t('kpi.avgwl'), value: avgWL.toFixed(1) + 'R', valueColor: 'ink', delta: deltaFor(4.4, true), ringFraction: avgWin / wlTotal, avgWinText: '$' + avgWin.toFixed(1), avgLossText: '$' + avgLoss.toFixed(1) },
      { key: 'maxdd', label: t('kpi.maxdd'), value: fmtMoney(maxDrawdown), valueColor: 'red', delta: deltaFor(5.5, false) },
      { key: 'balance', label: t('kpi.balance'), value: fmtMoney(balance), valueColor: 'ink', delta: d1 },
    ];
  }, [kpis, t]);

  const visibleKpis = kpiCards.filter((k) => kpiVisible[k.key as keyof typeof kpiVisible]);

  const months = toMetricsLang(i18n.language) === 'zh' ? MONTHS_ZH : MONTHS_EN;
  const monthLabel = months[calendar.monthIdx];

  if (isLoading) {
    return <div className={styles.loading}>…</div>;
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('dashboard.title')}</h1>
          <div className={styles.subtitle}>{t('dashboard.subtitle')}</div>
        </div>
        <CustomizePopover />
      </div>

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
        onDayClick={(day, cell) => setDayDetail({ open: true, day, cell })}
      />

      {/* Recent trades */}
      <RecentTrades trades={trades} />

      <DayDetailModal
        open={dayDetail.open}
        onClose={() => setDayDetail((d) => ({ ...d, open: false }))}
        day={dayDetail.day}
        cell={dayDetail.cell}
        monthLabel={monthLabel}
      />
    </div>
  );
}
