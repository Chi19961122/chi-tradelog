import type { Trade } from '@/types/trade';
import { fmtMoney } from './format';
import { parseISODate } from './today';

/* ------------------------------------------------------------------ */
/* Win Rate by Weekday（真實：由交易日期推導星期）                      */
/* ------------------------------------------------------------------ */

export interface WeekdayWinRate {
  weekday: number; // 0 = Sun
  winRate: number; // 0–100
  count: number;
}

export function buildWeekdayWinRate(trades: Trade[]): WeekdayWinRate[] {
  const wins = Array<number>(7).fill(0);
  const total = Array<number>(7).fill(0);
  for (const tr of trades) {
    const weekday = parseISODate(tr.date).getDay();
    total[weekday] += 1;
    if (tr.pnl >= 0) wins[weekday] += 1;
  }
  return Array.from({ length: 7 }, (_, i) => ({
    weekday: i,
    winRate: total[i] ? (wins[i] / total[i]) * 100 : 0,
    count: total[i],
  }));
}

/* ------------------------------------------------------------------ */
/* P&L by Symbol（真實：依商品加總，取絕對值前 6 名）                    */
/* ------------------------------------------------------------------ */

export interface SymbolPnl {
  sym: string;
  pnl: number;
}

export function buildSymbolPnl(trades: Trade[]): SymbolPnl[] {
  const totals = new Map<string, number>();
  for (const tr of trades) {
    totals.set(tr.sym, (totals.get(tr.sym) ?? 0) + tr.pnl);
  }
  return [...totals.entries()]
    .map(([sym, pnl]) => ({ sym, pnl }))
    .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))
    .slice(0, 6);
}

/* ------------------------------------------------------------------ */
/* R-Multiple Distribution（真實：R 值分桶）                            */
/* ------------------------------------------------------------------ */

export interface RBucket {
  label: string;
  count: number;
  positive: boolean;
}

const R_EDGES = [-1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5];

export function buildRDistribution(trades: Trade[]): RBucket[] {
  // 桶：(-∞,-1.5)、[-1.5,-1)、…、[2.5,∞)
  const buckets: RBucket[] = [];
  const counts = Array<number>(R_EDGES.length + 1).fill(0);
  for (const tr of trades) {
    let idx = R_EDGES.findIndex((edge) => tr.r < edge);
    if (idx === -1) idx = R_EDGES.length;
    counts[idx] += 1;
  }
  for (let i = 0; i <= R_EDGES.length; i++) {
    const lower = i === 0 ? -Infinity : R_EDGES[i - 1];
    const label = i === 0 ? `<${R_EDGES[0]}` : `${lower}`;
    buckets.push({ label, count: counts[i], positive: lower >= 0 });
  }
  return buckets;
}

/* ------------------------------------------------------------------ */
/* Holding Time Distribution（真實）                                    */
/* ------------------------------------------------------------------ */

export interface HoldingDistribution {
  buckets: { label: string; count: number }[];
  avgText: string;
}

export function buildHoldingDistribution(trades: Trade[], lang: 'en' | 'zh'): HoldingDistribution {
  const defs =
    lang === 'en'
      ? [
          { max: 15, label: '<15m' },
          { max: 60, label: '15-60m' },
          { max: 240, label: '1-4h' },
          { max: 480, label: '4-8h' },
          { max: Infinity, label: '1d+' },
        ]
      : [
          { max: 15, label: '<15分' },
          { max: 60, label: '15-60分' },
          { max: 240, label: '1-4時' },
          { max: 480, label: '4-8時' },
          { max: Infinity, label: '1天+' },
        ];
  const counts = defs.map(() => 0);
  for (const tr of trades) {
    let idx = defs.findIndex((b) => tr.holdingMinutes <= b.max);
    if (idx === -1) idx = defs.length - 1;
    counts[idx] += 1;
  }
  const avgMin = trades.length ? trades.reduce((s, tr) => s + tr.holdingMinutes, 0) / trades.length : 0;
  const avgText =
    avgMin >= 60
      ? (avgMin / 60).toFixed(1) + (lang === 'en' ? 'h' : '時')
      : Math.round(avgMin) + (lang === 'en' ? 'm' : '分');
  return { buckets: defs.map((b, i) => ({ label: b.label, count: counts[i] })), avgText };
}

