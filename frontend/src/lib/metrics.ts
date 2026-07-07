import type { Trade } from '@/types/trade';
import { fmtMoney } from './format';
import { parseISODate, toISODate, today } from './today';

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
  /** 一致性：有獲利的交易日佔比（0–100）。 */
  consistency: number;
  /** 恢復力：總獲利對最大回撤的覆蓋程度（0–100）。 */
  recovery: number;
  /** 期望值：每筆交易的期望損益（勝率×平均獲利 − 敗率×平均虧損）。 */
  expectancy: number;
  /** 目前連勝（正）或連敗（負）筆數；0 代表無交易。 */
  currentStreak: number;
  /** 最長連勝筆數。 */
  maxWinStreak: number;
  /** 最長連敗筆數。 */
  maxLossStreak: number;
  /** 最佳交易日（依日聚合損益；無交易時為 null）。 */
  bestDay: { date: string; pnl: number } | null;
  /** 最差交易日（依日聚合損益；無交易時為 null）。 */
  worstDay: { date: string; pnl: number } | null;
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

  // 一致性：以「日」聚合損益，計算獲利日佔交易日的比例。
  const pnlByDate = new Map<string, number>();
  for (const tr of trades) {
    pnlByDate.set(tr.date, (pnlByDate.get(tr.date) ?? 0) + tr.pnl);
  }
  const tradingDays = pnlByDate.size;
  const profitableDays = [...pnlByDate.values()].filter((v) => v >= 0).length;
  const consistency = tradingDays ? (profitableDays / tradingDays) * 100 : 0;

  // 恢復力：最大回撤佔總獲利的比例越小，恢復力越高。
  const recovery = grossWin > 0
    ? Math.max(0, Math.min(100, (1 - Math.abs(maxDrawdown) / grossWin) * 100))
    : 0;

  // 期望值：勝率×平均獲利 − 敗率×平均虧損。
  const lossRate = tradesCount ? (tradesCount - wins.length) / tradesCount : 0;
  const expectancy = tradesCount ? (winRate / 100) * avgWin - lossRate * avgLoss : 0;

  // 連勝/連敗：依日期由舊到新掃描（同日維持原順序）。
  const ordered = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  let currentStreak = 0;
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  for (const tr of ordered) {
    currentStreak = tr.pnl >= 0
      ? (currentStreak > 0 ? currentStreak + 1 : 1)
      : (currentStreak < 0 ? currentStreak - 1 : -1);
    if (currentStreak > maxWinStreak) maxWinStreak = currentStreak;
    if (-currentStreak > maxLossStreak) maxLossStreak = -currentStreak;
  }

  // 最佳/最差交易日：沿用上面的日聚合結果。
  let bestDay: { date: string; pnl: number } | null = null;
  let worstDay: { date: string; pnl: number } | null = null;
  for (const [date, pnl] of pnlByDate) {
    if (bestDay === null || pnl > bestDay.pnl) bestDay = { date, pnl };
    if (worstDay === null || pnl < worstDay.pnl) worstDay = { date, pnl };
  }

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
    consistency,
    recovery,
    expectancy,
    currentStreak,
    maxWinStreak,
    maxLossStreak,
    bestDay,
    worstDay,
  };
}

