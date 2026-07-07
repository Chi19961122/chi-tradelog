import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTrades } from '@/features/trades/useTrades';
import { useKpiCards } from '@/features/kpi/useKpiCards';
import { useUiStore } from '@/store/uiStore';
import { computeKpis } from '@/lib/metrics';
import {
  buildHoldingDistribution,
  buildHourlyStats,
  buildMonthlyPerformance,
  buildRDistribution,
  buildStrategyStats,
  buildSymbolPnl,
  buildWeekdayWinRate,
} from '@/lib/reports';
import { fmtMoney, fmtShortDate } from '@/lib/format';
import { toMetricsLang } from '@/i18n';
import { KpiCard } from '@/pages/dashboard/KpiCard';
import { EmptyState, ErrorState, LoadingState } from '@/components/QueryState/QueryState';
import styles from './Reports.module.css';

const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_ZH = ['日', '一', '二', '三', '四', '五', '六'];

interface BarDatum {
  label: string;
  value: number;
  color: string;
  display: string;
}

export function Reports() {
  const { t, i18n } = useTranslation();
  const metricsLang = toMetricsLang(i18n.language);
  const activeAccountIds = useUiStore((s) => s.activeAccountIds);
  const initialCapital = useUiStore((s) => s.initialCapital);
  const { data: trades = [], isLoading, isError, refetch } = useTrades(activeAccountIds);

  const kpis = useMemo(() => computeKpis(trades, initialCapital), [trades, initialCapital]);
  const kpiCards = useKpiCards(kpis);

  const weekdayLabels = metricsLang === 'zh' ? WEEKDAYS_ZH : WEEKDAYS_EN;

  const weekday = useMemo<BarDatum[]>(
    () =>
      buildWeekdayWinRate(trades).map((w) => ({
        label: weekdayLabels[w.weekday],
        value: Math.round(w.winRate),
        color: 'var(--blue)',
        display: `${Math.round(w.winRate)}%`,
      })),
    [trades, weekdayLabels],
  );

  const symbolPnl = useMemo<BarDatum[]>(
    () =>
      buildSymbolPnl(trades).map((s) => ({
        label: s.sym,
        value: s.pnl,
        color: s.pnl >= 0 ? 'var(--green)' : 'var(--red)',
        display: fmtMoney(s.pnl),
      })),
    [trades],
  );

  const rDist = useMemo<BarDatum[]>(
    () =>
      buildRDistribution(trades).map((b) => ({
        label: b.label,
        value: b.count,
        color: b.positive ? 'var(--green)' : 'var(--red)',
        display: String(b.count),
      })),
    [trades],
  );

  const holding = useMemo(() => buildHoldingDistribution(trades, metricsLang), [trades, metricsLang]);
  const holdingData = useMemo<BarDatum[]>(
    () =>
      holding.buckets.map((b) => ({
        label: b.label,
        value: b.count,
        color: 'var(--purple)',
        display: String(b.count),
      })),
    [holding],
  );

  const monthly = useMemo<BarDatum[]>(
    () =>
      buildMonthlyPerformance(trades, metricsLang).map((m) => ({
        label: m.label,
        value: m.pnl,
        color: m.pnl >= 0 ? 'var(--green)' : 'var(--red)',
        display: fmtMoney(m.pnl),
      })),
    [trades, metricsLang],
  );

  const strategy = useMemo(() => buildStrategyStats(trades), [trades]);

  const hourly = useMemo(() => buildHourlyStats(trades), [trades]);
  const hourlyData = useMemo<BarDatum[]>(
    () =>
      hourly.buckets.map((b) => ({
        label: `${b.hour}:00`,
        value: b.pnl,
        color: b.pnl >= 0 ? 'var(--green)' : 'var(--red)',
        display: `${fmtMoney(b.pnl)} · ${b.winRate}% (${b.count})`,
      })),
    [hourly],
  );

  // 進階統計卡的列（連勝連敗、期望值、最佳/最差日）。
  const streakText = (n: number) =>
    n === 0 ? '—' : n > 0 ? t('reports.streakWin', { n }) : t('reports.streakLoss', { n: -n });
  const advancedRows: { label: string; value: string; color?: string }[] = [
    { label: t('reports.currentStreak'), value: streakText(kpis.currentStreak), color: kpis.currentStreak >= 0 ? 'var(--green)' : 'var(--red)' },
    { label: t('reports.maxWinStreak'), value: kpis.maxWinStreak ? t('reports.streakWin', { n: kpis.maxWinStreak }) : '—', color: 'var(--green)' },
    { label: t('reports.maxLossStreak'), value: kpis.maxLossStreak ? t('reports.streakLoss', { n: kpis.maxLossStreak }) : '—', color: 'var(--red)' },
    { label: t('reports.expectancy'), value: fmtMoney(kpis.expectancy), color: kpis.expectancy >= 0 ? 'var(--green)' : 'var(--red)' },
    {
      label: t('reports.bestDay'),
      value: kpis.bestDay ? `${fmtShortDate(kpis.bestDay.date, metricsLang)} · ${fmtMoney(kpis.bestDay.pnl)}` : '—',
      color: 'var(--green)',
    },
    {
      label: t('reports.worstDay'),
      value: kpis.worstDay ? `${fmtShortDate(kpis.worstDay.date, metricsLang)} · ${fmtMoney(kpis.worstDay.pnl)}` : '—',
      color: 'var(--red)',
    },
  ];

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (trades.length === 0) return <EmptyState />;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('reports.title')}</h1>
        <div className={styles.subtitle}>{t('reports.subtitle')}</div>
      </div>

      <div className={styles.kpiRow}>
        {/* 期望值/連勝為 Dashboard KPI 卡候選；Reports 已有進階統計卡呈現，避免重複。 */}
        {kpiCards
          .filter((vm) => vm.key !== 'expectancy' && vm.key !== 'streak')
          .map((vm) => (
            <KpiCard key={vm.key} vm={vm} />
          ))}
      </div>

      <div className={styles.grid}>
        <ChartCard title={t('reports.winrateWeekday')}>
          <BarBlock data={weekday} />
        </ChartCard>
        <ChartCard title={t('reports.pnlSymbol')}>
          <BarBlock data={symbolPnl} />
        </ChartCard>
        <ChartCard title={t('reports.rDistribution')}>
          <BarBlock data={rDist} />
        </ChartCard>
        <ChartCard
          title={t('reports.holdingTime')}
          headerRight={
            <span className={styles.avgHolding}>
              {t('reports.avgHolding')} · <span className={styles.mono}>{holding.avgText}</span>
            </span>
          }
        >
          <BarBlock data={holdingData} />
        </ChartCard>
        <ChartCard title={t('reports.monthly')}>
          <BarBlock data={monthly} />
        </ChartCard>
        <ChartCard title={t('reports.advanced')}>
          <table className={styles.table}>
            <tbody>
              {advancedRows.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td className={styles.num}>
                    <span className={styles.mono} style={row.color ? { color: row.color } : undefined}>
                      {row.value}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ChartCard>
        <ChartCard
          title={t('reports.hourly')}
          headerRight={
            <span className={styles.avgHolding}>
              {t('reports.hourlySample', { n: hourly.sampleCount, total: hourly.totalCount })}
            </span>
          }
        >
          {hourly.sampleCount > 0 ? (
            <BarBlock data={hourlyData} />
          ) : (
            <div className={styles.chartEmpty}>{t('reports.hourlyEmpty')}</div>
          )}
        </ChartCard>
        <ChartCard title={t('reports.strategy')}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('reports.colTag')}</th>
                <th className={styles.num}>{t('reports.colTrades')}</th>
                <th className={styles.num}>{t('reports.colWinRate')}</th>
                <th className={styles.num}>{t('reports.colAvgPnl')}</th>
              </tr>
            </thead>
            <tbody>
              {strategy.map((s) => (
                <tr key={s.tag}>
                  <td>
                    <span className={styles.tagChip}>{s.tag}</span>
                  </td>
                  <td className={styles.mono}>{s.count}</td>
                  <td className={styles.mono}>{s.winRate}%</td>
                  <td className={styles.mono} style={{ color: s.avgPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {s.avgPnlText}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  headerRight,
  children,
}: {
  title: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>{title}</div>
        {headerRight}
      </div>
      {children}
    </div>
  );
}

interface TooltipProps {
  active?: boolean;
  payload?: { payload: BarDatum }[];
}

function BarTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>{d.label}</div>
      <div className={styles.tooltipValue}>{d.display}</div>
    </div>
  );
}

function BarBlock({ data }: { data: BarDatum[] }) {
  return (
    <div className={styles.chart}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--faint)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--line)' }}
            tickLine={false}
            interval={0}
          />
          <YAxis hide />
          <Tooltip content={<BarTooltip />} cursor={{ fill: 'var(--pill)' }} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
