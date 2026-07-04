import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { buildRadarAxes, tradeScore, type Kpis } from '@/lib/metrics';
import { toMetricsLang } from '@/i18n';
import styles from './TradeScoreCard.module.css';

interface TooltipPayload {
  active?: boolean;
  payload?: { payload: { axis: string; raw: string; desc: string } }[];
}

function RadarTooltip({ active, payload }: TooltipPayload) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipTitle}>
        {p.axis} · {p.raw}
      </div>
      <div className={styles.tooltipDesc}>{p.desc}</div>
    </div>
  );
}

export function TradeScoreCard({ kpis }: { kpis: Kpis }) {
  const { t, i18n } = useTranslation();
  const metricsLang = toMetricsLang(i18n.language);

  const axes = useMemo(() => buildRadarAxes(kpis, metricsLang), [kpis, metricsLang]);
  const score = useMemo(() => tradeScore(axes), [axes]);
  const data = axes.map((a) => ({ axis: a.label, score: a.score, raw: a.raw, desc: a.desc }));

  return (
    <div className={styles.card}>
      <div className={styles.title}>{t('dashboard.tradeScore')}</div>

      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke="var(--radar-line)" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: 'var(--sub)', fontSize: 10.5, fontWeight: 600 }}
            />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Tooltip content={<RadarTooltip />} />
            <Radar
              dataKey="score"
              stroke="var(--purple)"
              strokeWidth={2}
              fill="var(--purple-fill)"
              fillOpacity={1}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.scoreWrap}>
        <div className={styles.scoreValue}>{score.toFixed(1)}</div>
        <div className={styles.gradientBar}>
          <div className={styles.marker} style={{ left: `${Math.max(0, Math.min(100, score))}%` }} />
        </div>
      </div>
    </div>
  );
}
