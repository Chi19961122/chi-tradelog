import type { Trade } from '@/types/trade';
import type { TradeFormInput } from './tradeForm';
import { toISODate, today } from './today';

const HEADER = ['Date', 'Symbol', 'Side', 'Entry', 'Exit', 'Qty', 'PnL', 'R', 'Tags'];

/** CSV 欄位跳脫。 */
function esc(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** 將交易清單轉為 CSV 文字。 */
export function tradesToCsv(trades: Trade[]): string {
  const rows = trades.map((tr) => [
    tr.date,
    tr.sym,
    tr.side,
    tr.entry.toFixed(2),
    tr.exit.toFixed(2),
    tr.qty,
    tr.pnl.toFixed(2),
    tr.r.toFixed(2),
    tr.tags.join('; '),
  ]);
  return [HEADER, ...rows].map((r) => r.map(esc).join(',')).join('\n');
}

/** 範例 CSV（供「下載範例」；日期以執行期的本月為準）。 */
export function sampleCsv(): string {
  const now = today();
  const iso = (day: number) => toISODate(new Date(now.getFullYear(), now.getMonth(), day));
  const sample = [
    [iso(5), 'AAPL', 'Long', '210.50', '215.80', '50', '265.00', '2.7', 'breakout'],
    [iso(8), 'TSLA', 'Short', '260.00', '252.30', '30', '231.00', '1.5', 'reversal'],
  ];
  return [HEADER, ...sample].map((r) => r.join(',')).join('\n');
}

/** 解析單行 CSV（支援引號跳脫）。 */
function parseLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

/**
 * 解析 CSV 文字為新增交易輸入。損益/R 由後端於建立時重新計算。
 * 日期取完整 ISO 日期（<c>yyyy-MM-dd</c>）；tags 以 <c>;</c> 分隔。
 */
export function parseTradesCsv(text: string): TradeFormInput[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const inputs: TradeFormInput[] = [];
  for (const line of lines.slice(1)) {
    const cols = parseLine(line);
    if (cols.length < 8) continue;
    const [dateStr, sym, side, entryStr, exitStr, qtyStr, , , tagsStr] = cols;
    const date = (dateStr ?? '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(date) === false) continue; // 日期格式不符則跳過該列
    const tags = (tagsStr ?? '')
      .split(';')
      .map((x) => x.trim())
      .filter(Boolean);
    inputs.push({
      sym: (sym ?? '').trim().toUpperCase(),
      side: side === 'Short' ? 'Short' : 'Long',
      entry: parseFloat(entryStr) || 0,
      exit: parseFloat(exitStr) || 0,
      qty: parseInt(qtyStr, 10) || 1,
      date,
      tags: tags.length ? tags : ['manual'],
    });
  }
  return inputs;
}

/** 觸發瀏覽器下載文字檔。 */
export function downloadTextFile(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
