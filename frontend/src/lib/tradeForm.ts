import type { Trade, TradeSide } from '@/types/trade';
import { seededRand } from './seededTrades';

/** Add/Edit Trade 表單的輸入。 */
export interface TradeFormInput {
  sym: string;
  side: TradeSide;
  entry: number;
  exit: number;
  qty: number;
  day: number;
  tags: string[];
}

export const EMPTY_TRADE_FORM: TradeFormInput = {
  sym: '',
  side: 'Long',
  entry: 0,
  exit: 0,
  qty: 0,
  day: 1,
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
  day: number;
  sym: string;
  side: TradeSide;
} {
  const side: TradeSide = input.side === 'Short' ? 'Short' : 'Long';
  const sym = input.sym.trim().toUpperCase();
  const pnl = (side === 'Long' ? input.exit - input.entry : input.entry - input.exit) * input.qty;
  const r = Math.round((pnl / 100) * 100) / 100;
  const day = Math.max(1, Math.min(31, input.day || 1));
  const holdingMinutes = 30 + Math.round(seededRand((input.entry + input.exit + input.qty) * 7.7) * 400);
  const tags = input.tags.map((tag) => tag.trim()).filter(Boolean);
  return { pnl: Math.round(pnl * 100) / 100, r, holdingMinutes, tags: tags.length ? tags : ['manual'], day, sym, side };
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
    day: c.day,
    r: c.r,
    pnl: c.pnl,
    tags: c.tags,
    holdingMinutes: c.holdingMinutes,
  };
}
