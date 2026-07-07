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
  /** 交易日期（ISO <c>yyyy-MM-dd</c>） */
  date: string;
  tags: string[];
  /** 持倉分鐘數 */
  holdingMinutes: number;
  /** 停損價（選填；有值時 R 以真實風險計算） */
  stopLoss?: number | null;
  /** 手續費（券商報表匯入才有值） */
  charges?: number | null;
  /** 進場時間（ISO 字串；券商報表匯入才有值） */
  openedAt?: string | null;
  /** 出場時間（ISO 字串；券商報表匯入才有值） */
  closedAt?: string | null;
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
