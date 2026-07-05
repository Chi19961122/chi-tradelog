import type { Trade } from '@/types/trade';
import { fmtMoney } from './format';
import { seededRand } from './seededTrades';

/** Dashboard 用的核心 KPI 集合。 */
export interface Kpis {
  netPnl: number;
  winRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  avgWL: number;
  maxDrawdown: number;
  balance: number;
  tradesCount: number;
  winsCount: number;
}

/** 由交易陣列計算 KPI。maxDrawdown 依累積權益曲線的高點至低點計算。 */
export function computeKpis(trades: Trade[], initialCapital: number): Kpis {
  const tradesCount = trades.length || 0;
  const wins = trades.filter((x) => x.pnl >= 0);
  const netPnl = trades.reduce((s, x) => s + x.pnl, 0);
  const winRate = tradesCount ? (wins.length / tradesCount) * 100 : 0;
  const grossWin = wins.reduce((s, x) => s + x.pnl, 0);
  const grossLoss = Math.abs(
    trades.filter((x) => x.pnl < 0).reduce((s, x) => s + x.pnl, 0),
  );
  const profitFactor = grossLoss ? grossWin / grossLoss : 0;
  const avgWin = grossWin / (wins.length || 1);
  const avgLoss = grossLoss / (tradesCount - wins.length || 1);
  const avgWL = avgLoss ? avgWin / avgLoss : 0;
  const maxDrawdown = computeMaxDrawdown(trades);

  return {
    netPnl,
    winRate,
    profitFactor,
    avgWin,
    avgLoss,
    avgWL,
    maxDrawdown,
    balance: initialCapital + netPnl,
    tradesCount,
    winsCount: wins.length,
  };
}

/** 依交易日序累積權益，回傳最大回撤（負值）。 */
export function computeMaxDrawdown(trades: Trade[]): number {
  const ordered = [...trades].sort((a, b) => a.day - b.day);
  let running = 0;
  let peak = 0;
  let maxDd = 0;
  for (const t of ordered) {
    running += t.pnl;
    if (running > peak) peak = running;
    const dd = running - peak;
    if (dd < maxDd) maxDd = dd;
  }
  return Math.round(maxDd);
}

/* ------------------------------------------------------------------ */
/* Equity Curve                                                        */
/* ------------------------------------------------------------------ */

export type EquityRange = 'all' | 'month' | 'quarter' | 'year';

export interface EquityPoint {
  label: string | null;
  value: number;
}

const MONTHS_EN_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_ZH = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const CUR_MONTH_IDX = 6; // July (0-based)

function syntheticMonthEntries(monthsAgo: number): { day: number; pnl: number }[] {
  const entries: { day: number; pnl: number }[] = [];
  for (let i = 0; i < 16; i++) {
    const seed = monthsAgo * 37.1 + i * 5.3;
    const win = seededRand(seed * 7.7) > 0.42;
    const r = win
      ? 0.4 + seededRand(seed * 5.3) * 3.2
      : -(0.2 + seededRand(seed * 9.1) * 1.4);
    const pnl = r * (80 + seededRand(seed * 2.2) * 60);
    const day = 1 + Math.floor(seededRand(seed * 6.6) * 27);
    entries.push({ day, pnl });
  }
  return entries;
}

/** 依區間組出（含歷史合成月）的損益序列，按時間排序。 */
function buildRangeEntries(
  rangeKey: EquityRange,
  trades: Trade[],
  lang: 'en' | 'zh',
): { absDay: number; pnl: number; label: string }[] {
  const monthsBack = { month: 0, quarter: 2, year: 11, all: 11 }[rangeKey] ?? 0;
  const months = lang === 'en' ? MONTHS_EN_SHORT : MONTHS_ZH;

  const entries = trades.map((tr) => ({
    absDay: tr.day,
    pnl: tr.pnl,
    label: `${months[CUR_MONTH_IDX]} ${tr.day}`,
  }));

  for (let m = 1; m <= monthsBack; m++) {
    const monthIdx = (((CUR_MONTH_IDX - m) % 12) + 12) % 12;
    const monthName = months[monthIdx];
    syntheticMonthEntries(m).forEach((e) => {
      entries.push({ absDay: -m * 31 + e.day, pnl: e.pnl, label: `${monthName} ${e.day}` });
    });
  }

  entries.sort((a, b) => a.absDay - b.absDay);
  return entries;
}

