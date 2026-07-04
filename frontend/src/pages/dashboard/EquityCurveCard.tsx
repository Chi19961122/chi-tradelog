import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl';
import { buildEquityData, type EquityRange } from '@/lib/metrics';
import { fmtMoney } from '@/lib/format';
import type { Trade } from '@/types/trade';
import { toMetricsLang } from '@/i18n';
import styles from './EquityCurveCard.module.css';

const RANGES: EquityRange[] = ['all', 'month', 'quarter', 'year'];

interface TooltipPayload {
  active?: boolean;
  payload?: { payload: { label: string | null; value: number } }[];
}

function EquityTooltip({ active, payload }: TooltipPayload) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipDate}>{p.label ?? '—'}</div>
      <div className={styles.tooltipValue}>{fmtMoney(p.value)}</div>
    </div>
  );
}

interface Props {
  trades: Trade[];
  range: EquityRange;
  onRangeChange: (r: EquityRange) => void;
}

export function EquityCurveCard({ trades, range, onRangeChange }: Props) {
  const { t, i18n } = useTranslation();
  const metricsLang = toMetricsLang(i18n.language);

  const { points, current, high, low } = useMemo(
    () => buildEquityData(trades, range, metricsLang),
    [trades, range, metricsLang],
  );

  const data = useMemo(
    () => points.map((p, i) => ({ i, label: p.label, value: p.value })),
    [points],
  );

  const accent = current >= 0 ? 'var(--green)' : 'var(--red)';

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.title}>{t('dashboard.equityCurve')}</div>
        <SegmentedControl
          size="sm"
          value={range}
          onChange={(r) => onRangeChange(r as EquityRange)}
          options={RANGES.map((r) => ({ key: r, label: t(`range.${r}`) }))}
        />
      </div>

      <div className={styles.stats}>
        <Stat label={t('dashboard.current')} value={fmtMoney(current)} color={current >= 0 ? 'var(--green)' : 'var(--red)'} />
        <Stat label={t('dashboard.high')} value={fmtMoney(high)} color="var(--green)" />
        <Stat label={t('dashboard.low')} value={fmtMoney(low)} color="var(--red)" />
      </div>

      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
            <defs>
              <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity={0.28} />
                <stop offset="100%" stopColor={accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis
              dataKey="label"
              tickFormatter={(v) => v ?? ''}
              interval="preserveStartEnd"
              minTickGap={60}
              tick={{ fill: 'var(--faint)', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
              axisLine={{ stroke: 'var(--line)' }}
              tickLine={false}
            />
            <YAxis
              width={54}
              tickFormatter={(v) => fmtMoney(v)}
              tick={{ fill: 'var(--faint)', fontSize: 10.5, fontFamily: 'IBM Plex Mono' }}
              axisLine={false}
              tickLine={false}
            />
            <ReferenceLine y={0} stroke="var(--line)" />
            <Tooltip content={<EquityTooltip />} cursor={{ stroke: 'var(--sub)', strokeDasharray: '3 3' }} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={accent}
              strokeWidth={2}
              fill="url(#equityFill)"
              dot={false}
              activeDot={{ r: 3.5, fill: accent, stroke: 'var(--card)', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue} style={{ color }}>
        {value}
      </div>
    </div>
  );
}
