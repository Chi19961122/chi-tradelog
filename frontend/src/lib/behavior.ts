import type { Trade } from '@/types/trade';
import type { MistakeItem } from './journal';

/** 日記摘要（行為分析用；不含 notes）。 */
export interface JournalSummary {
  accountId: string;
  symbol: string;
  /** 日記日期（ISO <c>yyyy-MM-dd</c>）。 */
  date: string;
  emotions: string[];
  mistakes: MistakeItem[];
}

/** 單一情緒標籤的績效統計。 */
export interface EmotionStat {
  emotion: string;
  /** 出現該情緒的日記篇數（= 樣本數）。 */
  count: number;
  /** 關聯交易日損益合計。 */
  totalPnl: number;
  /** 平均每篇日記的關聯損益。 */
  avgPnl: number;
}

/** 單一錯誤項（checked）的累積成本統計。 */
export interface MistakeCost {
  label: string;
  /** 勾選該錯誤的日記篇數（= 樣本數）。 */
  count: number;
  /** 關聯交易日損益合計。 */
  totalPnl: number;
}

/** 日記 key（帳戶|商品|日期）→ 該交易日的損益合計。 */
function linkedPnlByKey(trades: Trade[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const tr of trades) {
    const key = `${tr.accountId}|${tr.sym}|${tr.date}`;
    map.set(key, (map.get(key) ?? 0) + tr.pnl);
  }
  return map;
}

/** 取日記關聯的交易日損益；無對應交易（孤兒日記）回傳 null，統計時排除。 */
function journalPnl(journal: JournalSummary, pnlByKey: Map<string, number>): number | null {
  return pnlByKey.get(`${journal.accountId}|${journal.symbol}|${journal.date}`) ?? null;
}

/**
 * 情緒 × 績效：各情緒標籤關聯交易日的平均/累積損益與出現次數。
 * 只統計有對應交易的日記；依出現次數由多到少排序。
 */
export function buildEmotionStats(trades: Trade[], journals: JournalSummary[]): EmotionStat[] {
  const pnlByKey = linkedPnlByKey(trades);
  const groups = new Map<string, { count: number; totalPnl: number }>();
  for (const journal of journals) {
    const pnl = journalPnl(journal, pnlByKey);
    if (pnl === null) continue;
    for (const emotion of journal.emotions) {
      const agg = groups.get(emotion) ?? { count: 0, totalPnl: 0 };
      agg.count += 1;
      agg.totalPnl += pnl;
      groups.set(emotion, agg);
    }
  }
  return [...groups.entries()]
    .map(([emotion, agg]) => ({
      emotion,
      count: agg.count,
      totalPnl: Math.round(agg.totalPnl),
      avgPnl: Math.round(agg.totalPnl / agg.count),
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * 錯誤成本：各勾選錯誤項（checked=true）關聯交易日的累積損益與次數。
 * 只統計有對應交易的日記；依累積損益由低到高排序（最傷的在前）。
 */
export function buildMistakeCosts(trades: Trade[], journals: JournalSummary[]): MistakeCost[] {
  const pnlByKey = linkedPnlByKey(trades);
  const groups = new Map<string, { count: number; totalPnl: number }>();
  for (const journal of journals) {
    const pnl = journalPnl(journal, pnlByKey);
    if (pnl === null) continue;
    for (const mistake of journal.mistakes) {
      if (mistake.checked === false) continue;
      const agg = groups.get(mistake.label) ?? { count: 0, totalPnl: 0 };
      agg.count += 1;
      agg.totalPnl += pnl;
      groups.set(mistake.label, agg);
    }
  }
  return [...groups.entries()]
    .map(([label, agg]) => ({ label, count: agg.count, totalPnl: Math.round(agg.totalPnl) }))
    .sort((a, b) => a.totalPnl - b.totalPnl);
}
