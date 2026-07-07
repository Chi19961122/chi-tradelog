import type { Trade, TradeSide } from '@/types/trade';
import { seededRand } from './seededTrades';
import { todayISO } from './today';

/** Add/Edit Trade 表單的輸入（選填欄位供券商報表匯入帶入原始值）。 */
export interface TradeFormInput {
  sym: string;
  side: TradeSide;
  entry: number;
  exit: number;
  qty: number;
  /** 交易日期（ISO <c>yyyy-MM-dd</c>）。 */
  date: string;
  tags: string[];
  /** 明確帶入的淨損益（期貨等有合約乘數的商品；未帶入時以價差計算）。 */
  pnl?: number;
  /** 手續費（選填）。 */
  charges?: number;
  /** 進場時間（ISO 字串，選填）。 */
  openedAt?: string;
  /** 出場時間（ISO 字串，選填）。 */
  closedAt?: string;
}

export const EMPTY_TRADE_FORM: TradeFormInput = {
  sym: '',
  side: 'Long',
  entry: 0,
  exit: 0,
  qty: 0,
  date: '',
  tags: [],
};

/**
 * 由表單輸入計算衍生欄位（pnl、r、holdingMinutes），與後端 TradeService 相同。
 * 用於 mock 模式下即時產生交易；API 模式下後端會回傳權威值。
 */
export function computeTradeFields(input: TradeFormInput): {
  pnl: number;
  r: number;
  holdingMinutes: number;
  tags: string[];
  date: string;
  sym: string;
  side: TradeSide;
} {
  const side: TradeSide = input.side === 'Short' ? 'Short' : 'Long';
  const sym = input.sym.trim().toUpperCase();
  // 淨損益優先採用明確帶入的值（與後端 TradeService 一致）。
  const pnl = input.pnl ?? (side === 'Long' ? input.exit - input.entry : input.entry - input.exit) * input.qty;
  const r = Math.round((pnl / 100) * 100) / 100;
  const date = input.date || todayISO();
  // 持倉分鐘數優先由進／出場時間戳推導。
  const holdingMinutes = input.openedAt && input.closedAt
    ? Math.max(0, Math.round((new Date(input.closedAt).getTime() - new Date(input.openedAt).getTime()) / 60000))
    : 30 + Math.round(seededRand((input.entry + input.exit + input.qty) * 7.7) * 400);
  const tags = input.tags.map((tag) => tag.trim()).filter(Boolean);
  return { pnl: Math.round(pnl * 100) / 100, r, holdingMinutes, tags: tags.length ? tags : ['manual'], date, sym, side };
}

/** 由表單輸入建立一筆新的 Trade（mock 模式用）。 */
export function buildMockTrade(accountId: string, input: TradeFormInput, id: string): Trade {
  const c = computeTradeFields(input);
  return {
    id,
    accountId,
    sym: c.sym,
    side: c.side,
    entry: input.entry,
    exit: input.exit,
    qty: input.qty,
    date: c.date,
    r: c.r,
    pnl: c.pnl,
    tags: c.tags,
    holdingMinutes: c.holdingMinutes,
    charges: input.charges ?? null,
    openedAt: input.openedAt ?? null,
    closedAt: input.closedAt ?? null,
  };
}
