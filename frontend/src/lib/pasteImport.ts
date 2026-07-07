import type { TradeFormInput } from './tradeForm';
import { toISODate } from './today';

/**
 * 「貼上智慧匯入」解析器：把券商報表複製出來的表格文字解析成新增交易輸入。
 *
 * 支援格式（每行一個欄位、每筆以 `Details` 行分隔；第一段開頭可含表頭標籤）：
 *   Broker / Account Name / Instrument / Open time / Close time /
 *   Side / Quantity / Entry Price / Exit Price / Net P&L / Charges / [Tags…]
 *
 * 淨損益處理：報表常以不帶負號的金額呈現虧損（以顏色區分），
 * 故「方向（正負）」由 進出場價差×方向 推導、「金額」取貼上的 Net P&L；
 * 若貼上值本身帶負號或括號則直接視為虧損。
 */

// 表頭標籤（會從第一段開頭剝除；比對時忽略大小寫）。
const HEADER_LABELS = new Set(
  [
    'trades',
    'broker',
    'account name',
    'instrument',
    'open time',
    'close time',
    'side',
    'quantity',
    'entry price',
    'exit price',
    'net p&l',
    'charges',
    'tags',
  ].map((s) => s.toLowerCase()),
);

/** 解析金額：去 $ 與千分位；支援 `-` 前綴與 `(1,234.00)` 括號負值。null 代表非金額。 */
export function parseMoney(raw: string): number | null {
  let s = raw.trim();
  if (!s) return null;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/[$,\s]/g, '');
  if (s.startsWith('-')) {
    negative = true;
    s = s.slice(1);
  }
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const value = parseFloat(s);
  return negative ? -value : value;
}

/** 解析 `2026/7/3 下午3:24:25`（也支援 AM/PM 與 24 小時制）；失敗回傳 null。 */
export function parseReportDateTime(raw: string): Date | null {
  const m = /^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(上午|下午|AM|PM)?\s*(\d{1,2}):(\d{2}):(\d{2})\s*(上午|下午|AM|PM)?$/i.exec(
    raw.trim(),
  );
  if (!m) return null;
  const [, y, mo, d, mer1, h, mi, se, mer2] = m;
  const meridiem = (mer1 ?? mer2 ?? '').toUpperCase();
  let hour = parseInt(h, 10);
  if ((meridiem === '下午' || meridiem === 'PM') && hour < 12) hour += 12;
  if ((meridiem === '上午' || meridiem === 'AM') && hour === 12) hour = 0;
  const date = new Date(+y, +mo - 1, +d, hour, +mi, +se);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** 單筆記錄區塊 → TradeFormInput；格式不符回傳 null（該筆跳過）。 */
function parseRecord(lines: string[]): TradeFormInput | null {
  // 位置對應（broker 與 account name 不進資料模型）：
  // [0] Broker [1] Account [2] Instrument [3] Open [4] Close [5] Side
  // [6] Qty [7] Entry [8] Exit [9] Net P&L [10] Charges [11+] Tags
  if (lines.length < 11) return null;

  const opened = parseReportDateTime(lines[3]);
  const closed = parseReportDateTime(lines[4]);
  const qty = /^\d+$/.test(lines[6].trim()) ? parseInt(lines[6], 10) : null;
  const entry = parseMoney(lines[7]);
  const exit = parseMoney(lines[8]);
  const netPnl = parseMoney(lines[9]);
  const charges = parseMoney(lines[10]);
  if (!opened || !closed || qty === null || entry === null || exit === null || netPnl === null) return null;

  const side = lines[5].trim().toLowerCase() === 'short' ? 'Short' : 'Long';
  // 方向由價差推導、金額取貼上值；貼上值已為負則維持虧損。
  const diff = side === 'Long' ? exit - entry : entry - exit;
  const pnl = netPnl < 0 ? netPnl : Math.abs(netPnl) * (diff < 0 ? -1 : 1);

  const tags = lines
    .slice(11)
    .flatMap((line) => line.split(/[,;]/))
    .map((tag) => tag.trim())
    .filter(Boolean);

  return {
    sym: lines[2].trim().toUpperCase(),
    side,
    entry,
    exit,
    qty,
    date: toISODate(opened),
    tags: tags.length ? tags : ['manual'],
    pnl: Math.round(pnl * 100) / 100,
    charges: charges ?? undefined,
    openedAt: opened.toISOString(),
    closedAt: closed.toISOString(),
  };
}

/** 解析整段貼上文字，回傳可匯入的交易輸入（解析不出的區塊自動跳過）。 */
export function parsePastedTrades(text: string): TradeFormInput[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // 以 `Details` 行為界切成區塊。
  const chunks: string[][] = [[]];
  for (const line of lines) {
    if (line.toLowerCase() === 'details') {
      chunks.push([]);
    } else {
      chunks[chunks.length - 1].push(line);
    }
  }

  const results: TradeFormInput[] = [];
  for (const chunk of chunks) {
    // 剝除開頭的表頭標籤（第一段通常含表頭 + 第一筆記錄）。
    let start = 0;
    while (start < chunk.length && HEADER_LABELS.has(chunk[start].toLowerCase())) {
      start += 1;
    }
    const record = parseRecord(chunk.slice(start));
    if (record) results.push(record);
  }
  return results;
}