/** 累積權益資料點，供 Recharts 使用。首點為 0（起始資金基準）。 */
export function buildEquityData(
  trades: Trade[],
  range: EquityRange,
  lang: 'en' | 'zh',
): { points: EquityPoint[]; current: number; high: number; low: number } {
  const entries = buildRangeEntries(range, trades, lang);
  let running = 0;
  const points: EquityPoint[] = [{ label: null, value: 0 }];
  entries.forEach((e) => {
    running += e.pnl;
    points.push({ label: e.label, value: running });
  });
  const values = points.map((p) => p.value);
  return {
    points,
    current: values[values.length - 1],
    high: Math.max(...values),
    low: Math.min(...values),
  };
}

/* ------------------------------------------------------------------ */
/* Trade Score radar                                                   */
/* ------------------------------------------------------------------ */

export interface RadarAxis {
  label: string;
  score: number; // 0–100
  raw: string;
  desc: string;
}

/** 6 軸交易評分。軸標籤依專業慣例固定英文；描述依語言切換。 */
export function buildRadarAxes(kpis: Kpis, lang: 'en' | 'zh'): RadarAxis[] {
  const { winRate, profitFactor, avgWL, maxDrawdown, netPnl } = kpis;
  const consistencyScore = 40 + seededRand(7.7) * 55;
  const recoveryScore = 40 + seededRand(13.3) * 55;
  const ddScore = Math.max(
    5,
    Math.min(
      100,
      100 - (Math.abs(maxDrawdown) / Math.max(1, Math.abs(netPnl) + Math.abs(maxDrawdown))) * 140,
    ),
  );
  const clamp = (n: number) => Math.max(0, Math.min(100, n));

  return [
    { label: 'Win Rate', score: clamp(winRate), raw: winRate.toFixed(1) + '%', desc: lang === 'en' ? 'Share of trades closed profitably' : '獲利交易佔比' },
    { label: 'Profit Factor', score: clamp((profitFactor / 3) * 100), raw: profitFactor.toFixed(2), desc: lang === 'en' ? 'Gross profit ÷ gross loss' : '總獲利 ÷ 總虧損' },
    { label: 'Consistency', score: consistencyScore, raw: Math.round(consistencyScore) + '/100', desc: lang === 'en' ? 'Stability of returns across weeks' : '每週報酬的穩定程度' },
    { label: 'Max DD', score: ddScore, raw: fmtMoney(maxDrawdown), desc: lang === 'en' ? 'Resilience to peak-to-trough loss' : '對高點回落虧損的承受度' },
    { label: 'Avg W/L', score: clamp((avgWL / 3) * 100), raw: avgWL.toFixed(1) + 'R', desc: lang === 'en' ? 'Average win size vs average loss' : '平均獲利與平均虧損的比值' },
    { label: 'Recovery', score: recoveryScore, raw: Math.round(recoveryScore) + '/100', desc: lang === 'en' ? 'Speed of rebound after drawdowns' : '回撤後的恢復速度' },
  ];
}

export function tradeScore(axes: RadarAxis[]): number {
  return axes.reduce((s, a) => s + a.score, 0) / axes.length;
}

/* ------------------------------------------------------------------ */
/* Calendar                                                            */
/* ------------------------------------------------------------------ */

export interface CalendarCell {
  day: number | '';
  pnl: number | null;
  tradesCount: number;
  wins: number;
  hasData: boolean;
  weekIdx: number;
}

