import type { Trade } from '@/types/trade';

/** 紀律規則。null 代表該規則停用。 */
export interface DisciplineRules {
  /** 單日最大交易筆數（過度交易）。 */
  maxTradesPerDay: number | null;
  /** 報復性交易間隔：虧損平倉後 M 分鐘內開新倉即違規（僅檢測有時間戳的交易）。 */
  revengeMinutes: number | null;
}

export const DEFAULT_DISCIPLINE_RULES: DisciplineRules = {
  maxTradesPerDay: null,
  revengeMinutes: null,
};

/** 解析儲存的規則 JSON；格式不符時回傳預設（全部停用）。 */
export function parseDisciplineRules(json: string | null | undefined): DisciplineRules {
  if (!json) return DEFAULT_DISCIPLINE_RULES;
  try {
    const raw = JSON.parse(json) as Partial<DisciplineRules>;
    return {
      maxTradesPerDay: typeof raw.maxTradesPerDay === 'number' && raw.maxTradesPerDay > 0 ? raw.maxTradesPerDay : null,
      revengeMinutes: typeof raw.revengeMinutes === 'number' && raw.revengeMinutes > 0 ? raw.revengeMinutes : null,
    };
  } catch {
    return DEFAULT_DISCIPLINE_RULES;
  }
}

/** 一筆違規。 */
export interface DisciplineViolation {
  /** 違規日（ISO）。 */
  date: string;
  rule: 'overtrade' | 'revenge';
  /** 補充資訊：overtrade 為當日筆數；revenge 為觸發的商品代號。 */
  detail: string;
}

/**
 * 依規則檢核交易，回傳違規清單（依日期排序）。
 * - overtrade：任一日筆數 > maxTradesPerDay → 該日一筆違規。
 * - revenge：虧損平倉（closedAt）後 revengeMinutes 分鐘內開新倉（openedAt）→ 每筆觸發交易一筆違規；
 *   僅檢測有時間戳的交易（貼上匯入），無時間戳者不在檢測範圍。
 */
export function detectViolations(trades: Trade[], rules: DisciplineRules): DisciplineViolation[] {
  const violations: DisciplineViolation[] = [];

  if (rules.maxTradesPerDay !== null) {
    const byDay = new Map<string, number>();
    for (const tr of trades) {
      byDay.set(tr.date, (byDay.get(tr.date) ?? 0) + 1);
    }
    for (const [date, count] of byDay) {
      if (count > rules.maxTradesPerDay) {
        violations.push({ date, rule: 'overtrade', detail: String(count) });
      }
    }
  }

  if (rules.revengeMinutes !== null) {
    const timestamped = trades
      .filter((tr) => tr.openedAt && tr.closedAt)
      .sort((a, b) => (a.openedAt as string).localeCompare(b.openedAt as string));
    for (let i = 0; i < timestamped.length; i++) {
      const current = timestamped[i];
      const openedMs = new Date(current.openedAt as string).getTime();
      // 找任何一筆更早開倉、虧損、且平倉時間落在 openedAt 前 M 分鐘內的交易。
      const triggered = timestamped.some((prev, j) => {
        if (j === i || prev.pnl >= 0) return false;
        const closedMs = new Date(prev.closedAt as string).getTime();
        const gapMinutes = (openedMs - closedMs) / 60000;
        return gapMinutes >= 0 && gapMinutes <= (rules.revengeMinutes as number);
      });
      if (triggered) {
        violations.push({ date: current.date, rule: 'revenge', detail: current.sym });
      }
    }
  }

  return violations.sort((a, b) => a.date.localeCompare(b.date));
}

/** 違規日集合（供月曆標示）。 */
export function violationDates(violations: DisciplineViolation[]): Set<string> {
  return new Set(violations.map((v) => v.date));
}
