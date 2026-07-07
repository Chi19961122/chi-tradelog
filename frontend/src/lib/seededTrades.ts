import type { Trade } from '@/types/trade';
import { currentMonthIdx, currentYear, toISODate } from './today';

/**
 * 確定性亂數與交易產生器 — 從設計原型（Trading Journal.dc.html）移植。
 * 讓 Dashboard 在接上真實 API 前，能以穩定、可重現的假資料驅動。
 * 之後 features/trades 的 query hook 可無痛切換到後端 GET /api/trades。
 */

export const SYMBOLS_LIST = [
  'AAPL', 'TSLA', 'NVDA', 'MSFT', 'QQQ', 'AMD',
  'META', 'AMZN', 'SPY', 'COIN', 'NFLX', 'GOOGL',
];

const TAG_POOL = ['breakout', 'earnings', 'reversal', 'trend', 'news', 'gap'];

/** 與原型相同的 seeded RNG，回傳 0–1。 */
export function seededRand(seed: number): number {
  const r = Math.sin(seed * 12.9898) * 43758.5453;
  return r - Math.floor(r);
}

/** 由 accountId 推導穩定的 seed offset。 */
function accountSeed(accountId: string): number {
  let h = 0;
  for (let i = 0; i < accountId.length; i++) {
    h = (h * 31 + accountId.charCodeAt(i)) % 97;
  }
  return h;
}

function buildTrades(seedOffset: number): Omit<Trade, 'accountId'>[] {
  const off = seedOffset || 0;
  const syms = SYMBOLS_LIST;
  const trades: Omit<Trade, 'accountId'>[] = [];
  for (let i = 0; i < 24; i++) {
    const seed = i + 1 + off * 41.7;
    const sym = syms[(i + Math.floor(off)) % syms.length];
    const side = seededRand(seed * 3.1) > 0.45 ? 'Long' : 'Short';
    const win = seededRand(seed * 7.7) > 0.4;
    const r = win
      ? 0.4 + seededRand(seed * 5.3) * 3.2
      : -(0.2 + seededRand(seed * 9.1) * 1.4);
    const pnl = r * (80 + seededRand(seed * 2.2) * 60);
    const entry = 40 + seededRand(seed * 1.7) * 400;
    const exit = entry + (side === 'Long' ? pnl / 10 : -pnl / 10);
    const qty = 10 + Math.round(seededRand(seed * 4.4) * 90);
    // 與後端 seed 一致：本月第 1–30 天（短月由 Date 自動進位無妨，僅 demo 用）。
    const day = 1 + Math.floor(seededRand(seed * 6.6) * 30);
    const date = toISODate(new Date(currentYear(), currentMonthIdx(), day));
    const tags = [TAG_POOL[i % TAG_POOL.length]];
    const holdingMinutes = Math.round(
      3 + seededRand(seed * 11.3) * (seededRand(seed * 13.1) > 0.7 ? 600 : 90),
    );
    trades.push({ id: String(i), sym, side, r, pnl, entry, exit, qty, date, tags, holdingMinutes });
  }
  trades.sort((a, b) => b.date.localeCompare(a.date));
  return trades;
}

/** 產生某帳戶的交易（id 前綴帳戶，確保跨帳戶唯一）。 */
export function getTradesForAccount(accountId: string): Trade[] {
  const seed = accountSeed(accountId);
  return buildTrades(seed).map((tr) => ({
    ...tr,
    id: `${accountId}#${tr.id}`,
    accountId,
  }));
}

/** 合併多帳戶交易（多選帳戶時所有交易一併呈現）。 */
export function getTradesForAccounts(accountIds: string[]): Trade[] {
  return accountIds.flatMap((id) => getTradesForAccount(id));
}
