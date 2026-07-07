import type { Trade } from '@/types/trade';
import type { JournalSummary } from './behavior';
import type { DisciplineViolation } from './discipline';
import { isoInRange, type DateRange } from './dateRange';
import { fmtMoney } from './format';
import { today } from './today';

/** 上週週報已讀標記的 localStorage key（值 = 已讀那一週的週一 ISO）。 */
export const WEEKLY_READ_KEY = 'chi_weekly_read';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function iso(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** 取週區間（週一～週日）。offset 0 = 本週、-1 = 上週。 */
export function weekRange(offset: number): DateRange {
  const now = today();
  const dow = (now.getDay() + 6) % 7; // Mon = 0
  const monday = new Date(now);
  monday.setDate(now.getDate() - dow + offset * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: iso(monday), to: iso(sunday) };
}

/** 週報彙整結果。 */
export interface WeeklyReport {
  range: DateRange;
  tradesCount: number;
  netPnl: number;
  /** 勝率 0–100；無交易時為 0。 */
  winRate: number;
  bestTrade: Trade | null;
  worstTrade: Trade | null;
  /** 該週日記勾選的錯誤 recap（依次數排序）。 */
  mistakes: { label: string; count: number }[];
  /** 該週日記的情緒分佈（依次數排序）。 */
  emotions: { emotion: string; count: number }[];
  /** 該週紀律違規次數。 */
  violationsCount: number;
}

/** 彙整指定週的交易/日記/違規為週報。 */
export function buildWeeklyReport(
  trades: Trade[],
  journals: JournalSummary[],
  violations: DisciplineViolation[],
  range: DateRange,
): WeeklyReport {
  const weekTrades = trades.filter((tr) => isoInRange(tr.date, range));
  const wins = weekTrades.filter((tr) => tr.pnl >= 0).length;
  const netPnl = weekTrades.reduce((s, tr) => s + tr.pnl, 0);

  let bestTrade: Trade | null = null;
  let worstTrade: Trade | null = null;
  for (const tr of weekTrades) {
    if (bestTrade === null || tr.pnl > bestTrade.pnl) bestTrade = tr;
    if (worstTrade === null || tr.pnl < worstTrade.pnl) worstTrade = tr;
  }

  const weekJournals = journals.filter((j) => isoInRange(j.date, range));
  const mistakeCounts = new Map<string, number>();
  const emotionCounts = new Map<string, number>();
  for (const journal of weekJournals) {
    for (const mistake of journal.mistakes) {
      if (mistake.checked) mistakeCounts.set(mistake.label, (mistakeCounts.get(mistake.label) ?? 0) + 1);
    }
    for (const emotion of journal.emotions) {
      emotionCounts.set(emotion, (emotionCounts.get(emotion) ?? 0) + 1);
    }
  }

  return {
    range,
    tradesCount: weekTrades.length,
    netPnl: Math.round(netPnl),
    winRate: weekTrades.length ? Math.round((wins / weekTrades.length) * 100) : 0,
    bestTrade,
    worstTrade,
    mistakes: [...mistakeCounts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
    emotions: [...emotionCounts.entries()]
      .map(([emotion, count]) => ({ emotion, count }))
      .sort((a, b) => b.count - a.count),
    violationsCount: violations.filter((v) => isoInRange(v.date, range)).length,
  };
}

/** 週報 → Markdown（供一鍵複製到筆記工具）。 */
export function weeklyReportMarkdown(report: WeeklyReport, lang: 'en' | 'zh'): string {
  const zh = lang === 'zh';
  const lines: string[] = [];
  lines.push(`# ${zh ? '週回顧' : 'Weekly Review'} ${report.range.from} – ${report.range.to}`);
  lines.push('');
  lines.push(
    `- ${zh ? '交易' : 'Trades'}: ${report.tradesCount} | ${zh ? '淨損益' : 'Net P&L'}: ${fmtMoney(report.netPnl)} | ${zh ? '勝率' : 'Win rate'}: ${report.winRate}%`,
  );
  if (report.bestTrade) {
    lines.push(`- ${zh ? '最佳交易' : 'Best trade'}: ${report.bestTrade.sym} ${fmtMoney(report.bestTrade.pnl)} (${report.bestTrade.date})`);
  }
  if (report.worstTrade) {
    lines.push(`- ${zh ? '最差交易' : 'Worst trade'}: ${report.worstTrade.sym} ${fmtMoney(report.worstTrade.pnl)} (${report.worstTrade.date})`);
  }
  if (report.mistakes.length) {
    lines.push(`- ${zh ? '錯誤 recap' : 'Mistakes'}: ${report.mistakes.map((m) => `${m.label} ×${m.count}`).join(', ')}`);
  }
  if (report.emotions.length) {
    lines.push(`- ${zh ? '情緒分佈' : 'Emotions'}: ${report.emotions.map((e) => `${e.emotion} ×${e.count}`).join(', ')}`);
  }
  lines.push(`- ${zh ? '紀律違規' : 'Discipline violations'}: ${report.violationsCount}`);
  return lines.join('\n');
}
