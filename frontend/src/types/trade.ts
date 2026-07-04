export type TradeSide = 'Long' | 'Short';

/** 單筆交易。對應設計原型的資料模型。 */
export interface Trade {
  id: string;
  accountId: string;
  sym: string;
  side: TradeSide;
  /** R 倍數（風險報酬比） */
  r: number;
  /** 損益（美元） */
  pnl: number;
  entry: number;
  exit: number;
  qty: number;
  /** 當月第幾天（1–31，本原型以 2026 年 7 月為基準） */
  day: number;
  tags: string[];
  /** 持倉分鐘數 */
  holdingMinutes: number;
}

export interface Account {
  id: string;
  name: string;
}

export interface Platform {
  id: string;
  name: string;
  accounts: Account[];
}