/* ------------------------------------------------------------------ */
/* Monthly Performance（僅真實資料：資料模型目前只含本月）               */
/* ------------------------------------------------------------------ */

export interface MonthlyPerf {
  label: string;
  pnl: number;
}

const MONTHS_EN_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 每月績效：依交易的真實年月分組（僅呈現有資料的月份），由舊到新排序。 */
export function buildMonthlyPerformance(trades: Trade[], lang: 'en' | 'zh'): MonthlyPerf[] {
  const byMonth = new Map<string, number>(); // key: yyyy-MM
  for (const tr of trades) {
    const key = tr.date.slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? 0) + tr.pnl);
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, pnl]) => {
      const monthIdx = Number(key.slice(5, 7)) - 1;
      const label = lang === 'en' ? MONTHS_EN_SHORT[monthIdx] : `${monthIdx + 1}月`;
      return { label, pnl: Math.round(pnl) };
    });
}

/* ------------------------------------------------------------------ */
/* Entry Hour Analysis（真實：只統計有 openedAt 時間戳的交易）          */
/* ------------------------------------------------------------------ */

export interface HourlyBucket {
  hour: number; // 0–23（本地時間）
  count: number;
  winRate: number; // 0–100
  pnl: number;
}

export interface HourlyStats {
  /** 只含有交易的時段，依小時排序。 */
  buckets: HourlyBucket[];
  /** 有進場時間戳的交易數（統計母體）。 */
  sampleCount: number;
  /** 全部交易數（供標示排除了多少筆）。 */
  totalCount: number;
}

/** 進場時段分析：依 openedAt 的小時分桶統計筆數/勝率/損益；無時間戳的交易明確排除。 */
export function buildHourlyStats(trades: Trade[]): HourlyStats {
  const withTs = trades.filter((tr) => tr.openedAt);
  const byHour = new Map<number, { count: number; wins: number; pnl: number }>();
  for (const tr of withTs) {
    const hour = new Date(tr.openedAt as string).getHours();
    const agg = byHour.get(hour) ?? { count: 0, wins: 0, pnl: 0 };
    agg.count += 1;
    if (tr.pnl >= 0) agg.wins += 1;
    agg.pnl += tr.pnl;
    byHour.set(hour, agg);
  }
  const buckets = [...byHour.entries()]
    .sort(([a], [b]) => a - b)
    .map(([hour, agg]) => ({
      hour,
      count: agg.count,
      winRate: Math.round((agg.wins / agg.count) * 100),
      pnl: Math.round(agg.pnl),
    }));
  return { buckets, sampleCount: withTs.length, totalCount: trades.length };
}

/* ------------------------------------------------------------------ */
/* Strategy Tag Performance（真實：依標籤分組）                         */
/* ------------------------------------------------------------------ */

export interface StrategyStat {
  tag: string;
  count: number;
  winRate: number;
  avgPnl: number;
  avgPnlText: string;
}

export function buildStrategyStats(trades: Trade[]): StrategyStat[] {
  const groups = new Map<string, Trade[]>();
  for (const tr of trades) {
    for (const tag of tr.tags) {
      const list = groups.get(tag) ?? [];
      list.push(tr);
      groups.set(tag, list);
    }
  }
  return [...groups.entries()]
    .map(([tag, list]) => {
      const wins = list.filter((x) => x.pnl >= 0).length;
      const avgPnl = list.reduce((s, x) => s + x.pnl, 0) / list.length;
      return {
        tag,
        count: list.length,
        winRate: Math.round((wins / list.length) * 100),
        avgPnl,
        avgPnlText: fmtMoney(avgPnl),
      };
    })
    .sort((a, b) => b.count - a.count);
}
