import type { Trade } from '@/types/trade';

/** 可排序的欄位。 */
export type TradeSortKey = 'day' | 'sym' | 'entry' | 'exit' | 'qty' | 'pnl' | 'r';

/** 排序狀態：欄位 + 方向。 */
export interface TradeSort {
  key: TradeSortKey;
  dir: 'asc' | 'desc';
}

/** 點擊欄位標題時的下一個排序狀態：新欄位 → 遞增；同欄位 → 遞增↔遞減。 */
export function nextSort(current: TradeSort | null, key: TradeSortKey): TradeSort {
  if (current?.key !== key) return { key, dir: 'asc' };
  return { key, dir: current.dir === 'asc' ? 'desc' : 'asc' };
}

/** 依排序狀態回傳新陣列（null 時保留原順序）。 */
export function sortTrades(trades: Trade[], sort: TradeSort | null): Trade[] {
  if (!sort) return trades;
  const factor = sort.dir === 'asc' ? 1 : -1;
  return [...trades].sort((a, b) => {
    const va = a[sort.key];
    const vb = b[sort.key];
    if (typeof va === 'string' && typeof vb === 'string') {
      return va.localeCompare(vb) * factor;
    }
    return ((va as number) - (vb as number)) * factor;
  });
}

/** 以關鍵字過濾（比對商品代號與標籤，不分大小寫；空字串回傳原陣列）。 */
export function searchTrades(trades: Trade[], query: string): Trade[] {
  const q = query.trim().toLowerCase();
  if (!q) return trades;
  return trades.filter(
    (tr) => tr.sym.toLowerCase().includes(q) || tr.tags.some((tag) => tag.toLowerCase().includes(q)),
  );
}