/** 依交易日期序累積權益，回傳最大回撤（負值）。 */
export function computeMaxDrawdown(trades: Trade[]): number {
  const ordered = [...trades].sort((a, b) => a.date.localeCompare(b.date));
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

/** 區間起始日（ISO）；all 回傳 null 代表不過濾。 */
function rangeStartISO(rangeKey: EquityRange): string | null {
  const now = today();
  switch (rangeKey) {
    case 'month':
      return toISODate(new Date(now.getFullYear(), now.getMonth(), 1));
    case 'quarter': {
      const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
      return toISODate(new Date(now.getFullYear(), qStartMonth, 1));
    }
    case 'year':
      return toISODate(new Date(now.getFullYear(), 0, 1));
    default:
      return null;
  }
}

/** 由真實交易組出損益序列（依區間過濾、按日期排序）。 */
function buildRangeEntries(
  rangeKey: EquityRange,
  trades: Trade[],
  lang: 'en' | 'zh',
): { date: string; pnl: number; label: string }[] {
  const months = lang === 'en' ? MONTHS_EN_SHORT : MONTHS_ZH;
  const start = rangeStartISO(rangeKey);

  return trades
    .filter((tr) => start === null || tr.date >= start)
    .map((tr) => {
      const d = parseISODate(tr.date);
      return { date: tr.date, pnl: tr.pnl, label: `${months[d.getMonth()]} ${d.getDate()}` };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
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

/** 6 軸交易評分（全部由真實交易推導）。軸標籤依專業慣例固定英文；描述依語言切換。 */
export function buildRadarAxes(kpis: Kpis, lang: 'en' | 'zh'): RadarAxis[] {
  const { winRate, profitFactor, avgWL, maxDrawdown, netPnl, consistency, recovery } = kpis;
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
    { label: 'Consistency', score: clamp(consistency), raw: Math.round(consistency) + '/100', desc: lang === 'en' ? 'Share of trading days closed profitably' : '獲利交易日佔比' },
    { label: 'Max DD', score: ddScore, raw: fmtMoney(maxDrawdown), desc: lang === 'en' ? 'Resilience to peak-to-trough loss' : '對高點回落虧損的承受度' },
    { label: 'Avg W/L', score: clamp((avgWL / 3) * 100), raw: avgWL.toFixed(1) + 'R', desc: lang === 'en' ? 'Average win size vs average loss' : '平均獲利與平均虧損的比值' },
    { label: 'Recovery', score: clamp(recovery), raw: Math.round(recovery) + '/100', desc: lang === 'en' ? 'Profit cover over drawdowns' : '獲利對回撤的覆蓋程度' },
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

/**
 * 月曆（週日開頭，依月份長度 4–6 週 + 週統計），由真實交易依日聚合。
 * monthOffset 0 = 本月；只聚合「顯示中的年月」的交易，任何月份都有真資料。
 */
export function buildCalendar(monthOffset = 0, trades: Trade[] = []): {
  cells: CalendarCell[];
  weeks: CalendarWeek[];
  year: number;
  monthIdx: number;
} {
  const now = today();
  const base = new Date(now.getFullYear(), now.getMonth(), 1);
  base.setMonth(base.getMonth() + monthOffset);
  const year = base.getFullYear();
  const monthIdx = base.getMonth();
  const firstDow = base.getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const weeksCount = Math.ceil((firstDow + daysInMonth) / 7);

  // 依日聚合「顯示中的年月」的真實交易。
  const monthPrefix = `${year}-${String(monthIdx + 1).padStart(2, '0')}-`;
  const byDay = new Map<number, { pnl: number; tradesCount: number; wins: number }>();
  for (const tr of trades) {
    if (tr.date.startsWith(monthPrefix) === false) continue;
    const dayNum = Number(tr.date.slice(8, 10));
    const agg = byDay.get(dayNum) ?? { pnl: 0, tradesCount: 0, wins: 0 };
    agg.pnl += tr.pnl;
    agg.tradesCount += 1;
    if (tr.pnl >= 0) agg.wins += 1;
    byDay.set(dayNum, agg);
  }

  const cells: CalendarCell[] = [];
  const weekBuckets: CalendarCell[][] = Array.from({ length: weeksCount }, () => []);

  for (let i = 0; i < weeksCount * 7; i++) {
    const dayNum = i - firstDow + 1;
    const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
    const agg = inMonth ? byDay.get(dayNum) : undefined;
    const weekIdx = Math.floor(i / 7);
    const cell: CalendarCell = {
      day: inMonth ? dayNum : '',
      pnl: agg ? Math.round(agg.pnl) : null,
      tradesCount: agg?.tradesCount ?? 0,
      wins: agg?.wins ?? 0,
      hasData: agg !== undefined,
      weekIdx,
    };
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

  return { cells, weeks, year, monthIdx };
}