export interface CalendarWeek {
  cells: CalendarCell[];
  stat: {
    pnl: number;
    tradesCount: number;
    wins: number;
    winRate: number;
    hasData: boolean;
  };
}

/** 月曆（週日開頭，5 週 × 7 天 + 週統計）。monthOffset 0 = 2026 年 7 月。 */
export function buildCalendar(monthOffset = 0): {
  cells: CalendarCell[];
  weeks: CalendarWeek[];
  year: number;
  monthIdx: number;
} {
  const seedBase = monthOffset * 97.3;
  const base = new Date(2026, 6, 1);
  base.setMonth(base.getMonth() + monthOffset);
  const firstDow = base.getDay(); // 0 = Sunday
  const daysInMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();

  const cells: CalendarCell[] = [];
  const weekBuckets: CalendarCell[][] = [[], [], [], [], []];

  for (let i = 0; i < 35; i++) {
    const dayNum = i - firstDow + 1;
    const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
    const seed = i + 11 + seedBase;
    const hasData = inMonth && seededRand(seed * 4.7) > 0.28;
    let pnl: number | null = null;
    let tradesCount = 0;
    let wins = 0;
    if (hasData) {
      pnl = Math.round((seededRand(seed * 8.3) - 0.42) * 900);
      tradesCount = 1 + Math.floor(seededRand(seed * 2.9) * 4);
      wins =
        pnl >= 0
          ? Math.ceil(tradesCount * (0.5 + seededRand(seed * 1.1) * 0.5))
          : Math.floor(tradesCount * seededRand(seed * 1.3) * 0.5);
    }
    const weekIdx = Math.floor(i / 7);
    const cell: CalendarCell = { day: inMonth ? dayNum : '', pnl, tradesCount, wins, hasData, weekIdx };
    cells.push(cell);
    weekBuckets[weekIdx].push(cell);
  }

  const weeks: CalendarWeek[] = weekBuckets.map((wk) => {
    const withData = wk.filter((c) => c.hasData);
    const pnl = withData.reduce((s, c) => s + (c.pnl ?? 0), 0);
    const tradesCount = withData.reduce((s, c) => s + c.tradesCount, 0);
    const wins = withData.reduce((s, c) => s + c.wins, 0);
    const winRate = tradesCount ? Math.round((wins / tradesCount) * 100) : 0;
    return { cells: wk, stat: { pnl, tradesCount, wins, winRate, hasData: withData.length > 0 } };
  });

  return { cells, weeks, year: base.getFullYear(), monthIdx: base.getMonth() };
}

/** 依日曆格子重建當日交易明細（供 day-detail modal）。 */
export function buildDayTrades(
  day: number,
  cell: CalendarCell,
  symbolsList: string[],
): { sym: string; side: 'Long' | 'Short'; pnl: number; entry: number; exit: number; qty: number; r: number }[] {
  const list = [];
  for (let i = 0; i < cell.tradesCount; i++) {
    const seed = day * 13.7 + i * 4.1;
    const sym = symbolsList[Math.floor(seededRand(seed * 2.1) * symbolsList.length)];
    const side: 'Long' | 'Short' = seededRand(seed * 5.5) > 0.5 ? 'Long' : 'Short';
    const isWin = i < cell.wins;
    const share = (cell.pnl ?? 0) / Math.max(1, cell.tradesCount);
    const jitter = (seededRand(seed * 7.3) - 0.5) * Math.abs(share) * 0.6;
    const pnl = isWin
      ? Math.abs(share) + Math.abs(jitter) + 5
      : -(Math.abs(share) * 0.6 + Math.abs(jitter));
    const entry = 40 + seededRand(seed * 1.9) * 350;
    const qty = 10 + Math.round(seededRand(seed * 3.3) * 80);
    const exit = entry + (side === 'Long' ? pnl / qty : -pnl / qty);
    const r = pnl / 100;
    list.push({ sym, side, pnl, entry, exit, qty, r });
  }
  return list;
}
