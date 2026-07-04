import type { Trade } from '@/types/trade';
import { fmtMoney } from './format';
import { seededRand } from './seededTrades';

/** 交易的基準月：2026 年 7 月（與 seed 資料一致）。 */
const BASE_YEAR = 2026;
const BASE_MONTH_IDX = 6; // July (0-based)

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
    const weekday = new Date(BASE_YEAR, BASE_MONTH_IDX, tr.day).getDay();
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
/* Monthly Performance（本月真實 + 前 5 月合成，無歷史資料）             */
/* ------------------------------------------------------------------ */

export interface MonthlyPerf {
  label: string;
  pnl: number;
}

const MONTHS_EN_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function buildMonthlyPerformance(trades: Trade[], lang: 'en' | 'zh'): MonthlyPerf[] {
  const currentPnl = trades.reduce((s, tr) => s + tr.pnl, 0);
  const result: MonthlyPerf[] = [];
  for (let monthsAgo = 5; monthsAgo >= 0; monthsAgo--) {
    const monthIdx = ((BASE_MONTH_IDX - monthsAgo) % 12 + 12) % 12;
    const label = lang === 'en' ? MONTHS_EN_SHORT[monthIdx] : `${monthIdx + 1}月`;
    const pnl =
      monthsAgo === 0
        ? Math.round(currentPnl)
        : Math.round((seededRand((monthsAgo + 1) * 17.3 * 3.1) - 0.35) * 6000);
    result.push({ label, pnl });
  }
  return result;
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
